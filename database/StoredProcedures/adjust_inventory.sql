-- ================================================
-- STORED PROCEDURE: adjust_inventory
-- Schema: public
-- UPDATED: now accepts id_producto_talla directly
-- ================================================

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
  SELECT stock
  INTO v_stock_actual
  FROM public.productotallastock
  WHERE id_producto_talla = p_id_producto_talla;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para id_producto_talla %', p_id_producto_talla;
  END IF;

  v_nuevo_stock := v_stock_actual + p_cantidad_cambio;
  v_tipo_movimiento := CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END;

  -- Actualizar stock
  UPDATE public.productotallastock
  SET stock = GREATEST(v_nuevo_stock, 0)
  WHERE id_producto_talla = v_id_producto_talla;

  -- Registrar movimiento
  INSERT INTO public.inventario_movimiento (
    id_producto_talla,
    tipo_movimiento,
    cantidad,
    motivo
  ) VALUES (
    p_id_producto_talla,
    v_tipo_movimiento,
    ABS(p_cantidad_cambio),
    p_motivo
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
