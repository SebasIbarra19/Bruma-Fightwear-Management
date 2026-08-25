-- Bitácora de actividad: qué cambió, cuándo, y (etapa 2) quién.
--
-- Hasta ahora el proyecto no tenía NI tabla NI un solo trigger. Lo único
-- parecido era `inventario_movimiento`, que se escribe a mano desde 2 SPs y no
-- guarda usuario: es el libro mayor del stock, no una auditoría.
--
-- ⚠️ POR QUÉ EL USUARIO QUEDA EN NULL EN ESTA ETAPA
-- Todos los writes llegan a Postgres con el token de servicio, cuyos claims son
-- exp/iat/iss/ref/role — SIN `sub`. Por lo tanto `auth.uid()` dentro de un
-- trigger devuelve NULL, siempre. La identidad del usuario existe en la capa de
-- Next (`withAuth`) y se pierde antes de llegar a la base.
-- La etapa 2 la hará viajar: cada SP que muta recibirá `p_id_usuario` y hará
-- `set_config('app.user_id', ..., true)` —local a la transacción—, y estos
-- triggers ya la leen (ver `actor()`). Por eso el esquema no cambia después:
-- solo se empiezan a llenar las columnas que hoy quedan vacías.
--
-- Decisión de alcance (acordada con el usuario): se auditan las 6 tablas donde
-- un cambio no explicado duele —dinero e inventario— y NO las de referencia
-- (color, tallabase, estado, metodopago, proveedor, cliente…), que casi no
-- cambian y solo generarían ruido que entierra lo importante.


-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.registro_actividad (
  id_registro   BIGSERIAL PRIMARY KEY,

  -- `timestamptz` a propósito, apartándose del `timestamp without time zone`
  -- del resto del esquema: es la única tabla donde el instante exacto es el
  -- dato, y una bitácora ambigua respecto de la zona horaria no sirve para
  -- reconstruir qué pasó.
  fecha         timestamptz NOT NULL DEFAULT now(),

  -- 'datos'  → lo escribe un trigger (cambio en una tabla auditada)
  -- 'sesion' → lo escribe la app (inicio/cierre/fallo de autenticación)
  -- 'accion' → lo escribe la app (acción destacada: PDF, forzado, cancelación)
  categoria     text NOT NULL CHECK (categoria IN ('datos', 'sesion', 'accion')),

  -- Frase lista para mostrar. Es lo que se lee en la pantalla de Activity Log;
  -- las columnas técnicas de abajo son para cuando hace falta el detalle.
  descripcion   text NOT NULL,

  severidad     text NOT NULL DEFAULT 'info'
                CHECK (severidad IN ('info', 'alerta')),

  -- Detalle técnico (solo para categoria='datos')
  tabla         text,
  operacion     text CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  id_afectado   text,
  datos_antes   jsonb,
  datos_despues jsonb,

  -- Identidad. NULL mientras dure la etapa 1; ver la nota de arriba.
  -- El email va desnormalizado a propósito: si el usuario se borra de
  -- `auth.users`, la bitácora tiene que seguir diciendo quién fue.
  id_usuario    uuid,
  usuario_email text
);

-- La bitácora se consulta casi siempre como "lo último primero", y en segundo
-- lugar filtrando por tipo. Un índice descendente por fecha cubre el caso
-- dominante sin encarecer las escrituras de forma apreciable.
CREATE INDEX IF NOT EXISTS idx_registro_actividad_fecha
  ON public.registro_actividad (fecha DESC);

CREATE INDEX IF NOT EXISTS idx_registro_actividad_categoria
  ON public.registro_actividad (categoria, fecha DESC);

COMMENT ON TABLE public.registro_actividad IS
  'Bitácora de actividad. Filas de categoria=datos las escriben triggers; sesion y accion las escribe la aplicación.';


-- ---------------------------------------------------------------------------
-- Cierre de acceso (mismo criterio que la migración de Fase 0)
-- ---------------------------------------------------------------------------
-- La bitácora revela movimientos de dinero e inventario: no debe ser legible
-- con la anon key bajo ninguna circunstancia. Se llega a ella solo por rutas
-- de API autenticadas, que usan service_role.

