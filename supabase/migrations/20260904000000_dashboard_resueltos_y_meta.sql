-- Dashboard: *Resueltos hoy* y *Meta mensual*.
--
-- Además cierra una segunda tanda de deriva de esquema, encontrada al intentar
-- construir "Resueltos hoy".


-- ===========================================================================
-- 1. Columnas fantasma
-- ===========================================================================
-- ⚠️ SEGUNDA DERIVA DE ESQUEMA. La primera (migración 20260825030000) fueron 29
-- límites de `varchar` omitidos. Esta es peor: **columnas declaradas en las
-- migraciones que nunca se crearon en la base real.**
--
-- Comparando el spec OpenAPI de PostgREST contra los `CREATE TABLE` de todas
-- las migraciones aparecieron tres tablas con columnas fantasma:
--
--   cliente   → fecha_creacion, fecha_actualizacion
--   pedido    → fecha_actualizacion
--   producto  → fecha_actualizacion
--
-- Todas de auditoría temporal. Un despliegue desde cero las habría creado, y
-- producción no las tiene: el mismo código funcionaría distinto en cada
-- entorno, y el fallo solo aparecería al promover.
--
-- Se agregan con `IF NOT EXISTS` para que sea no-op donde ya estén. Son
-- nullable con `DEFAULT`, así que agregarlas no reescribe las filas existentes
-- ni bloquea la tabla de forma apreciable.

ALTER TABLE public.cliente  ADD COLUMN IF NOT EXISTS fecha_creacion      timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.cliente  ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.pedido   ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.producto ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;


-- ===========================================================================
-- 2. `fecha_actualizacion` de pedido pasa a significar algo
-- ===========================================================================
-- Incluso una vez creada, la columna seguiría siendo inútil: `update_order_status`
-- cambiaba `id_estado` **sin tocarla**, así que se quedaría en la fecha de
-- creación. Diría "actualizado" y en realidad diría "creado".
--
-- Sin esto no hay forma de saber CUÁNDO un pedido llegó a Entregado, y
-- "Resueltos hoy" no se puede calcular. La alternativa era leerlo de la
-- bitácora, pero eso ataría una métrica de negocio a una tabla de auditoría que
-- existe para otra cosa.

CREATE OR REPLACE FUNCTION public.update_order_status(
  p_id_pedido integer,
  p_id_estado integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.pedido
    SET
      id_estado = COALESCE(p_id_estado, id_estado),
      fecha_actualizacion = now()
    WHERE id_pedido = p_id_pedido
    RETURNING id_pedido, id_estado
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM updated),
    'id_pedido', (SELECT id_pedido FROM updated),
    'id_estado', (SELECT id_estado FROM updated)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.update_order_status(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_order_status(integer, integer) TO service_role;


-- ===========================================================================
-- 3. Stats del dashboard
-- ===========================================================================
-- Llegan:
--   · `resueltos_hoy`  — pedidos que llegaron a Entregado HOY. Es la métrica de
--     "qué cerré en el día", que es lo que se mira en un dashboard.
--     Cancelado NO cuenta: también termina el pedido, pero sumarlo junto a las
--     entregas mezclaría un logro con una pérdida en el mismo número.
--   · `ingresos_mes`   — facturado del mes en curso, para contrastar con la meta.
--   · `meta_mensual`   — de la tabla `configuracion` (migración 20260903000000).
--     Se devuelve como número: la tabla guarda texto porque ahí conviven montos,
--     porcentajes y cédulas, y convertir corresponde a quien conoce la clave.
--
-- Se conservan `clientes` y `proveedores` aunque el dashboard ya no los muestre:
-- quitarlos del SP rompería a cualquier otro consumidor por un beneficio nulo.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pedidos', (SELECT COUNT(*) FROM public.pedido),
    'productos_bajo_stock', (SELECT COUNT(*) FROM public.productotallastock WHERE stock <= 5),
    'clientes', (SELECT COUNT(*) FROM public.cliente),
    'proveedores', (SELECT COUNT(*) FROM public.proveedor),

    'resueltos_hoy', (
      SELECT COUNT(*)
      FROM public.pedido p
      JOIN public.estado e ON e.id_estado = p.id_estado
      WHERE lower(e.nombre) = 'entregado'
        AND p.fecha_actualizacion::date = CURRENT_DATE
    ),

    'ingresos_mes', COALESCE((
      SELECT SUM(total)
      FROM public.pedido
      WHERE fecha >= date_trunc('month', CURRENT_DATE)
    ), 0),

    'meta_mensual', COALESCE((
      SELECT NULLIF(regexp_replace(valor, '[^0-9.]', '', 'g'), '')::numeric
      FROM public.configuracion
      WHERE clave = 'meta_mensual'
    ), 0)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;

NOTIFY pgrst, 'reload schema';
