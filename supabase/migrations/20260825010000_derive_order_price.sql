-- Fase 0.6 — El precio de un pedido lo pone la base, no el cliente.
--
-- Antes, `src/app/api/orders/route.ts` hacía:
--
--   const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
--
-- con el `precio_unitario` que venía en el body, y se lo pasaba tal cual a
-- `add_order_item`. Un POST con {"precio_unitario": 1} creaba un pedido de ₡1 por
-- un producto de ₡50 000, y nada lo detectaba: el número quedaba escrito en
-- pedidodetalle y en pedido.total.
--
-- No se arregla validando que el precio "coincida" —eso deja la puerta abierta a
-- errores de redondeo y a olvidarse de un camino de escritura—: se arregla
-- dejando de aceptar el campo. El precio canónico ya vive en
-- productotallastock.precio.
--
-- El total se recalcula desde los propios detalles en vez de acumularse sumando:
-- así es idempotente, se corrige solo si un detalle cambia, y no depende de que
-- el llamador haga las cosas en orden.


-- ---------------------------------------------------------------------------
-- 1. add_order_item sin p_precio_unitario
-- ---------------------------------------------------------------------------
-- Se ELIMINA la versión de 4 argumentos: si convivieran, PostgREST no podría
-- resolver la llamada por parámetros nombrados, y peor, el camino viejo
-- (inseguro) seguiría disponible.

DROP FUNCTION IF EXISTS public.add_order_item(integer, integer, integer, numeric);

CREATE OR REPLACE FUNCTION public.add_order_item(
  p_id_pedido integer,
  p_id_producto_talla integer,
  p_cantidad integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_detalle    integer;
  v_stock_actual  integer;
  v_precio        numeric;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor que cero (recibido: %)', p_cantidad;
  END IF;

  -- Precio y stock salen de la MISMA fila: no hay ventana para que el precio
  -- corresponda a un producto y el stock a otro.
  SELECT stock, precio
    INTO v_stock_actual, v_precio
    FROM public.productotallastock
   WHERE id_producto_talla = p_id_producto_talla;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para id_producto_talla %', p_id_producto_talla;
  END IF;

  IF v_precio IS NULL THEN
    RAISE EXCEPTION 'El producto % no tiene precio cargado', p_id_producto_talla;
  END IF;

  IF v_stock_actual < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', v_stock_actual, p_cantidad;
  END IF;

  INSERT INTO public.pedidodetalle (
    id_pedido, id_producto_talla, cantidad, precio_unitario
  ) VALUES (
    p_id_pedido, p_id_producto_talla, p_cantidad, v_precio
  )
  RETURNING id_pedido_detalle INTO v_id_detalle;

  UPDATE public.productotallastock
     SET stock = stock - p_cantidad
   WHERE id_producto_talla = p_id_producto_talla;

  INSERT INTO public.inventario_movimiento (
    id_producto_talla, tipo_movimiento, cantidad, motivo, referencia_pedido
  ) VALUES (
    p_id_producto_talla, 'salida', p_cantidad,
    'Venta - Pedido #' || p_id_pedido, p_id_pedido
  );

  -- Recalcular desde los detalles reales, no acumular.
  UPDATE public.pedido
     SET total = (
       SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
         FROM public.pedidodetalle
        WHERE id_pedido = p_id_pedido
     )
   WHERE id_pedido = p_id_pedido;

  RETURN v_id_detalle;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_order_item(integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_order_item(integer, integer, integer) TO service_role;


-- ---------------------------------------------------------------------------
-- 2. Restricciones de tabla
-- ---------------------------------------------------------------------------
-- Protegen CUALQUIER camino de escritura —SP, SQL manual, dashboard—, no solo el
-- HTTP. Por eso van acá y no en una validación de la API.

ALTER TABLE public.pedidodetalle
  DROP CONSTRAINT IF EXISTS pedidodetalle_cantidad_positiva;
ALTER TABLE public.pedidodetalle
  ADD CONSTRAINT pedidodetalle_cantidad_positiva CHECK (cantidad > 0);

ALTER TABLE public.pedidodetalle
  DROP CONSTRAINT IF EXISTS pedidodetalle_precio_no_negativo;
ALTER TABLE public.pedidodetalle
  ADD CONSTRAINT pedidodetalle_precio_no_negativo CHECK (precio_unitario >= 0);

-- Un descuento porcentual mayor a 100 deja la factura en negativo. El CHECK
-- existente solo exigía valor >= 0.
ALTER TABLE public.factura_descuento
  DROP CONSTRAINT IF EXISTS factura_descuento_porcentaje_max;
ALTER TABLE public.factura_descuento
  ADD CONSTRAINT factura_descuento_porcentaje_max
  CHECK (tipo <> 'porcentaje' OR valor <= 100);

NOTIFY pgrst, 'reload schema';
