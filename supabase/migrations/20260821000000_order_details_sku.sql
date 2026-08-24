-- get_order_details: devolver SKU y nombre de producto en cada línea del pedido.
--
-- Antes, 'items' era un `to_jsonb(pedidodetalle)` a secas: esa tabla solo guarda
-- la referencia `id_producto_talla`, así que el detalle no traía ni el código ni
-- el nombre del producto. La UI terminaba mostrando "SKU #15" — la llave
-- primaria de productotallastock etiquetada como si fuera un SKU.
--
-- La cadena de JOINs es la misma que ya usa `list_inventory_items`
-- (20260813020000), y el SKU se arma igual que en `inventory-adapter.ts`:
-- código de variante (o el del producto si la variante no tiene) + código de
-- talla cuando existe.
--
-- Todos los JOINs son LEFT a propósito: una línea de pedido con referencias
-- rotas o sin talla asignada tiene que seguir apareciendo, no desaparecer del
-- detalle. `to_jsonb(oi)` se conserva como base del objeto, así que los campos
-- que ya devolvía (id_pedido_detalle, cantidad, precio_unitario,
-- id_producto_talla) siguen intactos: esto solo agrega.

CREATE OR REPLACE FUNCTION public.get_order_details(
  p_id_pedido integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pedido', to_jsonb(o),
    'cliente', to_jsonb(c),
    'items', COALESCE((
      SELECT jsonb_agg(
               to_jsonb(oi) || jsonb_build_object(
                 'producto_nombre', p.nombre,
                 'variante_nombre', pv.nombre_variante,
                 'talla_codigo', tb.codigo,
                 'sku', COALESCE(pv.codigo_variante, p.codigo)
                        || COALESCE('-' || tb.codigo, '')
               )
               ORDER BY oi.id_pedido_detalle
             )
      FROM public.pedidodetalle oi
      LEFT JOIN public.productotallastock pts
             ON pts.id_producto_talla = oi.id_producto_talla
      LEFT JOIN public.productovariante pv
             ON pv.id_variante = pts.id_variante
      LEFT JOIN public.producto p
             ON p.id_producto = pv.id_producto
      LEFT JOIN public.tallaproveedor tp
             ON tp.id_talla_proveedor = pts.id_talla_proveedor
      LEFT JOIN public.tallabase tb
             ON tb.id_talla = tp.id_talla
      WHERE oi.id_pedido = o.id_pedido
    ), '[]'::jsonb)
  )
  FROM public.pedido o
  LEFT JOIN public.cliente c ON c.id_cliente = o.id_cliente
  WHERE o.id_pedido = p_id_pedido
  LIMIT 1;
$$;