ALTER TABLE public.registro_actividad ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.registro_actividad FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.registro_actividad TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.registro_actividad_id_registro_seq TO service_role;


-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

/**
 * Usuario responsable del cambio, si la aplicación lo publicó.
 *
 * Devuelve NULL en la etapa 1 (nadie llama todavía a `set_config`) y el uuid
 * real en la etapa 2, sin tocar los triggers. El segundo argumento `true` de
 * `current_setting` evita el error cuando la variable no está definida.
 */
CREATE OR REPLACE FUNCTION public.actor()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.user_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v::uuid;
EXCEPTION
  -- Si llegara basura en la variable, la bitácora no debe tumbar la operación
  -- que la origina: se registra sin usuario y se sigue.
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

/** SKU legible de una fila de stock, para que la bitácora no muestre IDs. */
CREATE OR REPLACE FUNCTION public.sku_de_stock(p_id_producto_talla integer)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.build_sku(p.codigo, pv.codigo_variante, tb.codigo)
  FROM public.productotallastock pts
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p          ON p.id_producto  = pv.id_producto
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb      ON tb.id_talla = tp.id_talla
  WHERE pts.id_producto_talla = p_id_producto_talla;
$$;


-- ---------------------------------------------------------------------------
-- Trigger genérico
-- ---------------------------------------------------------------------------
/**
 * Escribe una fila de bitácora por cada cambio en las tablas auditadas.
 *
 * Compone además una descripción legible por tabla: la misma fila sirve para
 * leer "Factura FAC-2026-0002 marcada como pagada" y para inspeccionar el diff
 * exacto en `datos_antes`/`datos_despues`.
 *
 * `AFTER` y no `BEFORE`: solo interesa registrar lo que efectivamente quedó.
 * Si la operación falla o la revierte una restricción, no debe dejar rastro.
 */
CREATE OR REPLACE FUNCTION public.registrar_actividad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_desc      text;
  v_sev       text := 'info';
  v_id        text;
  v_antes     jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_despues   jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_estado_a  text;
  v_estado_d  text;
  v_sku       text;
