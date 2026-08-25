-- Reglas de SKU centralizadas en la base.
--
-- Problema que resuelve: el SKU no existe como columna, se compone al leer a
-- partir de tres códigos que viven en tablas distintas (producto.codigo,
-- productovariante.codigo_variante, tallabase.codigo). Esa composición estaba
-- duplicada en tres lugares con tres reglas distintas —dos en TypeScript, una
-- en SQL— así que el mismo ítem se mostraba diferente en Inventory, Movements
-- y Orders. Además la rama de respaldo del adaptador de inventario descartaba
-- el código de variante, con lo que dos variantes del mismo producto (BCO y
-- NEG) rendían un identificador idéntico.
--
-- A partir de acá hay UNA sola definición (`build_sku`) y los SP la aplican,
-- así que ninguna pantalla puede divergir.


-- ---------------------------------------------------------------------------
-- 1. Prefijo por categoría
-- ---------------------------------------------------------------------------
-- Los códigos reales de BRUMA ya seguían la convención
-- <prefijo>-BRU-<secuencia> (RSH-BRU-001, PSL-BRU-001, TSH-BRU-001), donde el
-- prefijo son las iniciales de la categoría. Se formaliza como dato en vez de
-- quedar implícito en cada código escrito a mano.

ALTER TABLE public.tipoproducto
  ADD COLUMN IF NOT EXISTS prefijo character varying(3);

COMMENT ON COLUMN public.tipoproducto.prefijo IS
  'Prefijo de 3 letras para el código de producto autogenerado (ver next_product_code).';

UPDATE public.tipoproducto SET prefijo = 'RSH' WHERE nombre = 'Rashguard'       AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'PSL' WHERE nombre = 'Panta-Sin-Licra' AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'PCL' WHERE nombre = 'Panta-Con-Licra' AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'TSH' WHERE nombre = 'T-Shirt'         AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'GIS' WHERE nombre = 'GI-Solapa'       AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'GIP' WHERE nombre = 'GI-Pantalon'     AND prefijo IS NULL;
UPDATE public.tipoproducto SET prefijo = 'HOO' WHERE nombre = 'Hoodie'          AND prefijo IS NULL;


-- ---------------------------------------------------------------------------
-- 2. Regla de LECTURA: cómo se arma un SKU a partir de sus piezas
-- ---------------------------------------------------------------------------
-- Siempre prefiere el código de variante sobre el de producto: la variante es
-- lo que distingue negro de blanco, descartarla hacía colisionar dos productos
-- distintos. La talla se agrega como sufijo solo si existe.
--
-- Devuelve NULL si no hay ningún código (producto borrado / referencia rota).
-- NUNCA devuelve texto explicativo: un campo SKU con una frase adentro deja de
-- ser un identificador. Cómo mostrar "sin talla" es decisión de la UI, que
-- para eso recibe `talla_codigo` por separado.

CREATE OR REPLACE FUNCTION public.build_sku(
  p_producto_codigo character varying,
  p_variante_codigo character varying,
  p_talla_codigo character varying
)
RETURNS character varying
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_variante_codigo, p_producto_codigo)
         || COALESCE('-' || p_talla_codigo, '');
$$;

COMMENT ON FUNCTION public.build_sku IS
  'Única definición de cómo se compone un SKU. Todo SP que exponga SKU debe usarla.';


-- ---------------------------------------------------------------------------
-- 3. Regla de GENERACIÓN: siguiente código para una categoría
-- ---------------------------------------------------------------------------
-- Formato <prefijo>-BRU-<###>, con la secuencia contada POR PREFIJO (los tres
-- productos reales son 001 cada uno en su categoría, no una serie global).
--
-- 'BRU' va fijo: BRUMA es una sola marca. Si algún día hay otra, este es el
-- punto donde se parametriza.
--
-- Si la categoría no tiene prefijo cargado se derivan las 3 primeras letras de
-- su nombre, y si no hay categoría se usa 'GEN'. Nunca falla: crear un producto
-- no debe bloquearse por un dato de configuración faltante.
--
-- ponytail: la secuencia se calcula con MAX()+1 sin bloqueo. Dos creaciones
-- simultáneas podrían pedir el mismo número; el UNIQUE de producto.codigo lo
-- rechaza y basta reintentar. Con el volumen de una marca de ropa no amerita
-- una tabla de secuencias — si algún día se crean productos en lote, cambiar
-- por un SEQUENCE por prefijo.

CREATE OR REPLACE FUNCTION public.next_product_code(p_id_categoria integer)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefijo text;
  v_seq     integer;
