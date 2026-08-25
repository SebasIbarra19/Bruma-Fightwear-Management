-- Cierra un hueco de la migración de Fase 0 (20260825000000) que quedó abierto
-- para toda función NUEVA, y que se detectó al crear la bitácora de actividad.
--
-- QUÉ PASÓ
-- Fase 0 hizo dos cosas:
--   1. REVOKE EXECUTE ON ALL ROUTINES ... FROM PUBLIC, anon, authenticated
--      → cerró correctamente las ~82 funciones que existían en ese momento.
--   2. ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON ROUTINES FROM PUBLIC
--      → pensado para que las funciones futuras nacieran cerradas.
--
-- El paso 2 solo revoca de PUBLIC. Pero Supabase mantiene sus propios
-- privilegios por defecto que CONCEDEN EXECUTE a `anon` y `authenticated`
-- sobre las funciones nuevas del esquema public. Como el default de Fase 0 no
-- los menciona, esos grants siguieron aplicándose.
--
-- Por qué no se notó antes: entre Fase 0 y hoy, las migraciones solo usaron
-- CREATE OR REPLACE sobre funciones que YA existían (create_category,
-- next_product_code…), y eso PRESERVA los privilegios de la función anterior
-- —que estaban revocados—. El agujero solo aparece con funciones realmente
-- nuevas, y las primeras fueron las de la bitácora.
--
-- Verificado en vivo antes de este arreglo: con la anon key,
--   POST /rest/v1/rpc/list_actividad    → devolvía la bitácora completa
--   POST /rest/v1/rpc/registrar_evento  → insertaba una fila falsa
-- o sea, lectura de movimientos de dinero y falsificación de auditoría.


-- ---------------------------------------------------------------------------
-- 1. Cerrar las funciones nuevas que quedaron expuestas
-- ---------------------------------------------------------------------------
-- Se repite el REVOKE global en vez de nombrarlas una por una: es idempotente,
-- cubre cualquier otra que se haya escapado, y no depende de que esta lista
-- esté completa.

REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO service_role;


-- ---------------------------------------------------------------------------
-- 2. Que las funciones futuras nazcan cerradas DE VERDAD
-- ---------------------------------------------------------------------------
-- La diferencia con Fase 0 es nombrar explícitamente a anon y authenticated.
-- Sin esto, cada función nueva vuelve a nacer abierta.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON ROUTINES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO service_role;

-- Mismo razonamiento para las tablas: `registro_actividad` ya tiene RLS y sus
-- permisos explícitos, pero una tabla nueva sin RLS sería legible por anon.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;


-- ---------------------------------------------------------------------------
-- 3. Borrar las filas falsas que dejó la prueba de intrusión
-- ---------------------------------------------------------------------------

DELETE FROM public.registro_actividad
WHERE descripcion IN ('INYECTADO POR ANON', 'PRUEBA DE FUGA - borrar');

NOTIFY pgrst, 'reload schema';
