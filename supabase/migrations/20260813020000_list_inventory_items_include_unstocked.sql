DROP FUNCTION IF EXISTS public.list_inventory_items(boolean, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.list_inventory_items(
  p_incluir_stock_cero boolean DEFAULT false,
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_incluir_sin_stock_row boolean DEFAULT false
)
RETURNS TABLE (
  id_producto_talla integer,
  id_producto integer,
  id_variante integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  coleccion_nombre character varying,
  variante_nombre character varying,
  variante_codigo character varying,
  talla_codigo character varying,
  stock integer,
  precio numeric,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pts.id_producto_talla,
    p.id_producto,
    pv.id_variante,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    col.nombre AS coleccion_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    tb.codigo AS talla_codigo,
    pts.stock,
    pts.precio,
    CASE
      WHEN pts.stock <= 0 THEN 'critical'
      WHEN pts.stock <= 5 THEN 'warning'
      ELSE 'normal'
    END AS status
  FROM public.productotallastock pts
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE (p_incluir_stock_cero OR pts.stock > 0)
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)

  UNION ALL

  SELECT
    NULL::integer AS id_producto_talla,
    p.id_producto,
    pv.id_variante,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    col.nombre AS coleccion_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    NULL::character varying AS talla_codigo,
    0 AS stock,
    COALESCE(pv.precio_variante, 0) AS precio,
    'critical' AS status
  FROM public.productovariante pv
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  WHERE p_incluir_sin_stock_row
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    AND NOT EXISTS (
      SELECT 1 FROM public.productotallastock pts2 WHERE pts2.id_variante = pv.id_variante
    )

  ORDER BY producto_nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;