BEGIN
  SELECT COALESCE(
           NULLIF(tp.prefijo, ''),
           upper(substring(regexp_replace(tp.nombre, '[^a-zA-Z0-9]', '', 'g') from 1 for 3))
         )
    INTO v_prefijo
    FROM public.tipoproducto tp
   WHERE tp.id_tipo = p_id_categoria;

  -- Sanea por si el nombre trajera algo raro: el prefijo se interpola en una
  -- expresión regular más abajo.
  v_prefijo := upper(regexp_replace(COALESCE(v_prefijo, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_prefijo := COALESCE(NULLIF(v_prefijo, ''), 'GEN');

  SELECT COALESCE(MAX((substring(p.codigo from '^' || v_prefijo || '-BRU-(\d+)$'))::integer), 0) + 1
    INTO v_seq
    FROM public.producto p;

  RETURN v_prefijo || '-BRU-' || lpad(v_seq::text, 3, '0');
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. create_product usa la regla de generación
-- ---------------------------------------------------------------------------
-- Antes derivaba el código del nombre (upper + quitar no-alfanuméricos), lo que
-- producía códigos sin estructura (HOODIEPRUEBA) y, peor, colisionaba: como
-- producto.codigo es UNIQUE NOT NULL, dos nombres que solo difieren en espacios
-- o puntuación reventaban con violación de constraint. Un código explícito
-- sigue teniendo prioridad.

CREATE OR REPLACE FUNCTION public.create_product(
  p_nombre character varying,
  p_descripcion text DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_id_coleccion integer DEFAULT NULL,
  p_id_proveedor integer DEFAULT NULL,
  p_activo boolean DEFAULT TRUE
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  id_coleccion integer,
  id_proveedor integer,
  activo boolean,
  fecha_creacion timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.producto (
      nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo
    )
    VALUES (
      p_nombre,
      p_descripcion,
      COALESCE(NULLIF(p_codigo, ''), public.next_product_code(p_id_categoria)),
      p_id_categoria,
      p_id_coleccion,
      p_id_proveedor,
      COALESCE(p_activo, TRUE)
    )
    RETURNING id_producto, nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo, fecha_creacion
  )
  SELECT id_producto, nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo, fecha_creacion
  FROM inserted;
$$;


-- ---------------------------------------------------------------------------
-- 5. Los SP exponen `sku` ya compuesto
-- ---------------------------------------------------------------------------
-- Agregar una columna al RETURNS TABLE obliga a DROP: no se puede cambiar el
-- tipo de retorno con CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.list_inventory_items(boolean, integer, integer, integer, boolean);

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
  sku character varying,
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
    public.build_sku(p.codigo, pv.codigo_variante, tb.codigo) AS sku,
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

  -- Variantes sin ninguna fila de stock: no tienen talla, así que su SKU es el
  -- de la variante sin sufijo. Antes esta rama devolvía el código del PRODUCTO
  -- más la frase '— No size set', lo que hacía que blanco y negro rindieran el
  -- mismo string.
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
    public.build_sku(p.codigo, pv.codigo_variante, NULL) AS sku,
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
  sku character varying,
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
    public.build_sku(p.codigo, pv.codigo_variante, tb.codigo) AS sku,
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


-- get_order_details ya devolvía `sku`, pero con la fórmula escrita a mano
-- (migración 20260821000000). Ahora delega en build_sku como los otros dos.

CREATE OR REPLACE FUNCTION public.get_order_details(
  p_id_pedido integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pedido', to_jsonb(o),
    'cliente', to_jsonb(c),
    'items', COALESCE((
      SELECT jsonb_agg(
               to_jsonb(oi) || jsonb_build_object(
                 'producto_nombre', p.nombre,
                 'variante_nombre', pv.nombre_variante,
                 'talla_codigo', tb.codigo,
                 'sku', public.build_sku(p.codigo, pv.codigo_variante, tb.codigo)
               )
               ORDER BY oi.id_pedido_detalle
             )
      FROM public.pedidodetalle oi
      LEFT JOIN public.productotallastock pts
             ON pts.id_producto_talla = oi.id_producto_talla
      LEFT JOIN public.productovariante pv
             ON pv.id_variante = pts.id_variante
      LEFT JOIN public.producto p
             ON p.id_producto = pv.id_producto
      LEFT JOIN public.tallaproveedor tp
             ON tp.id_talla_proveedor = pts.id_talla_proveedor
      LEFT JOIN public.tallabase tb
             ON tb.id_talla = tp.id_talla
      WHERE oi.id_pedido = o.id_pedido
    ), '[]'::jsonb)
  )
  FROM public.pedido o
  LEFT JOIN public.cliente c ON c.id_cliente = o.id_cliente
  WHERE o.id_pedido = p_id_pedido
  LIMIT 1;
$$;
