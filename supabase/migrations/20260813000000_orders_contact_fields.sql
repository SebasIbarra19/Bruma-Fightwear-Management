ALTER TABLE public.pedido ADD COLUMN IF NOT EXISTS cliente_telefono character varying;
ALTER TABLE public.pedido ADD COLUMN IF NOT EXISTS cliente_instagram character varying;

DROP FUNCTION IF EXISTS public.create_order(integer, integer, integer, character varying, character varying, numeric, text, integer, character varying, text);

CREATE OR REPLACE FUNCTION public.create_order(
  p_id_estado integer,
  p_id_codigo_envio integer DEFAULT NULL,
  p_id_cliente integer DEFAULT NULL,
  p_cliente_nombre character varying DEFAULT NULL,
  p_cliente_email character varying DEFAULT NULL,
  p_cliente_telefono character varying DEFAULT NULL,
  p_cliente_instagram character varying DEFAULT NULL,
  p_total numeric DEFAULT NULL,
  p_notas text DEFAULT NULL,
  p_id_metodo_pago integer DEFAULT NULL,
  p_referencia_pago character varying DEFAULT NULL,
  p_notas_pago text DEFAULT NULL
)
RETURNS TABLE (
  id_pedido integer,
  fecha timestamp without time zone,
  id_estado integer,
  id_codigo_envio integer,
  id_cliente integer,
  cliente_nombre character varying,
  cliente_email character varying,
  cliente_telefono character varying,
  cliente_instagram character varying,
  total numeric,
  notas text,
  id_metodo_pago integer,
  referencia_pago character varying,
  notas_pago text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.pedido (
    id_estado, id_codigo_envio, id_cliente, cliente_nombre, cliente_email,
    cliente_telefono, cliente_instagram, total, notas, id_metodo_pago,
    referencia_pago, notas_pago
  ) VALUES (
    p_id_estado, p_id_codigo_envio, p_id_cliente, p_cliente_nombre, p_cliente_email,
    p_cliente_telefono, p_cliente_instagram, p_total, p_notas, p_id_metodo_pago,
    p_referencia_pago, p_notas_pago
  )
  RETURNING id_pedido, fecha, id_estado, id_codigo_envio, id_cliente, cliente_nombre,
    cliente_email, cliente_telefono, cliente_instagram, total, notas, id_metodo_pago,
    referencia_pago, notas_pago;
$$;
