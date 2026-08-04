-- ================================================
-- STORED PROCEDURE: list_inventory_items
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_inventory_items(
  p_incluir_stock_cero boolean DEFAULT false,
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_producto_talla integer,
  id_producto integer,
  id_variante integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  variante_nombre character varying,
  variante_codigo character varying,
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
    pv.nombre_variante,
    pv.codigo_variante,
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
  WHERE (p_incluir_stock_cero OR pts.stock > 0)
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
  ORDER BY p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;
