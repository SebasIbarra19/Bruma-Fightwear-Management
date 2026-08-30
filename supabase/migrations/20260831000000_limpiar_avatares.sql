-- 3.3.b — Avatares huérfanos en Storage.
--
-- Hallazgo al verificar 3.3: borrar una cuenta se lleva la fila de
-- `perfil_usuario` por la FK (verificado), pero **el archivo del avatar queda
-- en el bucket para siempre**. Storage no participa del `ON DELETE CASCADE`:
-- la FK solo conoce tablas, no objetos.
--
-- El trigger va sobre `perfil_usuario` y NO sobre `auth.users`, por dos razones:
-- esa tabla es nuestra (no hay que pedir privilegios sobre el esquema `auth`),
-- y el `ON DELETE CASCADE` dispara igual los triggers de la tabla hija. Así que
-- borrar la cuenta llega acá de todos modos, y borrar el perfil a mano también
-- limpia — que es lo correcto en ambos casos.
--
-- ⚠️ Alcance real: se borra la fila de `storage.objects`, que es lo que hace al
-- archivo inaccesible y lo saca de todo listado. El binario en el backend de
-- almacenamiento queda para que Supabase lo recolecte por su cuenta; no hay
-- forma de forzar esa parte desde SQL.


CREATE OR REPLACE FUNCTION public.limpiar_avatares_del_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Los avatares se guardan como `<uuid>/<archivo>` (ver `uploadAvatar` en
  -- perfil-adapter.ts). Esa carpeta por usuario es justamente lo que hace que
  -- limpiar sea barrer un prefijo en vez de rastrear URLs una por una.
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE OLD.id_usuario::text || '/%';

  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.limpiar_avatares_del_usuario IS
  'Borra los avatares del usuario al eliminarse su perfil. Storage no participa del ON DELETE CASCADE.';

DROP TRIGGER IF EXISTS trg_limpiar_avatares ON public.perfil_usuario;
CREATE TRIGGER trg_limpiar_avatares
  AFTER DELETE ON public.perfil_usuario
  FOR EACH ROW EXECUTE FUNCTION public.limpiar_avatares_del_usuario();


/**
 * Borra un avatar puntual por su URL pública.
 *
 * Lo usa el reemplazo de avatar: subir uno nuevo dejaba el anterior en el
 * bucket, así que cada cambio de foto filtraba un archivo. El caso frecuente
 * es este, no el borrado de cuenta.
 *
 * Recibe la URL y no la ruta porque es lo que el perfil tiene guardado. Se
 * queda con lo que sigue a `/avatars/`; si la URL no tiene esa forma no borra
 * nada, en vez de arriesgarse a interpretar mal un texto arbitrario.
 */
CREATE OR REPLACE FUNCTION public.borrar_avatar_por_url(p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_path text;
BEGIN
  IF p_url IS NULL OR position('/avatars/' in p_url) = 0 THEN
    RETURN;
  END IF;

  v_path := split_part(p_url, '/avatars/', 2);
  IF v_path = '' THEN
    RETURN;
  END IF;

  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars' AND name = v_path;
END;
$$;

GRANT EXECUTE ON FUNCTION public.borrar_avatar_por_url(text) TO service_role;

NOTIFY pgrst, 'reload schema';
