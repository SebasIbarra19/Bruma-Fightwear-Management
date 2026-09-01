-- Series para los graficos de Statistics.
--
-- `get_order_analytics` ya daba los totales del periodo, pero nada mas: un
-- numero no dice si vendes mas o menos que antes, ni que se mueve. Esto agrega
-- el desglose que faltaba, en una sola ida a la base -- cuatro consultas
-- separadas serian cuatro viajes para pintar una pantalla.
--
-- Cada serie responde una pregunta de negocio concreta:
--   ingresos_por_dia  -> vendemos mas o menos que antes?
--   top_productos     -> que se mueve?
--   por_estado        -> en que estado estan los pedidos?
--   por_categoria     -> que categoria factura mas?
--
-- El rango es opcional: sin fechas devuelve el historico completo, igual que
-- `get_order_analytics`.

CREATE OR REPLACE FUNCTION get_statistics_series(
  p_start_date date DEFAULT NULL,
  p_end_date   date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado jsonb;
BEGIN
  WITH pedidos AS (
    SELECT p.id_pedido, p.fecha::date AS dia, p.total, p.id_estado
    FROM pedido p
    WHERE (p_start_date IS NULL OR p.fecha::date >= p_start_date)
      AND (p_end_date   IS NULL OR p.fecha::date <= p_end_date)
  ),

  -- Un dia sin ventas tiene que aparecer como cero, no desaparecer: si se
  -- omite, la linea une el dia 3 con el dia 9 y dibuja una pendiente suave
  -- donde en realidad hubo una semana muerta. `generate_series` rellena.
  --
  -- Sin rango explicito se usa el primer y ultimo dia con pedidos; si no hay
  -- ninguno, no se genera nada (de ahi el WHERE del final).
  dias AS (
    SELECT generate_series(
      COALESCE(p_start_date, (SELECT MIN(dia) FROM pedidos)),
      COALESCE(p_end_date,   (SELECT MAX(dia) FROM pedidos)),
      '1 day'::interval
    )::date AS dia
    WHERE EXISTS (SELECT 1 FROM pedidos)
       OR (p_start_date IS NOT NULL AND p_end_date IS NOT NULL)
  ),

  -- El detalle se une al producto por la cadena talla -> variante -> producto.
  detalle AS (
    SELECT
      pr.id_producto,
      pr.nombre                        AS producto,
      pv.codigo_variante               AS sku,
      tp.nombre                        AS categoria,
      d.cantidad,
      d.cantidad * d.precio_unitario   AS importe
    FROM pedidodetalle d
    JOIN pedidos ped              ON ped.id_pedido = d.id_pedido
    JOIN productotallastock pts   ON pts.id_producto_talla = d.id_producto_talla
    JOIN productovariante pv      ON pv.id_variante = pts.id_variante
    JOIN producto pr              ON pr.id_producto = pv.id_producto
    LEFT JOIN tipoproducto tp     ON tp.id_tipo = pr.id_categoria
  )

  SELECT jsonb_build_object(
    'ingresos_por_dia', COALESCE((
      SELECT jsonb_agg(x ORDER BY x->>'fecha')
      FROM (
        SELECT jsonb_build_object(
          'fecha',    dias.dia,
          'ingresos', COALESCE(SUM(pedidos.total), 0),
          'pedidos',  COUNT(pedidos.id_pedido)
        ) AS x
        FROM dias
        LEFT JOIN pedidos ON pedidos.dia = dias.dia
        GROUP BY dias.dia
      ) s
    ), '[]'::jsonb),

    'top_productos', COALESCE((
      SELECT jsonb_agg(x)
      FROM (
        SELECT jsonb_build_object(
          'sku',      sku,
          'producto', producto,
          'unidades', SUM(cantidad),
          'ingresos', SUM(importe)
        ) AS x
        FROM detalle
        GROUP BY sku, producto
        ORDER BY SUM(cantidad) DESC
        LIMIT 8
      ) s
    ), '[]'::jsonb),

    'por_estado', COALESCE((
      SELECT jsonb_agg(x ORDER BY x->>'estado')
      FROM (
        SELECT jsonb_build_object(
          'estado',   e.nombre,
          'pedidos',  COUNT(*),
          'ingresos', COALESCE(SUM(pedidos.total), 0)
        ) AS x
        FROM pedidos
        JOIN estado e ON e.id_estado = pedidos.id_estado
        GROUP BY e.nombre
      ) s
    ), '[]'::jsonb),

    'por_categoria', COALESCE((
      SELECT jsonb_agg(x)
      FROM (
        SELECT jsonb_build_object(
          'categoria', COALESCE(categoria, 'Sin categoría'),
          'unidades',  SUM(cantidad),
          'ingresos',  SUM(importe)
        ) AS x
        FROM detalle
        GROUP BY categoria
        ORDER BY SUM(importe) DESC
      ) s
    ), '[]'::jsonb)
  )
  INTO v_resultado;

  RETURN v_resultado;
END;
$$;

-- Sin esto la funcion nace abierta a `anon` (ver migracion 20260823000000):
-- Postgres otorga EXECUTE a PUBLIC por defecto y PostgREST la publica.
REVOKE EXECUTE ON FUNCTION get_statistics_series(date, date) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_statistics_series(date, date) TO service_role;

NOTIFY pgrst, 'reload schema';
