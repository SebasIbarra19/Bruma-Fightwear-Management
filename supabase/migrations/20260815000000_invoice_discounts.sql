-- ================================================
-- DESCUENTOS DE FACTURA
-- Los descuentos son líneas con nombre propio (ej. "Descuento KIT"),
-- separadas del subtotal de productos. Se guarda el tipo y el valor
-- (no solo el monto) para que un porcentaje se recalcule si cambian
-- los productos.
-- ================================================

CREATE TABLE IF NOT EXISTS public.factura_descuento (
  id_descuento SERIAL PRIMARY KEY,
  id_factura integer NOT NULL REFERENCES public.factura(id_factura) ON DELETE CASCADE,
  descripcion character varying NOT NULL,
  tipo character varying NOT NULL CHECK (tipo IN ('fijo', 'porcentaje')),
  valor numeric NOT NULL CHECK (valor >= 0),
  orden integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_factura_descuento_factura ON public.factura_descuento(id_factura);

-- ================================================
-- get_invoice_detail: ahora devuelve también los descuentos,
-- cada uno con su monto ya calculado.
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

-- ================================================
-- update_invoice: cambia de firma (p_descuento numeric -> p_descuentos jsonb),
-- así que hay que DROPear la versión vieja: CREATE OR REPLACE no reemplaza
-- una función cuya lista de argumentos cambió, crearía un overload duplicado.
-- ================================================

DROP FUNCTION IF EXISTS public.update_invoice(integer, jsonb, numeric, text);

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
      iva = ROUND((v_subtotal - v_descuento_total) * 0.13, 2),
      total = ROUND((v_subtotal - v_descuento_total) * 1.13, 2),
      notas = COALESCE(p_notas, notas),
      fecha_actualizacion = CURRENT_TIMESTAMP
  WHERE id_factura = p_id_factura;

  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;
