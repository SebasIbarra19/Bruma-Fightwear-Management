-- Fix create_product: add id_coleccion/id_proveedor support (producto table
-- already has both columns; the SP just never exposed them).
DROP FUNCTION IF EXISTS public.create_product(character varying, text, character varying, integer, boolean);

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
      COALESCE(p_codigo, upper(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '', 'g'))),
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

-- New: create_collection, mirrors the existing create_category shape.
CREATE OR REPLACE FUNCTION public.create_collection(
  p_nombre character varying,
  p_descripcion text DEFAULT NULL
)
RETURNS TABLE (
  id_coleccion integer,
  nombre character varying,
  descripcion text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.coleccion (nombre, descripcion)
    VALUES (p_nombre, p_descripcion)
    RETURNING id_coleccion, nombre, descripcion
  )
  SELECT id_coleccion, nombre, descripcion FROM inserted;
$$;

-- Fix adjust_inventory: key off id_producto_talla directly (the caller,
-- InventoryAdapter.adjustInventory, already only has that id available).
DROP FUNCTION IF EXISTS public.adjust_inventory(integer, integer, integer, text);

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_id_producto_talla integer,
  p_cantidad_cambio integer,
  p_motivo text DEFAULT 'ajuste manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_actual integer;
  v_nuevo_stock integer;
  v_tipo_movimiento text;
BEGIN
  SELECT stock INTO v_stock_actual
  FROM public.productotallastock
  WHERE id_producto_talla = p_id_producto_talla;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para id_producto_talla %', p_id_producto_talla;
  END IF;

  v_nuevo_stock := v_stock_actual + p_cantidad_cambio;
  v_tipo_movimiento := CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END;

  UPDATE public.productotallastock
  SET stock = GREATEST(v_nuevo_stock, 0)
  WHERE id_producto_talla = p_id_producto_talla;

  INSERT INTO public.inventario_movimiento (
    id_producto_talla, tipo_movimiento, cantidad, motivo
  ) VALUES (
    p_id_producto_talla, v_tipo_movimiento, ABS(p_cantidad_cambio), p_motivo
  );

  RETURN jsonb_build_object(
    'id_producto_talla', p_id_producto_talla,
    'stock_anterior', v_stock_actual,
    'cambio', p_cantidad_cambio,
    'stock_nuevo', GREATEST(v_nuevo_stock, 0),
    'tipo_movimiento', v_tipo_movimiento,
    'success', TRUE
  );
END;
$$;
