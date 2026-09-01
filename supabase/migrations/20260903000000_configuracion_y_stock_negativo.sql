-- Dos decisiones de producto tomadas con el usuario (2026-08-31), antes del
-- despliegue con Luis.


-- ===========================================================================
-- 1. Tabla de configuración
-- ===========================================================================
-- La meta mensual del dashboard es un dato que ALGUIEN ESCRIBE, no algo que se
-- calcule, y hoy no hay dónde guardarlo. Se eligió una tabla clave/valor por
-- sobre una tabla `meta_mensual(anio, mes, monto)` porque sirve para esto y
-- para todo lo que ya se ve venir —IVA, moneda, datos de la empresa en la
-- factura— sin sumar una tabla por cada ajuste suelto.
--
-- El costo aceptado: no guarda histórico. Si algún día hace falta comparar
-- "cumplimos en marzo, no en abril", eso pide su propia tabla con fecha; esta
-- guarda el valor vigente y nada más.

CREATE TABLE IF NOT EXISTS public.configuracion (
  clave       character varying(60) PRIMARY KEY,
  valor       text NOT NULL,
  descripcion character varying(160),
  fecha_actualizacion timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.configuracion IS
  'Ajustes del sistema en pares clave/valor. Guarda el valor vigente, sin histórico.';

-- `valor` es `text` a propósito, no `numeric`: acá conviven un monto, un
-- porcentaje y una cédula jurídica. Quien lee convierte según la clave.
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('meta_mensual', '0', 'Meta de ingresos del mes, en colones. 0 = sin meta definida.')
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.configuracion FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.configuracion TO service_role;


CREATE OR REPLACE FUNCTION public.get_configuracion(p_clave character varying DEFAULT NULL)
RETURNS TABLE (clave character varying, valor text, descripcion character varying)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.clave, c.valor, c.descripcion
  FROM public.configuracion c
  WHERE p_clave IS NULL OR c.clave = p_clave
  ORDER BY c.clave;
$$;

/** Crea o actualiza un ajuste. `UPSERT` para no obligar a saber si ya existía. */
CREATE OR REPLACE FUNCTION public.set_configuracion(
  p_clave character varying,
  p_valor text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.configuracion AS c (clave, valor)
  VALUES (p_clave, p_valor)
  ON CONFLICT (clave) DO UPDATE
    SET valor = EXCLUDED.valor,
        fecha_actualizacion = now();
$$;

GRANT EXECUTE ON FUNCTION public.get_configuracion(character varying) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_configuracion(character varying, text) TO service_role;


-- ===========================================================================
-- 2. Los pedidos ya no se bloquean por falta de stock
-- ===========================================================================
-- ⚠️ CAMBIO DE COMPORTAMIENTO, decidido con el usuario.
--
-- Antes: `IF v_stock_actual < p_cantidad THEN RAISE EXCEPTION 'Stock
-- insuficiente'`. O sea, si a Luis le piden 5 y tiene 3, **no podía registrar
-- el pedido**.
--
-- El pedido es un HECHO DEL NEGOCIO: si el cliente pidió 5, pidió 5. Negarlo no
-- hace aparecer las 2 unidades faltantes; solo obliga a mentirle al sistema o a
-- no registrar la venta. Se permite entonces que el stock quede negativo, a
-- cambio de que sea imposible no verlo: la fila queda en rojo en Inventory,
-- sube al panel de reposición del dashboard, y la bitácora la marca como
-- alerta con su autor. El negativo pasa a significar algo concreto —**deuda de
-- stock**, unidades vendidas que hay que reponer— en vez de ser un accidente.
--
-- ⚠️ Esto NO toca `adjust_inventory`: ahí `p_forzar` se queda. No es un bypass
-- sino una confirmación en dos pasos (el modal avisa y exige mantener pulsado
-- "SÉ LO QUE HAGO"). La distinción es deliberada: **un ajuste manual pregunta**
-- —estás declarando un número que no coincide con la realidad— y **un pedido no
-- pregunta**, porque la venta ya ocurrió.

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

  -- Sin guarda de stock: ver la nota de arriba. El faltante se avisa en la
  -- interfaz y queda visible como negativo, no se impide la venta.

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

NOTIFY pgrst, 'reload schema';
