-- Revierte 20260831000000. El enfoque no podía funcionar y conviene que quede
-- escrito por qué, para que nadie lo reintente.
--
-- La idea era limpiar los avatares con un trigger SQL sobre `perfil_usuario`,
-- borrando filas de `storage.objects`. Supabase lo impide deliberadamente con
-- una guarda propia:
--
--   42501 — "Direct deletion from storage tables is not allowed.
--            Use the Storage API instead."
--   hint:  "This prevents accidental data loss from orphaned objects."
--
-- Y tiene razón: `storage.objects` es solo la metadata. Borrar la fila dejaría
-- el binario en el backend de almacenamiento sin nada que lo referencie —
-- exactamente la fuga que se quería evitar, pero ahora invisible.
--
-- La limpieza pasa entonces a la capa de aplicación, que sí puede llamar a la
-- Storage API (`perfil-adapter.ts`):
--
--   · Reemplazo de avatar (el caso frecuente): al subir uno nuevo se borra el
--     anterior con `storage.remove()`. Resuelto.
--   · Borrado de cuenta: hoy la aplicación NO tiene ningún flujo para eliminar
--     usuarios —se hace desde el dashboard de Supabase—, así que no hay dónde
--     enganchar la limpieza. Queda anotado en el roadmap (3.3.b) en vez de
--     fingir que un trigger lo cubre.

DROP TRIGGER IF EXISTS trg_limpiar_avatares ON public.perfil_usuario;
DROP FUNCTION IF EXISTS public.limpiar_avatares_del_usuario();
DROP FUNCTION IF EXISTS public.borrar_avatar_por_url(text);

NOTIFY pgrst, 'reload schema';
