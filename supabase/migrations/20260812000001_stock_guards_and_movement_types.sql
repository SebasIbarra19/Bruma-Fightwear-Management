DROP FUNCTION IF EXISTS public.adjust_inventory(integer, integer, text);

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_id_producto_talla integer,
  p_cantidad_cambio integer,
  p_motivo text DEFAULT 'ajuste manual',
  p_tipo_movimiento text DEFAULT NULL
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

  IF v_nuevo_stock < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', v_stock_actual, ABS(p_cantidad_cambio);
  END IF;

  v_tipo_movimiento := COALESCE(p_tipo_movimiento, CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END);

  UPDATE public.productotallastock
  SET stock = v_nuevo_stock
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
    'stock_nuevo', v_nuevo_stock,
    'tipo_movimiento', v_tipo_movimiento,
    'success', TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_order_item(
  p_id_pedido integer,
  p_id_producto_talla integer,
  p_cantidad integer,
  p_precio_unitario numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_detalle integer;
  v_stock_actual integer;
BEGIN
  SELECT stock INTO v_stock_actual
  FROM public.productotallastock
  WHERE id_producto_talla = p_id_producto_talla;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para id_producto_talla %', p_id_producto_talla;
  END IF;

  IF v_stock_actual < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', v_stock_actual, p_cantidad;
  END IF;

  INSERT INTO public.pedidodetalle (
    id_pedido, id_producto_talla, cantidad, precio_unitario
  ) VALUES (
    p_id_pedido, p_id_producto_talla, p_cantidad, p_precio_unitario
  )
  RETURNING id_pedido_detalle INTO v_id_detalle;

  UPDATE public.productotallastock
  SET stock = stock - p_cantidad
  WHERE id_producto_talla = p_id_producto_talla;

  INSERT INTO public.inventario_movimiento (
    id_producto_talla, tipo_movimiento, cantidad, motivo, referencia_pedido
  ) VALUES (
    p_id_producto_talla, 'salida', p_cantidad, 'Venta - Pedido #' || p_id_pedido, p_id_pedido
  );

  RETURN v_id_detalle;
END;
$$;