BEGIN
  CASE TG_TABLE_NAME

    WHEN 'pedido' THEN
      v_id := COALESCE(NEW.id_pedido, OLD.id_pedido)::text;
      IF TG_OP = 'INSERT' THEN
        v_desc := format('Se creó el pedido #%s por %s', NEW.id_pedido,
                         COALESCE('₡' || NEW.total::text, 'monto sin definir'));
      ELSIF TG_OP = 'DELETE' THEN
        v_desc := format('Se eliminó el pedido #%s', OLD.id_pedido);
        v_sev  := 'alerta';
      ELSIF NEW.id_estado IS DISTINCT FROM OLD.id_estado THEN
        SELECT nombre INTO v_estado_a FROM public.estado WHERE id_estado = OLD.id_estado;
        SELECT nombre INTO v_estado_d FROM public.estado WHERE id_estado = NEW.id_estado;
        v_desc := format('Pedido #%s pasó de %s a %s', NEW.id_pedido,
                         upper(COALESCE(v_estado_a, '?')), upper(COALESCE(v_estado_d, '?')));
      ELSIF NEW.total IS DISTINCT FROM OLD.total THEN
        v_desc := format('Pedido #%s cambió de total: ₡%s → ₡%s',
                         NEW.id_pedido, OLD.total, NEW.total);
        v_sev  := 'alerta';
      ELSE
        v_desc := format('Se actualizó el pedido #%s', NEW.id_pedido);
      END IF;

    WHEN 'pedidodetalle' THEN
      v_id := COALESCE(NEW.id_pedido_detalle, OLD.id_pedido_detalle)::text;
      IF TG_OP = 'INSERT' THEN
        v_desc := format('Se agregó una línea al pedido #%s (%s x%s)',
                         NEW.id_pedido, public.sku_de_stock(NEW.id_producto_talla), NEW.cantidad);
      ELSIF TG_OP = 'DELETE' THEN
        v_desc := format('Se quitó una línea del pedido #%s', OLD.id_pedido);
        v_sev  := 'alerta';
      ELSE
        v_desc := format('Cambió una línea del pedido #%s', NEW.id_pedido);
      END IF;

    WHEN 'factura' THEN
      v_id := COALESCE(NEW.id_factura, OLD.id_factura)::text;
      IF TG_OP = 'INSERT' THEN
        v_desc := format('Se generó la factura %s del pedido #%s por ₡%s',
                         NEW.numero_factura, NEW.id_pedido, NEW.total);
      ELSIF TG_OP = 'DELETE' THEN
        v_desc := format('Se eliminó la factura %s', OLD.numero_factura);
        v_sev  := 'alerta';
      ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
        v_desc := format('Factura %s pasó de %s a %s',
                         NEW.numero_factura, OLD.estado, NEW.estado);
      ELSE
        v_desc := format('Se actualizó la factura %s', NEW.numero_factura);
      END IF;

    WHEN 'productotallastock' THEN
      v_id  := COALESCE(NEW.id_producto_talla, OLD.id_producto_talla)::text;
      v_sku := COALESCE(public.sku_de_stock(v_id::integer), 'SKU ' || v_id);
      IF TG_OP = 'DELETE' THEN
        v_desc := format('Se eliminó la fila de stock %s', v_sku);
        v_sev  := 'alerta';
      ELSIF NEW.stock IS DISTINCT FROM OLD.stock THEN
        v_desc := format('Stock de %s: %s → %s', v_sku, OLD.stock, NEW.stock);
        -- El caso que hoy no deja rastro: así fue como el Rashguard llegó a -2
        -- (`adjust_inventory` con p_forzar saltea la guarda de stock negativo).
        IF NEW.stock < 0 THEN
          v_desc := format('Stock de %s quedó NEGATIVO: %s → %s', v_sku, OLD.stock, NEW.stock);
          v_sev  := 'alerta';
        END IF;
      ELSIF NEW.precio IS DISTINCT FROM OLD.precio THEN
        v_desc := format('Precio de %s: ₡%s → ₡%s', v_sku, OLD.precio, NEW.precio);
      ELSE
        v_desc := format('Se actualizó la fila de stock %s', v_sku);
      END IF;

    WHEN 'producto' THEN
      v_id := COALESCE(NEW.id_producto, OLD.id_producto)::text;
      IF TG_OP = 'INSERT' THEN
        v_desc := format('Se creó el producto %s (%s)', NEW.nombre, NEW.codigo);
      ELSIF TG_OP = 'DELETE' THEN
        v_desc := format('Se eliminó el producto %s (%s)', OLD.nombre, OLD.codigo);
        v_sev  := 'alerta';
      ELSIF NEW.activo IS DISTINCT FROM OLD.activo THEN
        v_desc := format('Producto %s %s', NEW.nombre,
                         CASE WHEN NEW.activo THEN 'reactivado' ELSE 'desactivado' END);
      ELSE
        v_desc := format('Se actualizó el producto %s', NEW.nombre);
      END IF;

    WHEN 'productovariante' THEN
      v_id := COALESCE(NEW.id_variante, OLD.id_variante)::text;
      IF TG_OP = 'INSERT' THEN
        v_desc := format('Se creó la variante %s', COALESCE(NEW.codigo_variante, v_id));
      ELSIF TG_OP = 'DELETE' THEN
        v_desc := format('Se eliminó la variante %s', COALESCE(OLD.codigo_variante, v_id));
        v_sev  := 'alerta';
      ELSIF NEW.precio_variante IS DISTINCT FROM OLD.precio_variante THEN
        v_desc := format('Precio de la variante %s: ₡%s → ₡%s',
                         COALESCE(NEW.codigo_variante, v_id),
                         OLD.precio_variante, NEW.precio_variante);
      ELSE
        v_desc := format('Se actualizó la variante %s', COALESCE(NEW.codigo_variante, v_id));
      END IF;

    ELSE
      v_desc := format('%s en %s', TG_OP, TG_TABLE_NAME);
  END CASE;

  INSERT INTO public.registro_actividad (
    categoria, descripcion, severidad, tabla, operacion,
    id_afectado, datos_antes, datos_despues, id_usuario
  ) VALUES (
    'datos', v_desc, v_sev, TG_TABLE_NAME, TG_OP,
    v_id, v_antes, v_despues, public.actor()
  );

  RETURN NULL;  -- AFTER trigger: el valor no se usa
