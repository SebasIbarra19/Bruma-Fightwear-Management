-- Fase 0.1 — Cerrar la ejecución de funciones a anon/authenticated.
--
-- El problema, reproducido en vivo contra el proyecto remoto con la anon key
-- (la que viaja en el bundle del browser, en un repo público):
--
--   POST /rest/v1/rpc/adjust_inventory {"p_id_producto_talla":999999,...}
--   → {"code":"P0001","message":"Registro de stock no encontrado para id 999999"}
--
-- Ese P0001 es la validación interna del propio SP: LA FUNCIÓN SE EJECUTÓ. Con un
-- id_producto_talla real habría modificado stock. En cambio GET /rest/v1/producto
-- devuelve [], o sea que el RLS sí protege las TABLAS — el agujero son las
-- FUNCIONES.
--
-- Causa: ~82 funciones SECURITY DEFINER y cero GRANT/REVOKE en las migraciones.
-- Postgres otorga EXECUTE a PUBLIC por defecto, PostgREST publica cada función en
-- /rest/v1/rpc/<nombre>, y al ser SECURITY DEFINER corren como owner salteando el
-- RLS. Las tres cosas juntas hacen que la anon key sea una llave de escritura.
--
-- Decisión (ver ROADMAP.md): TODO el acceso pasa por rutas de API del servidor,
-- que usan service_role tras verificar identidad. Por eso se revoca a anon y
-- authenticated sobre todo, en vez de escribir ~80 políticas RLS para expresar
-- "cualquier admin puede todo" en un sistema sin multi-tenancy ni roles.
--
-- Verificado antes de aplicar: ningún componente con "use client" llama .rpc(),
-- así que revocar no rompe ninguna pantalla.


-- 1. Cerrar lo que ya existe.
--
-- PUBLIC es el rol implícito del que anon y authenticated heredan; revocar solo a
-- estos dos dejaría el permiso vivo por herencia.
REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated;


-- 2. Devolverle EXECUTE a service_role.
--
-- ⚠️ Imprescindible: service_role saltea RLS pero NO los privilegios de EXECUTE.
-- Sin este GRANT el paso 1 rompe la aplicación entera, no solo al atacante.
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO service_role;


-- 3. Que las funciones FUTURAS nazcan cerradas.
--
-- Sin esto, la próxima migración que cree un SP reabre el agujero en silencio:
-- los pasos 1 y 2 solo afectan a las funciones existentes hoy.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO service_role;


-- 4. Que PostgREST relea el esquema y deje de exponer lo revocado.
NOTIFY pgrst, 'reload schema';
