-- Imágenes de producto: exponer la principal en los listados.
--
-- La tabla `producto_imagen` y los SPs `add_product_image` / `get_product_images`
-- existen desde el esquema inicial y nunca los llamó nadie. Mientras tanto, la UI
-- mostraba `/imports/image-3.png` hardcodeado para TODOS los productos — un
-- archivo que no existe en `public/`, así que cada tarjeta rendereaba el SVG de
-- imagen rota. En inventario alguien parcheó el síntoma con un guard que compara
-- contra esa ruta (`item.img !== "/imports/image-3.png"`) en vez de quitarla.
--
-- Acá se agrega lo único que faltaba del lado de la base: que los listados
-- devuelvan la URL de la imagen principal, para no tener que pedir las imágenes
-- producto por producto (N+1) solo para pintar una grilla.
--
-- `es_principal DESC, orden ASC` es el mismo criterio que ya usa
-- `get_product_images`, así que la portada coincide con la primera imagen del
-- detalle.


-- ---------------------------------------------------------------------------
-- 1. list_products devuelve imagen_url
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.list_products(integer, integer, integer, boolean, text);

CREATE OR REPLACE FUNCTION public.list_products(
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_activo boolean DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  categoria_nombre character varying,
  id_coleccion integer,
  coleccion_nombre character varying,
  activo boolean,
  variante_count bigint,
  stock_total bigint,
  fecha_creacion timestamp without time zone,
  imagen_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH variant_stats AS (
    SELECT
      pv.id_producto,
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    GROUP BY pv.id_producto
  )
  SELECT
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.codigo,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.id_coleccion,
    col.nombre AS coleccion_nombre,
    p.activo,
    COALESCE(vs.variante_count, 0)::bigint AS variante_count,
    COALESCE(vs.stock_total, 0)::bigint AS stock_total,
    p.fecha_creacion,
    (
      SELECT pi.url
        FROM public.producto_imagen pi
       WHERE pi.id_producto = p.id_producto
       ORDER BY pi.es_principal DESC, pi.orden ASC
       LIMIT 1
    ) AS imagen_url
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN variant_stats vs ON vs.id_producto = p.id_producto
  WHERE (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    AND (p_activo IS NULL OR p.activo = p_activo)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.nombre ILIKE '%' || p_search || '%'
      OR COALESCE(p.codigo, '') ILIKE '%' || p_search || '%'
      OR COALESCE(c.nombre, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY p.fecha_creacion DESC, p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;


-- ---------------------------------------------------------------------------
-- 2. Borrar una imagen
-- ---------------------------------------------------------------------------
-- Faltaba: se podía agregar pero no quitar. Devuelve la url para que la capa de
-- API sepa qué archivo borrar del bucket y no queden huérfanos ocupando espacio.

CREATE OR REPLACE FUNCTION public.delete_product_image(p_id_imagen integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  DELETE FROM public.producto_imagen
   WHERE id_imagen = p_id_imagen
  RETURNING url INTO v_url;

  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Imagen % no encontrada', p_id_imagen;
  END IF;

  RETURN v_url;
END;
$$;


-- Mismo criterio que 20260825000000: nace cerrada, solo service_role.
REVOKE EXECUTE ON FUNCTION public.list_products(integer, integer, integer, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.list_products(integer, integer, integer, boolean, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.delete_product_image(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.delete_product_image(integer) TO service_role;

NOTIFY pgrst, 'reload schema';
