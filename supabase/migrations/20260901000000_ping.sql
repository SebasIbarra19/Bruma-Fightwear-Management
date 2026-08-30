-- 3.8 — Keep-alive: evitar que Supabase pause el proyecto por inactividad.
--
-- ⚠️ La premisa original del backlog no funciona: un trigger de Postgres se
-- dispara ante eventos de datos, **no puede auto-invocarse por tiempo**. Hace
-- falta un agendador externo. Acá se resuelve el lado de la base; el que llama
-- es un cron de GitHub Actions (`.github/workflows/keep-alive.yml`), que ya
-- vive donde vive el repo y no depende de que haya un deploy.
--
-- ⚠️ Interacción con Fase 0: aquella migración revocó `EXECUTE` sobre TODO el
-- esquema a `anon` y dejó un `ALTER DEFAULT PRIVILEGES` para que las funciones
-- nuevas nazcan cerradas. Por eso esta necesita un `GRANT` explícito: sin él,
-- el ping respondería `PGRST202` y no tocaría la base.
--
-- Por qué es seguro abrirla a `anon`, siendo la única excepción al cierre:
--   · No lee ninguna tabla. Devuelve la hora del servidor y nada más.
--   · No acepta parámetros, así que no hay superficie que manipular.
--   · Lo que revela —que el proyecto existe y su hora— ya es público: la URL y
--     la anon key viajan en el bundle del navegador.
-- Es deliberadamente lo más aburrido posible: su único trabajo es que la
-- petición llegue a Postgres y cuente como actividad.

CREATE OR REPLACE FUNCTION public.ping()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now();
$$;

COMMENT ON FUNCTION public.ping() IS
  'Keep-alive. Única función abierta a anon: no lee datos, no acepta parámetros.';

GRANT EXECUTE ON FUNCTION public.ping() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