END;
$$;


-- ---------------------------------------------------------------------------
-- Triggers sobre las 6 tablas del núcleo
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_actividad_pedido ON public.pedido;
CREATE TRIGGER trg_actividad_pedido
  AFTER INSERT OR UPDATE OR DELETE ON public.pedido
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();

DROP TRIGGER IF EXISTS trg_actividad_pedidodetalle ON public.pedidodetalle;
CREATE TRIGGER trg_actividad_pedidodetalle
  AFTER INSERT OR UPDATE OR DELETE ON public.pedidodetalle
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();

DROP TRIGGER IF EXISTS trg_actividad_factura ON public.factura;
CREATE TRIGGER trg_actividad_factura
  AFTER INSERT OR UPDATE OR DELETE ON public.factura
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();

DROP TRIGGER IF EXISTS trg_actividad_stock ON public.productotallastock;
CREATE TRIGGER trg_actividad_stock
  AFTER UPDATE OR DELETE ON public.productotallastock
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();

DROP TRIGGER IF EXISTS trg_actividad_producto ON public.producto;
CREATE TRIGGER trg_actividad_producto
  AFTER INSERT OR UPDATE OR DELETE ON public.producto
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();

DROP TRIGGER IF EXISTS trg_actividad_variante ON public.productovariante;
CREATE TRIGGER trg_actividad_variante
  AFTER INSERT OR UPDATE OR DELETE ON public.productovariante
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad();


-- ---------------------------------------------------------------------------
-- Lectura y escritura desde la aplicación
-- ---------------------------------------------------------------------------

/** Registra un evento de sesión o una acción destacada. Lo llama la app. */
CREATE OR REPLACE FUNCTION public.registrar_evento(
  p_categoria    text,
  p_descripcion  text,
  p_severidad    text DEFAULT 'info',
  p_id_usuario   uuid DEFAULT NULL,
  p_email        text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.registro_actividad
    (categoria, descripcion, severidad, id_usuario, usuario_email)
  VALUES
    (p_categoria, p_descripcion, COALESCE(p_severidad, 'info'), p_id_usuario, p_email);
$$;

/** Bitácora paginada, lo último primero, con filtro opcional por categoría. */
CREATE OR REPLACE FUNCTION public.list_actividad(
  p_categoria text DEFAULT NULL,
  p_limit     integer DEFAULT 50,
  p_offset    integer DEFAULT 0
)
RETURNS TABLE (
  id_registro   bigint,
  fecha         timestamptz,
  categoria     text,
  descripcion   text,
  severidad     text,
  tabla         text,
  operacion     text,
  id_afectado   text,
  usuario_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_registro, fecha, categoria, descripcion, severidad,
         tabla, operacion, id_afectado, usuario_email
  FROM public.registro_actividad
  WHERE p_categoria IS NULL OR categoria = p_categoria
  ORDER BY fecha DESC, id_registro DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200)
  OFFSET GREATEST(p_offset, 0);
$$;

-- Fase 0 revocó EXECUTE a anon/authenticated sobre todo el esquema y dejó un
-- ALTER DEFAULT PRIVILEGES para las funciones nuevas. Estos GRANT explícitos
-- son para que service_role pueda ejecutarlas aunque ese default cambie.
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_actividad(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.actor() TO service_role;
GRANT EXECUTE ON FUNCTION public.sku_de_stock(integer) TO service_role;

NOTIFY pgrst, 'reload schema';
