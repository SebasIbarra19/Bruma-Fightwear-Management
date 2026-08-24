-- ================================================
-- Business decision: BRUMA invoices do not charge IVA.
-- iva stays 0 (column kept for compatibility), total = subtotal - descuento.
-- Also adds cliente_telefono to get_invoice_detail's joined pedido data.
-- Signatures unchanged for all three functions, so CREATE OR REPLACE is
-- enough (no DROP FUNCTION needed per this repo's migration convention).
-- ================================================

CREATE OR REPLACE FUNCTION public.get_invoice_detail(p_id_factura integer)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'factura', to_jsonb(f) || jsonb_build_object(
      'cliente_nombre', o.cliente_nombre,
      'cliente_email', o.cliente_email,
      'cliente_telefono', o.cliente_telefono,
      'estado_calculado', CASE WHEN f.estado = 'pending' AND f.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'overdue' ELSE f.estado END
    ),
    'items', COALESCE((
      SELECT jsonb_agg(to_jsonb(fi) ORDER BY fi.orden)
      FROM public.factura_item fi WHERE fi.id_factura = f.id_factura
    ), '[]'::jsonb),
    'descuentos', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(fd) || jsonb_build_object(
          'monto', CASE
            WHEN fd.tipo = 'porcentaje' THEN ROUND(f.subtotal * fd.valor / 100, 2)
            ELSE ROUND(fd.valor, 2)
          END
        ) ORDER BY fd.orden
      )
      FROM public.factura_descuento fd WHERE fd.id_factura = f.id_factura
    ), '[]'::jsonb)
  )
  FROM public.factura f
  JOIN public.pedido o ON o.id_pedido = f.id_pedido
  WHERE f.id_factura = p_id_factura;
$$;

CREATE OR REPLACE FUNCTION public.create_invoice_from_order(
  p_id_pedido integer,
  p_dias_vencimiento integer DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anio integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_numero integer;
  v_numero_factura character varying;
  v_id_factura integer;
  v_subtotal numeric := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.factura WHERE id_pedido = p_id_pedido) THEN
    RAISE EXCEPTION 'Este pedido ya tiene una factura';
  END IF;

  INSERT INTO public.factura_consecutivo (anio, ultimo_numero)
  VALUES (v_anio, 1)
  ON CONFLICT (anio) DO UPDATE SET ultimo_numero = factura_consecutivo.ultimo_numero + 1
  RETURNING ultimo_numero INTO v_numero;

  v_numero_factura := 'FAC-' || v_anio || '-' || LPAD(v_numero::text, 4, '0');

  INSERT INTO public.factura (numero_factura, id_pedido, fecha_vencimiento, estado)
  VALUES (v_numero_factura, p_id_pedido, CURRENT_TIMESTAMP + (p_dias_vencimiento || ' days')::interval, 'pending')
  RETURNING id_factura INTO v_id_factura;

  INSERT INTO public.factura_item (id_factura, descripcion, cantidad, precio_unitario, orden)
  SELECT
    v_id_factura,
    p.nombre || COALESCE(' - ' || tb.codigo, ''),
    pd.cantidad,
    pd.precio_unitario,
    ROW_NUMBER() OVER (ORDER BY pd.id_pedido_detalle)
  FROM public.pedidodetalle pd
  JOIN public.productotallastock pts ON pts.id_producto_talla = pd.id_producto_talla
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE pd.id_pedido = p_id_pedido;

  SELECT COALESCE(SUM(cantidad * precio_unitario), 0) INTO v_subtotal
  FROM public.factura_item WHERE id_factura = v_id_factura;

  UPDATE public.factura
  SET subtotal = v_subtotal,
      iva = 0,
      total = v_subtotal
  WHERE id_factura = v_id_factura;

  RETURN public.get_invoice_detail(v_id_factura);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_invoice(
  p_id_factura integer,
  p_items jsonb,
  p_descuentos jsonb DEFAULT '[]'::jsonb,
  p_notas text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric;
  v_descuento_total numeric;
BEGIN
  DELETE FROM public.factura_item WHERE id_factura = p_id_factura;

  INSERT INTO public.factura_item (id_factura, descripcion, cantidad, precio_unitario, orden)
  SELECT
    p_id_factura,
    (item->>'descripcion')::character varying,
    (item->>'cantidad')::integer,
    (item->>'precio_unitario')::numeric,
    ordinality
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality);

  SELECT COALESCE(SUM(cantidad * precio_unitario), 0) INTO v_subtotal
  FROM public.factura_item WHERE id_factura = p_id_factura;

  DELETE FROM public.factura_descuento WHERE id_factura = p_id_factura;

  INSERT INTO public.factura_descuento (id_factura, descripcion, tipo, valor, orden)
  SELECT
    p_id_factura,
    (d->>'descripcion')::character varying,
    (d->>'tipo')::character varying,
    (d->>'valor')::numeric,
    ordinality
  FROM jsonb_array_elements(p_descuentos) WITH ORDINALITY AS t(d, ordinality);

  -- Un porcentaje siempre se aplica sobre el subtotal bruto de productos,
  -- nunca en cascada sobre otro descuento.
  SELECT COALESCE(SUM(
    CASE
      WHEN tipo = 'porcentaje' THEN ROUND(v_subtotal * valor / 100, 2)
      ELSE ROUND(valor, 2)
    END
  ), 0) INTO v_descuento_total
  FROM public.factura_descuento WHERE id_factura = p_id_factura;

  IF v_descuento_total > v_subtotal THEN
    RAISE EXCEPTION 'El descuento (%) no puede superar el subtotal (%)', v_descuento_total, v_subtotal;
  END IF;

  UPDATE public.factura
  SET subtotal = v_subtotal,
      descuento = v_descuento_total,
      iva = 0,
      total = v_subtotal - v_descuento_total,
      notas = COALESCE(p_notas, notas),
      fecha_actualizacion = CURRENT_TIMESTAMP
  WHERE id_factura = p_id_factura;

  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;
