-- ================================================
-- Polish pass: expose size (talla_codigo) and collection
-- (coleccion_nombre) data that these SPs were silently dropping,
-- causing indistinguishable SKUs and non-functional collection filters.
-- ================================================

-- Fix get_inventory_movements: return the fields needed to build a
-- distinguishing SKU (producto_codigo, variante_codigo, talla_codigo).
-- Previously returned only producto_nombre/variante_nombre.
DROP FUNCTION IF EXISTS public.get_inventory_movements(integer, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_inventory_movements(
  p_id_producto_talla integer DEFAULT NULL,
  p_tipo_movimiento text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_movimiento integer,
  id_producto_talla integer,
  producto_nombre character varying,
  producto_codigo character varying,
  variante_codigo character varying,
  talla_codigo character varying,
  tipo_movimiento character varying,
  cantidad integer,
  motivo text,
  fecha timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id_movimiento,
    m.id_producto_talla,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    pv.codigo_variante AS variante_codigo,
    tb.codigo AS talla_codigo,
    m.tipo_movimiento,
    m.cantidad,
    m.motivo,
    m.fecha
  FROM public.inventario_movimiento m
  JOIN public.productotallastock pts ON pts.id_producto_talla = m.id_producto_talla
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE (p_id_producto_talla IS NULL OR m.id_producto_talla = p_id_producto_talla)
    AND (p_tipo_movimiento IS NULL OR m.tipo_movimiento = p_tipo_movimiento)
  ORDER BY m.fecha DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Fix list_inventory_items: add coleccion_nombre (this function already
-- returns talla_codigo from migration 20260808000000 — this only adds
-- the collection join on top of that).
DROP FUNCTION IF EXISTS public.list_inventory_items(boolean, integer, integer, integer);

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
  ORDER BY p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Fix list_products: add id_coleccion/coleccion_nombre so the Catalog
-- page can filter products by collection.
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
  fecha_creacion timestamp without time zone
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
    p.fecha_creacion
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

-- Fix update_product: add p_id_coleccion so the Catalog edit flow can
-- change a product's collection (mirrors the create_product fix from
-- migration 20260807120000).
DROP FUNCTION IF EXISTS public.update_product(integer, character varying, character varying, text, integer, boolean);

CREATE OR REPLACE FUNCTION public.update_product(
  p_id_producto integer,
  p_nombre character varying DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_descripcion text DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_id_coleccion integer DEFAULT NULL,
  p_activo boolean DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  codigo character varying,
  descripcion text,
  id_categoria integer,
  categoria_nombre character varying,
  id_coleccion integer,
  coleccion_nombre character varying,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.producto p
    SET
      nombre = COALESCE(p_nombre, p.nombre),
      codigo = COALESCE(p_codigo, p.codigo),
      descripcion = COALESCE(p_descripcion, p.descripcion),
      id_categoria = COALESCE(p_id_categoria, p.id_categoria),
      id_coleccion = COALESCE(p_id_coleccion, p.id_coleccion),
      activo = COALESCE(p_activo, p.activo)
    WHERE p.id_producto = p_id_producto
    RETURNING p.*
  )
  SELECT
    u.id_producto,
    u.nombre,
    u.codigo,
    u.descripcion,
    u.id_categoria,
    c.nombre AS categoria_nombre,
    u.id_coleccion,
    col.nombre AS coleccion_nombre,
    u.activo
  FROM updated u
  LEFT JOIN public.tipoproducto c ON c.id_tipo = u.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = u.id_coleccion;
$$;

-- Fix get_product: add id_coleccion/coleccion_nombre at the top level,
-- and enrich each variant's stock_tallas with talla_codigo so the edit
-- UI can show human-readable sizes instead of raw ids.
DROP FUNCTION IF EXISTS public.get_product(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_product(
  p_id_producto integer DEFAULT NULL,
  p_codigo character varying DEFAULT NULL
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
  variantes jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE(var_json.variantes, '[]'::jsonb) AS variantes
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN LATERAL (
    SELECT
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    WHERE pv.id_producto = p.id_producto
  ) vs ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_variante', pv.id_variante,
        'id_color', pv.id_color,
        'codigo_variante', pv.codigo_variante,
        'nombre_variante', pv.nombre_variante,
        'precio_variante', pv.precio_variante,
        'activo', pv.activo,
        'stock_tallas', (
           SELECT jsonb_agg(jsonb_build_object(
             'id_producto_talla', pts.id_producto_talla,
             'id_talla_proveedor', pts.id_talla_proveedor,
             'talla_codigo', tb.codigo,
             'stock', pts.stock,
             'precio', pts.precio
           ))
           FROM public.productotallastock pts
           LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
           LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
           WHERE pts.id_variante = pv.id_variante
        )
      )
    ) AS variantes
    FROM public.productovariante pv
    WHERE pv.id_producto = p.id_producto
  ) var_json ON TRUE
  WHERE (p_id_producto IS NOT NULL AND p.id_producto = p_id_producto)
     OR (p_id_producto IS NULL AND p_codigo IS NOT NULL AND p.codigo = p_codigo)
  LIMIT 1;
$$;
