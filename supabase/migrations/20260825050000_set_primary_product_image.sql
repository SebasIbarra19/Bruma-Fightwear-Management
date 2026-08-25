-- Marcar una imagen ya existente como portada.
--
-- `add_product_image` sabe poner la principal al INSERTAR, pero no había forma de
-- cambiarla después sin volver a subir el archivo. La alternativa era re-insertar
-- la misma URL, lo que dejaba la imagen duplicada en la galería.
--
-- Las dos actualizaciones van juntas en la función para que no exista un instante
-- con dos portadas o con ninguna.

CREATE OR REPLACE FUNCTION public.set_primary_product_image(p_id_imagen integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_producto integer;
BEGIN
  SELECT id_producto INTO v_id_producto
    FROM public.producto_imagen
   WHERE id_imagen = p_id_imagen;

  IF v_id_producto IS NULL THEN
    RAISE EXCEPTION 'Imagen % no encontrada', p_id_imagen;
  END IF;

  UPDATE public.producto_imagen
     SET es_principal = (id_imagen = p_id_imagen)
   WHERE id_producto = v_id_producto;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_primary_product_image(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_primary_product_image(integer) TO service_role;

NOTIFY pgrst, 'reload schema';
