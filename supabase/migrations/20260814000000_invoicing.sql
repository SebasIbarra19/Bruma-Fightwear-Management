CREATE TABLE public.factura_consecutivo (
  anio integer PRIMARY KEY,
  ultimo_numero integer NOT NULL DEFAULT 0
);

CREATE TABLE public.factura (
  id_factura SERIAL PRIMARY KEY,
  numero_factura character varying NOT NULL UNIQUE,
  id_pedido integer NOT NULL UNIQUE REFERENCES public.pedido(id_pedido),
  fecha_emision timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento timestamp without time zone NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  estado character varying NOT NULL DEFAULT 'pending',
  notas text,
  fecha_actualizacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.factura_item (
  id_item SERIAL PRIMARY KEY,
  id_factura integer NOT NULL REFERENCES public.factura(id_factura) ON DELETE CASCADE,
  descripcion character varying NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  orden integer NOT NULL DEFAULT 0
);

-- ================================================
-- STORED PROCEDURE: get_invoice_detail
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
      'estado_calculado', CASE WHEN f.estado = 'pending' AND f.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'overdue' ELSE f.estado END
    ),
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(fi) ORDER BY fi.orden) FROM public.factura_item fi WHERE fi.id_factura = f.id_factura), '[]'::jsonb)
  )
  FROM public.factura f
  JOIN public.pedido o ON o.id_pedido = f.id_pedido
  WHERE f.id_factura = p_id_factura;
$$;

-- ================================================
-- STORED PROCEDURE: create_invoice_from_order
-- ================================================

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
      iva = ROUND(v_subtotal * 0.13, 2),
      total = ROUND(v_subtotal * 1.13, 2)
  WHERE id_factura = v_id_factura;

  RETURN public.get_invoice_detail(v_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: update_invoice
-- ================================================

CREATE OR REPLACE FUNCTION public.update_invoice(
  p_id_factura integer,
  p_items jsonb,
  p_descuento numeric DEFAULT 0,
  p_notas text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric;
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

  UPDATE public.factura
  SET subtotal = v_subtotal,
      descuento = p_descuento,
      iva = ROUND((v_subtotal - p_descuento) * 0.13, 2),
      total = ROUND((v_subtotal - p_descuento) * 1.13, 2),
      notas = COALESCE(p_notas, notas),
      fecha_actualizacion = CURRENT_TIMESTAMP
  WHERE id_factura = p_id_factura;

  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: mark_invoice_paid
-- ================================================

CREATE OR REPLACE FUNCTION public.mark_invoice_paid(p_id_factura integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.factura SET estado = 'paid', fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_factura = p_id_factura;
  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: list_invoices
-- ================================================

CREATE OR REPLACE FUNCTION public.list_invoices(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_id_pedido integer DEFAULT NULL
)
RETURNS TABLE (
  id_factura integer,
  numero_factura character varying,
  id_pedido integer,
  cliente_nombre character varying,
  cliente_email character varying,
  fecha_emision timestamp without time zone,
  fecha_vencimiento timestamp without time zone,
  total numeric,
  estado character varying,
  estado_calculado text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id_factura, f.numero_factura, f.id_pedido, o.cliente_nombre, o.cliente_email,
    f.fecha_emision, f.fecha_vencimiento, f.total, f.estado,
    CASE WHEN f.estado = 'pending' AND f.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'overdue' ELSE f.estado END
  FROM public.factura f
  JOIN public.pedido o ON o.id_pedido = f.id_pedido
  WHERE p_id_pedido IS NULL OR f.id_pedido = p_id_pedido
  ORDER BY f.fecha_emision DESC
  LIMIT p_limit OFFSET p_offset;
$$;
