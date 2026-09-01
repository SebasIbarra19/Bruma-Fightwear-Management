-- Cerrar las tablas de facturación, que quedaron abiertas a la anon key.
--
-- ⚠️ FUGA REAL, comprobada con la anon key —la misma que viaja en el bundle
-- del navegador y que cualquier visitante puede leer:
--
--   GET /rest/v1/factura              → 1 fila
--   GET /rest/v1/factura_item         → 1 fila
--   GET /rest/v1/factura_consecutivo  → 1 fila
--
-- Es decir: montos, fechas, estado de cobro y numeración de facturas legibles
-- por cualquiera. `factura_descuento` devolvía vacío solo porque la tabla no
-- tiene filas todavía — el agujero es el mismo.
--
-- CAUSA: la migración de RLS (20260713000000) enumera **una por una** las 20
-- tablas del esquema inicial. Las cuatro de facturación se crearon después
-- (20260814000000 y 20260815000000) y nunca entraron en esa lista. Es el
-- hallazgo que reporta el advisor de Supabase.
--
-- Se aplica el mismo criterio de Fase 0 y de `registro_actividad`: además de
-- activar RLS, se REVOCA el acceso a `anon` y `authenticated`. La diferencia
-- importa: solo con RLS la consulta devuelve una lista vacía —indistinguible
-- de "no hay datos"—, mientras que con el REVOKE devuelve `42501 permission
-- denied`, que es un no rotundo y no depende de que nadie agregue después una
-- política permisiva por descuido.
--
-- Todo el acceso a datos pasa por rutas de API con `service_role` (verificado:
-- ningún componente de cliente consulta tablas; el navegador solo usa Supabase
-- para autenticación), así que revocar no rompe nada.

ALTER TABLE public.factura             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_item        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_descuento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_consecutivo ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.factura             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.factura_item        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.factura_descuento   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.factura_consecutivo FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.factura             TO service_role;
GRANT ALL ON public.factura_item        TO service_role;
GRANT ALL ON public.factura_descuento   TO service_role;
GRANT ALL ON public.factura_consecutivo TO service_role;


-- Segunda capa sobre las 20 tablas originales. Ya tenían RLS, así que hoy
-- devuelven vacío ante la anon key; el REVOKE las lleva a `42501` y las deja
-- protegidas aunque alguien agregue una política permisiva más adelante.
--
-- `ALL TABLES IN SCHEMA` en vez de enumerarlas: precisamente enumerar fue lo
-- que dejó afuera a las cuatro de facturación cuando aparecieron después.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Y que las tablas NUEVAS nazcan cerradas, para que este descuido no se repita
-- la próxima vez que alguien agregue una.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Las secuencias siguen la misma suerte: sin ellas `service_role` no puede
-- insertar en tablas con columnas SERIAL.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

NOTIFY pgrst, 'reload schema';
