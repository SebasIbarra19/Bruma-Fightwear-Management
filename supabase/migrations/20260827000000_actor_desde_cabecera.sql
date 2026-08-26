-- 3.1.C — que los triggers sepan quién, sin tocar un solo stored procedure.
--
-- El plan original era instrumentar ~15 SPs: agregarles `p_id_usuario` y que
-- cada uno hiciera `set_config('app.user_id', …, true)` al inicio. Antes de
-- escribir eso se probó una vía mucho más barata, y funciona:
--
--   PostgREST publica las cabeceras HTTP de la petición en la variable de
--   sesión `request.headers`, como JSON. Verificado contra la base real:
--     sin cabecera → {"x_bruma_user": null,      "headers_disponibles": true}
--     con cabecera → {"x_bruma_user": "21faff0c…","headers_disponibles": true}
--
-- Así que basta con que la aplicación mande `x-bruma-user` en cada llamada
-- (lo hace interceptando `fetch` en el cliente de servicio, ver
-- `src/lib/api/client.ts`) para que CUALQUIER trigger sepa quién fue. Sin
-- cambiar firmas, sin tocar adaptadores uno por uno, sin riesgo de olvidar
-- alguno: la atribución vale para todos los SPs, incluidos los que se escriban
-- después.
--
-- Se conserva el fallback a `app.user_id` para cuando el cambio no venga por
-- HTTP (una migración, un script, la consola SQL): ahí no hay cabeceras, y
-- `set_config` sigue siendo la única forma de declarar el actor.
--
-- Cuando no hay ninguno de los dos, `actor()` devuelve NULL y la fila queda
-- registrada igual, sin autor. Eso es correcto y deseable: un cambio hecho
-- fuera de la aplicación DEBE verse como tal en la bitácora.

CREATE OR REPLACE FUNCTION public.actor()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v text;
BEGIN
  -- 1) Cabecera de la petición HTTP (el caso normal: viene de la aplicación).
  BEGIN
    v := (current_setting('request.headers', true)::jsonb) ->> 'x-bruma-user';
  EXCEPTION WHEN others THEN
    -- `request.headers` no existe fuera de PostgREST, y podría no ser JSON
    -- válido. Ninguna de las dos cosas debe tumbar la operación auditada.
    v := NULL;
  END;

  -- 2) Variable de sesión, para contextos sin HTTP.
  IF v IS NULL OR v = '' THEN
    v := current_setting('app.user_id', true);
  END IF;

  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;

  RETURN v::uuid;
EXCEPTION
  -- Si llegara basura, se registra sin autor en vez de fallar: una bitácora
  -- incompleta es mucho menos grave que una operación abortada por su bitácora.
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.actor() IS
  'Usuario responsable del cambio: cabecera x-bruma-user (PostgREST) o GUC app.user_id. NULL si el cambio no vino de la aplicación.';

GRANT EXECUTE ON FUNCTION public.actor() TO service_role;


-- Los triggers guardaban `id_usuario` pero no el email, porque en la etapa 1
-- nunca había usuario que resolver. Ahora sí lo hay: desnormalizarlo evita
-- depender de `auth.users` para leer la bitácora —y que un usuario borrado
-- convierta su historial en una lista de uuids anónimos.
CREATE OR REPLACE FUNCTION public.email_de(p_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT email FROM auth.users WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.email_de(uuid) TO service_role;


-- Se reemplaza solo el INSERT final del trigger para que además guarde el
-- email. El resto de la función (las descripciones legibles por tabla) queda
-- exactamente igual que en 20260826000000.
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
  v_actor     uuid := public.actor();
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
    id_afectado, datos_antes, datos_despues, id_usuario, usuario_email
  ) VALUES (
    'datos', v_desc, v_sev, TG_TABLE_NAME, TG_OP,
    v_id, v_antes, v_despues, v_actor, public.email_de(v_actor)
  );

  RETURN NULL;
END;
$$;

-- Sonda temporal de 3.1.C: confirmó que PostgREST expone `request.headers`.
-- Cumplida su función, se va: no debe quedar superficie extra publicada.
DROP FUNCTION IF EXISTS public.probe_headers();

NOTIFY pgrst, 'reload schema';
