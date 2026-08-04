-- Updated schema for BRUMA Management App
-- Includes inventory movements and product images.

-- Tables for basic entities
CREATE TABLE public.cliente (
  id_cliente SERIAL PRIMARY KEY,
  nombre character varying NOT NULL,
  apellido character varying,
  email character varying NOT NULL UNIQUE,
  telefono character varying,
  direccion text,
  ciudad character varying,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.codigoenvio (
  id_codigo SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  descripcion character varying
);

CREATE TABLE public.coleccion (
  id_coleccion SERIAL PRIMARY KEY,
  nombre character varying NOT NULL,
  descripcion text
);

CREATE TABLE public.color (
  id_color SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  hex_code character varying,
  activo boolean DEFAULT true
);

CREATE TABLE public.estado (
  id_estado SERIAL PRIMARY KEY,
  nombre character varying NOT NULL UNIQUE
);

CREATE TABLE public.metodopago (
  id_metodo_pago SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  requiere_referencia boolean NOT NULL DEFAULT false,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Main e-commerce entities
CREATE TABLE public.tipoproducto (
  id_tipo SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL
);

CREATE TABLE public.proveedor (
  id_proveedor SERIAL PRIMARY KEY,
  nombre character varying NOT NULL,
  contacto character varying,
  telefono character varying,
  email character varying
);

CREATE TABLE public.producto (
  id_producto SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  descripcion text,
  id_proveedor integer REFERENCES public.proveedor(id_proveedor),
  id_categoria integer REFERENCES public.tipoproducto(id_tipo),
  id_coleccion integer REFERENCES public.coleccion(id_coleccion),
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.producto_imagen (
  id_imagen SERIAL PRIMARY KEY,
  id_producto integer NOT NULL REFERENCES public.producto(id_producto) ON DELETE CASCADE,
  url text NOT NULL,
  es_principal boolean DEFAULT false,
  orden integer DEFAULT 0,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.productovariante (
  id_variante SERIAL PRIMARY KEY,
  id_producto integer NOT NULL REFERENCES public.producto(id_producto) ON DELETE CASCADE,
  id_color integer REFERENCES public.color(id_color),
  codigo_variante character varying UNIQUE,
  nombre_variante character varying,
  precio_variante numeric,
  activo boolean DEFAULT true
);

CREATE TABLE public.tallabase (
  id_talla SERIAL PRIMARY KEY,
  codigo character varying NOT NULL,
  descripcion character varying
);

CREATE TABLE public.tallaproveedor (
  id_talla_proveedor SERIAL PRIMARY KEY,
  id_proveedor integer NOT NULL REFERENCES public.proveedor(id_proveedor),
  id_talla integer NOT NULL REFERENCES public.tallabase(id_talla),
  medida_pecho numeric,
  medida_cintura numeric,
  medida_largo numeric,
  codigo_talla_proveedor character varying,
  descripcion_talla text
);

CREATE TABLE public.productotallastock (
  id_producto_talla SERIAL PRIMARY KEY,
  id_variante integer NOT NULL REFERENCES public.productovariante(id_variante) ON DELETE CASCADE,
  id_talla_proveedor integer NOT NULL REFERENCES public.tallaproveedor(id_talla_proveedor),
  stock integer NOT NULL DEFAULT 0,
  precio numeric NOT NULL
);

CREATE TABLE public.inventario_movimiento (
  id_movimiento SERIAL PRIMARY KEY,
  id_producto_talla integer NOT NULL REFERENCES public.productotallastock(id_producto_talla),
  tipo_movimiento character varying NOT NULL, -- 'entrada', 'salida', 'ajuste'
  cantidad integer NOT NULL,
  motivo text,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  referencia_pedido integer -- Opcional, si el movimiento es por un pedido
);

-- Orders
CREATE TABLE public.pedido (
  id_pedido SERIAL PRIMARY KEY,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id_estado integer NOT NULL REFERENCES public.estado(id_estado),
  id_codigo_envio integer REFERENCES public.codigoenvio(id_codigo),
  id_cliente integer REFERENCES public.cliente(id_cliente),
  cliente_nombre character varying,
  cliente_email character varying,
  total numeric,
  notas text,
  id_metodo_pago integer REFERENCES public.metodopago(id_metodo_pago),
  referencia_pago character varying,
  notas_pago text,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.pedidodetalle (
  id_pedido_detalle SERIAL PRIMARY KEY,
  id_pedido integer NOT NULL REFERENCES public.pedido(id_pedido) ON DELETE CASCADE,
  id_producto_talla integer NOT NULL REFERENCES public.productotallastock(id_producto_talla),
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL
);

-- Measurements system
CREATE TABLE public.tipomedida (
  id_tipo_medida SERIAL PRIMARY KEY,
  codigo character varying NOT NULL UNIQUE,
  unidad character varying DEFAULT 'cm'::character varying,
  descripcion text,
  activo boolean DEFAULT true
);

CREATE TABLE public.tipoproducto_medida (
  id_tipo_producto_medida SERIAL PRIMARY KEY,
  id_tipo_producto integer NOT NULL REFERENCES public.tipoproducto(id_tipo),
  id_tipo_medida integer NOT NULL REFERENCES public.tipomedida(id_tipo_medida),
  obligatorio boolean DEFAULT false,
  orden_display integer DEFAULT 0
);

CREATE TABLE public.tallaproveedor_medida (
  id_talla_proveedor_medida SERIAL PRIMARY KEY,
  id_talla_proveedor integer NOT NULL REFERENCES public.tallaproveedor(id_talla_proveedor),
  id_tipo_medida integer NOT NULL REFERENCES public.tipomedida(id_tipo_medida),
  valor numeric NOT NULL,
  tolerancia numeric
);

-- ================================================
-- STORED PROCEDURE: add_order_item
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.add_order_item(
  p_id_pedido integer,
  p_id_producto_talla integer,
  p_cantidad integer,
  p_precio_unitario numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_detalle integer;
BEGIN
  -- Insertar el detalle del pedido
  INSERT INTO public.pedidodetalle (
    id_pedido,
    id_producto_talla,
    cantidad,
    precio_unitario
  ) VALUES (
    p_id_pedido,
    p_id_producto_talla,
    p_cantidad,
    p_precio_unitario
  )
  RETURNING id_pedido_detalle INTO v_id_detalle;

  -- Descontar stock
  UPDATE public.productotallastock
  SET stock = stock - p_cantidad
  WHERE id_producto_talla = p_id_producto_talla;

  -- Registrar movimiento de inventario
  INSERT INTO public.inventario_movimiento (
    id_producto_talla,
    tipo_movimiento,
    cantidad,
    motivo,
    referencia_pedido
  ) VALUES (
    p_id_producto_talla,
    'salida',
    p_cantidad,
    'Venta - Pedido #' || p_id_pedido,
    p_id_pedido
  );

  RETURN v_id_detalle;
END;
$$;

-- ================================================
-- STORED PROCEDURE: add_product_image
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.add_product_image(
  p_id_producto integer,
  p_url text,
  p_es_principal boolean DEFAULT false,
  p_orden integer DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id_imagen integer;
BEGIN
  -- Si esta imagen es principal, quitar principal a las demás del mismo producto
  IF p_es_principal THEN
    UPDATE public.producto_imagen
    SET es_principal = false
    WHERE id_producto = p_id_producto;
  END IF;

  INSERT INTO public.producto_imagen (
    id_producto,
    url,
    es_principal,
    orden
  ) VALUES (
    p_id_producto,
    p_url,
    p_es_principal,
    p_orden
  )
  RETURNING id_imagen INTO v_id_imagen;

  RETURN v_id_imagen;
END;
$$;

-- ================================================
-- STORED PROCEDURE: adjust_inventory
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_id_variante integer,
  p_id_talla_proveedor integer,
  p_cantidad_cambio integer,
  p_motivo text DEFAULT 'ajuste manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_actual integer;
  v_nuevo_stock integer;
  v_id_producto_talla integer;
  v_tipo_movimiento text;
BEGIN
  SELECT id_producto_talla, stock
  INTO v_id_producto_talla, v_stock_actual
  FROM public.productotallastock
  WHERE id_variante = p_id_variante
    AND id_talla_proveedor = p_id_talla_proveedor
  LIMIT 1;

  IF v_id_producto_talla IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para variante % y talla %', p_id_variante, p_id_talla_proveedor;
  END IF;

  v_nuevo_stock := v_stock_actual + p_cantidad_cambio;
  v_tipo_movimiento := CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END;

  -- Actualizar stock
  UPDATE public.productotallastock
  SET stock = GREATEST(v_nuevo_stock, 0)
  WHERE id_producto_talla = v_id_producto_talla;

  -- Registrar movimiento
  INSERT INTO public.inventario_movimiento (
    id_producto_talla,
    tipo_movimiento,
    cantidad,
    motivo
  ) VALUES (
    v_id_producto_talla,
    v_tipo_movimiento,
    ABS(p_cantidad_cambio),
    p_motivo
  );

  RETURN jsonb_build_object(
    'id_producto_talla', v_id_producto_talla,
    'stock_anterior', v_stock_actual,
    'cambio', p_cantidad_cambio,
    'stock_nuevo', GREATEST(v_nuevo_stock, 0),
    'tipo_movimiento', v_tipo_movimiento,
    'success', TRUE
  );
END;
$$;

-- ================================================
-- STORED PROCEDURE: bulk_update_variants
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.bulk_update_variants(params jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
  updated_count integer := 0;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(params, '[]'::jsonb))
  LOOP
    UPDATE public.productovariante
    SET
      id_color = COALESCE((item ->> 'id_color')::integer, id_color),
      codigo_variante = COALESCE(item ->> 'codigo_variante', codigo_variante),
      nombre_variante = COALESCE(item ->> 'nombre_variante', nombre_variante),
      precio_variante = COALESCE((item ->> 'precio_variante')::numeric, precio_variante),
      activo = COALESCE((item ->> 'activo')::boolean, activo)
    WHERE id_variante = (item ->> 'id_variante')::integer;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', TRUE, 'updated_count', updated_count);
END;
$$;

-- ================================================
-- STORED PROCEDURE: create_category
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_category(
  p_nombre character varying,
  p_codigo character varying DEFAULT NULL
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.tipoproducto (
      nombre,
      codigo
    )
    VALUES (
      p_nombre,
      COALESCE(p_codigo, lower(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '-', 'g')))
    )
    RETURNING id_tipo, nombre, codigo
  )
  SELECT
    i.id_tipo,
    i.nombre,
    i.codigo
  FROM inserted i;
$$;

-- ================================================
-- STORED PROCEDURE: create_customer
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_customer(
  p_nombre character varying,
  p_apellido character varying DEFAULT NULL,
  p_email character varying DEFAULT NULL,
  p_telefono character varying DEFAULT NULL,
  p_activo boolean DEFAULT TRUE
)
RETURNS TABLE (
  id_cliente integer,
  nombre character varying,
  apellido character varying,
  email character varying,
  telefono character varying,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.cliente (
      nombre,
      apellido,
      email,
      telefono,
      activo
    )
    VALUES (
      p_nombre,
      p_apellido,
      p_email,
      p_telefono,
      COALESCE(p_activo, TRUE)
    )
    RETURNING id_cliente, nombre, apellido, email, telefono, activo
  )
  SELECT
    i.id_cliente,
    i.nombre,
    i.apellido,
    i.email,
    i.telefono,
    i.activo
  FROM inserted i;
$$;

-- ================================================
-- STORED PROCEDURE: create_order
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_order(
  p_id_estado integer,
  p_id_codigo_envio integer DEFAULT NULL,
  p_id_cliente integer DEFAULT NULL,
  p_cliente_nombre character varying DEFAULT NULL,
  p_cliente_email character varying DEFAULT NULL,
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
    id_estado,
    id_codigo_envio,
    id_cliente,
    cliente_nombre,
    cliente_email,
    total,
    notas,
    id_metodo_pago,
    referencia_pago,
    notas_pago
  ) VALUES (
    p_id_estado,
    p_id_codigo_envio,
    p_id_cliente,
    p_cliente_nombre,
    p_cliente_email,
    p_total,
    p_notas,
    p_id_metodo_pago,
    p_referencia_pago,
    p_notas_pago
  )
  RETURNING id_pedido, fecha, id_estado, id_codigo_envio, id_cliente, cliente_nombre, cliente_email, total, notas, id_metodo_pago, referencia_pago, notas_pago;
$$;

-- ================================================
-- STORED PROCEDURE: create_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_product(
  p_nombre character varying,
  p_descripcion text DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_activo boolean DEFAULT TRUE
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  activo boolean,
  fecha_creacion timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.producto (
      nombre,
      descripcion,
      codigo,
      id_categoria,
      activo
    )
    VALUES (
      p_nombre,
      p_descripcion,
      COALESCE(p_codigo, upper(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '', 'g'))),
      p_id_categoria,
      COALESCE(p_activo, TRUE)
    )
    RETURNING id_producto, nombre, descripcion, codigo, id_categoria, activo, fecha_creacion
  )
  SELECT
    i.id_producto,
    i.nombre,
    i.descripcion,
    i.codigo,
    i.id_categoria,
    i.activo,
    i.fecha_creacion
  FROM inserted i;
$$;

-- ================================================
-- STORED PROCEDURE: create_product_variant
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_product_variant(
  p_id_producto integer,
  p_id_color integer DEFAULT NULL,
  p_codigo_variante character varying DEFAULT NULL,
  p_nombre_variante character varying DEFAULT NULL,
  p_precio_variante numeric DEFAULT NULL,
  p_activo boolean DEFAULT TRUE
)
RETURNS TABLE (
  id_variante integer,
  id_producto integer,
  id_color integer,
  codigo_variante character varying,
  nombre_variante character varying,
  precio_variante numeric,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.productovariante (
      id_producto,
      id_color,
      codigo_variante,
      nombre_variante,
      precio_variante,
      activo
    )
    VALUES (
      p_id_producto,
      p_id_color,
      p_codigo_variante,
      p_nombre_variante,
      p_precio_variante,
      COALESCE(p_activo, TRUE)
    )
    RETURNING id_variante, id_producto, id_color, codigo_variante, nombre_variante, precio_variante, activo
  )
  SELECT * FROM inserted;
$$;

-- ================================================
-- STORED PROCEDURE: create_supplier
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.create_supplier(
  p_nombre character varying,
  p_contacto character varying DEFAULT NULL,
  p_telefono character varying DEFAULT NULL,
  p_email character varying DEFAULT NULL
)
RETURNS TABLE (
  id_proveedor integer,
  nombre character varying,
  contacto character varying,
  telefono character varying,
  email character varying
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.proveedor (
      nombre,
      contacto,
      telefono,
      email
    )
    VALUES (
      p_nombre,
      p_contacto,
      p_telefono,
      p_email
    )
    RETURNING id_proveedor, nombre, contacto, telefono, email
  )
  SELECT * FROM inserted;
$$;

-- ================================================
-- STORED PROCEDURE: delete_category
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_category(
  p_id_tipo integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.tipoproducto
    WHERE id_tipo = p_id_tipo
    RETURNING id_tipo
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM deleted),
    'deleted_id', (SELECT id_tipo FROM deleted)
  );
$$;

-- ================================================
-- STORED PROCEDURE: delete_customer
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_customer(
  p_id_cliente integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.cliente
    WHERE id_cliente = p_id_cliente
    RETURNING id_cliente
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM deleted),
    'deleted_id', (SELECT id_cliente FROM deleted)
  );
$$;

-- ================================================
-- STORED PROCEDURE: delete_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_product(
  p_id_producto integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.producto
    WHERE id_producto = p_id_producto
    RETURNING id_producto
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM deleted),
    'deleted_id', (SELECT id_producto FROM deleted)
  );
$$;

-- ================================================
-- STORED PROCEDURE: delete_product_variant
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_product_variant(
  p_id_variante integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.productovariante
    WHERE id_variante = p_id_variante
    RETURNING id_variante
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM deleted),
    'deleted_id', (SELECT id_variante FROM deleted)
  );
$$;

-- ================================================
-- STORED PROCEDURE: delete_supplier
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.delete_supplier(
  p_id_proveedor integer
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.proveedor
    WHERE id_proveedor = p_id_proveedor
    RETURNING id_proveedor
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM deleted),
    'deleted_id', (SELECT id_proveedor FROM deleted)
  );
$$;

-- ================================================
-- STORED PROCEDURE: duplicate_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.duplicate_product(
  p_id_producto integer,
  p_sufijo_nombre text DEFAULT 'Copia'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_producto record;
  v_nuevo_id integer;
BEGIN
  SELECT * INTO v_producto
  FROM public.producto
  WHERE id_producto = p_id_producto;

  IF v_producto.id_producto IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  INSERT INTO public.producto (
    nombre,
    codigo,
    descripcion,
    id_proveedor,
    id_categoria,
    id_coleccion,
    activo
  )
  VALUES (
    v_producto.nombre || ' ' || p_sufijo_nombre,
    v_producto.codigo || '-' || upper(left(p_sufijo_nombre, 3)),
    v_producto.descripcion,
    v_producto.id_proveedor,
    v_producto.id_categoria,
    v_producto.id_coleccion,
    v_producto.activo
  )
  RETURNING id_producto INTO v_nuevo_id;

  RETURN jsonb_build_object('success', TRUE, 'id_producto', v_nuevo_id);
END;
$$;

-- ================================================
-- STORED PROCEDURE: duplicate_supplier
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.duplicate_supplier(
  p_id_proveedor integer,
  p_sufijo_nombre text DEFAULT 'Copia'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proveedor record;
  v_nuevo_id integer;
BEGIN
  SELECT * INTO v_proveedor
  FROM public.proveedor
  WHERE id_proveedor = p_id_proveedor;

  IF v_proveedor.id_proveedor IS NULL THEN
    RAISE EXCEPTION 'Proveedor no encontrado';
  END IF;

  INSERT INTO public.proveedor (
    nombre,
    contacto,
    telefono,
    email
  )
  VALUES (
    v_proveedor.nombre || ' ' || p_sufijo_nombre,
    v_proveedor.contacto,
    v_proveedor.telefono,
    v_proveedor.email
  )
  RETURNING id_proveedor INTO v_nuevo_id;

  RETURN jsonb_build_object('success', TRUE, 'id_proveedor', v_nuevo_id);
END;
$$;

-- ================================================
-- STORED PROCEDURE: get_inventory_valuation
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_inventory_valuation()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      COUNT(DISTINCT pv.id_producto) AS total_productos,
      COUNT(*) AS total_items,
      COALESCE(SUM(pts.precio * pts.stock), 0) AS valor_total,
      COUNT(*) FILTER (WHERE pts.stock > 0 AND pts.stock <= 5) AS items_bajo_stock,
      COUNT(*) FILTER (WHERE pts.stock <= 0) AS items_sin_stock
    FROM public.productotallastock pts
    JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  )
  SELECT jsonb_build_object(
    'total_productos', COALESCE((SELECT total_productos FROM stats), 0),
    'total_items', COALESCE((SELECT total_items FROM stats), 0),
    'valor_total', COALESCE((SELECT valor_total FROM stats), 0),
    'items_bajo_stock', COALESCE((SELECT items_bajo_stock FROM stats), 0),
    'items_sin_stock', COALESCE((SELECT items_sin_stock FROM stats), 0)
  );
$$;

-- ================================================
-- STORED PROCEDURE: get_low_stock_alerts
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_alerts()
RETURNS TABLE (
  id_producto_talla integer,
  producto_nombre character varying,
  variante_nombre character varying,
  stock integer,
  precio numeric,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pts.id_producto_talla,
    p.nombre AS producto_nombre,
    pv.nombre_variante AS variante_nombre,
    pts.stock,
    pts.precio,
    CASE WHEN pts.stock <= 0 THEN 'critical' ELSE 'warning' END AS status
  FROM public.productotallastock pts
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  WHERE pts.stock <= 5
  ORDER BY pts.stock ASC, p.nombre ASC;
$$;

-- ================================================
-- STORED PROCEDURE: get_order_analytics
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_order_analytics(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT *
    FROM public.pedido o
    WHERE (p_start_date IS NULL OR o.fecha::date >= p_start_date)
      AND (p_end_date IS NULL OR o.fecha::date <= p_end_date)
  )
  SELECT jsonb_build_object(
    'total_pedidos', (SELECT COUNT(*) FROM filtered),
    'total_ingresos', COALESCE((SELECT SUM(total) FROM filtered), 0),
    'promedio_pedido', COALESCE((SELECT AVG(total) FROM filtered), 0)
  );
$$;

-- ================================================
-- STORED PROCEDURE: generate_inventory_report
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.generate_inventory_report()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'valuacion', public.get_inventory_valuation(),
    'generado_en', now()
  );
$$;

-- ================================================
-- STORED PROCEDURE: generate_sales_report
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.generate_sales_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'analitica', public.get_order_analytics(p_start_date, p_end_date),
    'generado_en', now()
  );
$$;

-- ================================================
-- STORED PROCEDURE: get_category
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_category(
  p_id_tipo integer
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id_tipo,
    c.nombre,
    c.codigo,
    COALESCE(pc.product_count, 0)::bigint AS product_count
  FROM public.tipoproducto c
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS product_count
    FROM public.producto p
    WHERE p.id_categoria = c.id_tipo
  ) pc ON TRUE
  WHERE c.id_tipo = p_id_tipo
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_customer
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_customer(
  p_id_cliente integer
)
RETURNS TABLE (
  id_cliente integer,
  nombre character varying,
  apellido character varying,
  email character varying,
  telefono character varying,
  direccion text,
  ciudad character varying,
  activo boolean,
  total_pedidos bigint,
  ultima_fecha_pedido timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id_cliente,
    c.nombre,
    c.apellido,
    c.email,
    c.telefono,
    c.direccion,
    c.ciudad,
    c.activo,
    COALESCE(p_stats.total_pedidos, 0)::bigint AS total_pedidos,
    p_stats.ultima_fecha_pedido
  FROM public.cliente c
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*)::bigint AS total_pedidos,
      MAX(fecha) AS ultima_fecha_pedido
    FROM public.pedido p
    WHERE p.id_cliente = c.id_cliente
  ) p_stats ON TRUE
  WHERE c.id_cliente = p_id_cliente
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_dashboard_stats
-- Schema: public
-- ================================================

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
    'proveedores', (SELECT COUNT(*) FROM public.proveedor)
  );
$$;

-- ================================================
-- STORED PROCEDURE: get_inventory_movements
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_inventory_movements(
  p_id_producto_talla integer DEFAULT NULL,
  p_tipo_movimiento text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_movimiento integer,
  id_producto_talla integer,
  producto_nombre character varying,
  variante_nombre character varying,
  tipo_movimiento character varying,
  cantidad integer,
  motivo text,
  fecha timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id_movimiento,
    m.id_producto_talla,
    p.nombre AS producto_nombre,
    pv.nombre_variante AS variante_nombre,
    m.tipo_movimiento,
    m.cantidad,
    m.motivo,
    m.fecha
  FROM public.inventario_movimiento m
  JOIN public.productotallastock pts ON pts.id_producto_talla = m.id_producto_talla
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  WHERE (p_id_producto_talla IS NULL OR m.id_producto_talla = p_id_producto_talla)
    AND (p_tipo_movimiento IS NULL OR m.tipo_movimiento = p_tipo_movimiento)
  ORDER BY m.fecha DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: get_order_details
-- Schema: public
-- ================================================

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
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(oi)) FROM public.pedidodetalle oi WHERE oi.id_pedido = o.id_pedido), '[]'::jsonb)
  )
  FROM public.pedido o
  LEFT JOIN public.cliente c ON c.id_cliente = o.id_cliente
  WHERE o.id_pedido = p_id_pedido
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_product(
  p_id_producto integer DEFAULT NULL,
  p_codigo character varying DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  categoria_nombre character varying,
  activo boolean,
  variante_count bigint,
  stock_total bigint,
  variantes jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.codigo,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.activo,
    COALESCE(vs.variante_count, 0)::bigint AS variante_count,
    COALESCE(vs.stock_total, 0)::bigint AS stock_total,
    COALESCE(var_json.variantes, '[]'::jsonb) AS variantes
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN LATERAL (
    SELECT
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    WHERE pv.id_producto = p.id_producto
  ) vs ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_variante', pv.id_variante,
        'id_color', pv.id_color,
        'codigo_variante', pv.codigo_variante,
        'nombre_variante', pv.nombre_variante,
        'precio_variante', pv.precio_variante,
        'activo', pv.activo,
        'stock_tallas', (
           SELECT jsonb_agg(to_jsonb(pts))
           FROM public.productotallastock pts
           WHERE pts.id_variante = pv.id_variante
        )
      )
    ) AS variantes
    FROM public.productovariante pv
    WHERE pv.id_producto = p.id_producto
  ) var_json ON TRUE
  WHERE (p_id_producto IS NOT NULL AND p.id_producto = p_id_producto)
     OR (p_id_producto IS NULL AND p_codigo IS NOT NULL AND p.codigo = p_codigo)
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_product_images
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_product_images(
  p_id_producto integer
)
RETURNS TABLE (
  id_imagen integer,
  url text,
  es_principal boolean,
  orden integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id_imagen,
    url,
    es_principal,
    orden
  FROM public.producto_imagen
  WHERE id_producto = p_id_producto
  ORDER BY es_principal DESC, orden ASC;
$$;

-- ================================================
-- STORED PROCEDURE: get_product_variant
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_product_variant(
  p_id_variante integer
)
RETURNS TABLE (
  id_variante integer,
  id_producto integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  nombre_variante character varying,
  codigo_variante character varying,
  id_color integer,
  color_nombre character varying,
  precio_variante numeric,
  activo boolean,
  stock_total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.id_variante,
    pv.id_producto,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    pv.id_color,
    col.nombre AS color_nombre,
    pv.precio_variante,
    pv.activo,
    COALESCE(i.stock_total, 0)::bigint AS stock_total
  FROM public.productovariante pv
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.color col ON col.id_color = pv.id_color
  LEFT JOIN LATERAL (
    SELECT SUM(pts.stock)::bigint AS stock_total
    FROM public.productotallastock pts
    WHERE pts.id_variante = pv.id_variante
  ) i ON TRUE
  WHERE pv.id_variante = p_id_variante
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_stock_status
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_stock_status(
  p_id_producto integer DEFAULT NULL,
  p_id_variante integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id_producto', p_id_producto,
    'id_variante', p_id_variante,
    'status', CASE
      WHEN EXISTS (
        SELECT 1 
        FROM public.productotallastock pts
        JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
        WHERE (p_id_producto IS NULL OR pv.id_producto = p_id_producto)
          AND (p_id_variante IS NULL OR pts.id_variante = p_id_variante)
          AND pts.stock <= 0
      ) THEN 'critical'
      WHEN EXISTS (
        SELECT 1 
        FROM public.productotallastock pts
        JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
        WHERE (p_id_producto IS NULL OR pv.id_producto = p_id_producto)
          AND (p_id_variante IS NULL OR pts.id_variante = p_id_variante)
          AND pts.stock <= 5
      ) THEN 'warning'
      ELSE 'normal'
    END
  );
$$;

-- ================================================
-- STORED PROCEDURE: get_supplier
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_supplier(
  p_id_proveedor integer
)
RETURNS TABLE (
  id_proveedor integer,
  nombre character varying,
  contacto character varying,
  telefono character varying,
  email character varying
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id_proveedor,
    s.nombre,
    s.contacto,
    s.telefono,
    s.email
  FROM public.proveedor s
  WHERE s.id_proveedor = p_id_proveedor
  LIMIT 1;
$$;

-- ================================================
-- STORED PROCEDURE: get_system_notifications
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.get_system_notifications()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'tipo', 'bajo_stock',
        'mensaje', p.nombre || COALESCE(' / ' || pv.nombre_variante, ''),
        'creado_en', now()
      )
    )
    FROM public.productotallastock pts
    JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
    JOIN public.producto p ON p.id_producto = pv.id_producto
    WHERE pts.stock <= 5
  ), '[]'::jsonb);
$$;

-- ================================================
-- STORED PROCEDURE: list_categories
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_categories(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id_tipo,
    c.nombre,
    c.codigo,
    COALESCE(pc.product_count, 0)::bigint AS product_count
  FROM public.tipoproducto c
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS product_count
    FROM public.producto p
    WHERE p.id_categoria = c.id_tipo
  ) pc ON TRUE
  WHERE (
      p_search IS NULL
      OR p_search = ''
      OR c.nombre ILIKE '%' || p_search || '%'
      OR c.codigo ILIKE '%' || p_search || '%'
    )
  ORDER BY c.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_categories_with_counts
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_categories_with_counts(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.list_categories(
    p_limit,
    p_offset,
    p_search
  );
$$;

-- ================================================
-- STORED PROCEDURE: list_customers
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_customers(
  p_search text DEFAULT NULL,
  p_solo_activos boolean DEFAULT FALSE,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_cliente integer,
  nombre character varying,
  apellido character varying,
  email character varying,
  telefono character varying,
  direccion text,
  ciudad character varying,
  activo boolean,
  total_pedidos bigint,
  ultima_fecha_pedido timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id_cliente,
    c.nombre,
    c.apellido,
    c.email,
    c.telefono,
    c.direccion,
    c.ciudad,
    c.activo,
    COALESCE(p_stats.total_pedidos, 0)::bigint AS total_pedidos,
    p_stats.ultima_fecha_pedido
  FROM public.cliente c
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*)::bigint AS total_pedidos,
      MAX(fecha) AS ultima_fecha_pedido
    FROM public.pedido p
    WHERE p.id_cliente = c.id_cliente
  ) p_stats ON TRUE
  WHERE (p_solo_activos = FALSE OR c.activo = TRUE)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR c.nombre ILIKE '%' || p_search || '%'
      OR c.apellido ILIKE '%' || p_search || '%'
      OR c.email ILIKE '%' || p_search || '%'
      OR c.telefono ILIKE '%' || p_search || '%'
    )
  ORDER BY c.nombre ASC, c.apellido ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_inventory_grouped_by_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_inventory_grouped_by_product()
RETURNS TABLE (
  id_producto integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  id_variante integer,
  variante_nombre character varying,
  variante_codigo character varying,
  precio_variante numeric,
  stock_total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id_producto,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    pv.id_variante,
    pv.nombre_variante,
    pv.codigo_variante,
    pv.precio_variante,
    COALESCE(i.stock_total, 0)::bigint AS stock_total
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  JOIN public.productovariante pv ON pv.id_producto = p.id_producto
  LEFT JOIN LATERAL (
    SELECT SUM(pts.stock)::bigint AS stock_total
    FROM public.productotallastock pts
    WHERE pts.id_variante = pv.id_variante
  ) i ON TRUE
  ORDER BY p.nombre ASC, pv.nombre_variante ASC;
$$;

-- ================================================
-- STORED PROCEDURE: list_inventory_items
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_inventory_items(
  p_incluir_stock_cero boolean DEFAULT false,
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_producto_talla integer,
  id_producto integer,
  id_variante integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  variante_nombre character varying,
  variante_codigo character varying,
  stock integer,
  precio numeric,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pts.id_producto_talla,
    p.id_producto,
    pv.id_variante,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    pts.stock,
    pts.precio,
    CASE
      WHEN pts.stock <= 0 THEN 'critical'
      WHEN pts.stock <= 5 THEN 'warning'
      ELSE 'normal'
    END AS status
  FROM public.productotallastock pts
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  WHERE (p_incluir_stock_cero OR pts.stock > 0)
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
  ORDER BY p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_orders
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_orders(
  p_id_cliente integer DEFAULT NULL,
  p_id_estado integer DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_min_amount numeric DEFAULT NULL,
  p_max_amount numeric DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_pedido integer,
  fecha timestamp without time zone,
  id_estado integer,
  estado_nombre character varying,
  id_cliente integer,
  cliente_nombre character varying,
  cliente_email character varying,
  total numeric,
  id_metodo_pago integer,
  metodo_pago_nombre character varying,
  items_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id_pedido,
    o.fecha,
    o.id_estado,
    e.nombre AS estado_nombre,
    o.id_cliente,
    COALESCE(o.cliente_nombre, trim(concat_ws(' ', c.nombre, c.apellido))) AS cliente_nombre,
    COALESCE(o.cliente_email, c.email) AS cliente_email,
    o.total,
    o.id_metodo_pago,
    mp.nombre AS metodo_pago_nombre,
    COALESCE(oi.items_count, 0)::bigint AS items_count
  FROM public.pedido o
  LEFT JOIN public.cliente c ON c.id_cliente = o.id_cliente
  LEFT JOIN public.estado e ON e.id_estado = o.id_estado
  LEFT JOIN public.metodopago mp ON mp.id_metodo_pago = o.id_metodo_pago
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS items_count
    FROM public.pedidodetalle od
    WHERE od.id_pedido = o.id_pedido
  ) oi ON TRUE
  WHERE (p_id_cliente IS NULL OR o.id_cliente = p_id_cliente)
    AND (p_id_estado IS NULL OR o.id_estado = p_id_estado)
    AND (p_start_date IS NULL OR o.fecha::date >= p_start_date)
    AND (p_end_date IS NULL OR o.fecha::date <= p_end_date)
    AND (p_min_amount IS NULL OR o.total >= p_min_amount)
    AND (p_max_amount IS NULL OR o.total <= p_max_amount)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR o.cliente_nombre ILIKE '%' || p_search || '%'
      OR o.cliente_email ILIKE '%' || p_search || '%'
      OR COALESCE(c.nombre, '') ILIKE '%' || p_search || '%'
      OR COALESCE(c.apellido, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY o.fecha DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_orders_with_details
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_orders_with_details(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'pedido', to_jsonb(o),
        'items', COALESCE((
          SELECT jsonb_agg(to_jsonb(oi))
          FROM public.pedidodetalle oi
          WHERE oi.id_pedido = o.id_pedido
        ), '[]'::jsonb)
      )
      ORDER BY o.fecha DESC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT *
    FROM public.pedido
    ORDER BY fecha DESC
    LIMIT p_limit
    OFFSET p_offset
  ) o;
$$;

-- ================================================
-- STORED PROCEDURE: list_products
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_products(
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_activo boolean DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  categoria_nombre character varying,
  activo boolean,
  variante_count bigint,
  stock_total bigint,
  fecha_creacion timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH variant_stats AS (
    SELECT
      pv.id_producto,
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    GROUP BY pv.id_producto
  )
  SELECT
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.codigo,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.activo,
    COALESCE(vs.variante_count, 0)::bigint AS variante_count,
    COALESCE(vs.stock_total, 0)::bigint AS stock_total,
    p.fecha_creacion
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN variant_stats vs ON vs.id_producto = p.id_producto
  WHERE (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    AND (p_activo IS NULL OR p.activo = p_activo)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.nombre ILIKE '%' || p_search || '%'
      OR COALESCE(p.codigo, '') ILIKE '%' || p_search || '%'
      OR COALESCE(c.nombre, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY p.fecha_creacion DESC, p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_product_variants
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_product_variants(
  p_id_producto integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_variante integer,
  id_producto integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  nombre_variante character varying,
  codigo_variante character varying,
  id_color integer,
  color_nombre character varying,
  precio_variante numeric,
  activo boolean,
  stock_total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.id_variante,
    pv.id_producto,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    pv.id_color,
    col.nombre AS color_nombre,
    pv.precio_variante,
    pv.activo,
    COALESCE(i.stock_total, 0)::bigint AS stock_total
  FROM public.productovariante pv
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.color col ON col.id_color = pv.id_color
  LEFT JOIN LATERAL (
    SELECT SUM(pts.stock)::bigint AS stock_total
    FROM public.productotallastock pts
    WHERE pts.id_variante = pv.id_variante
  ) i ON TRUE
  WHERE (p_id_producto IS NULL OR pv.id_producto = p_id_producto)
  ORDER BY pv.id_variante ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: list_suppliers
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.list_suppliers(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_proveedor integer,
  nombre character varying,
  contacto character varying,
  telefono character varying,
  email character varying
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id_proveedor,
    s.nombre,
    s.contacto,
    s.telefono,
    s.email
  FROM public.proveedor s
  WHERE (
      p_search IS NULL
      OR p_search = ''
      OR s.nombre ILIKE '%' || p_search || '%'
      OR COALESCE(s.contacto, '') ILIKE '%' || p_search || '%'
      OR COALESCE(s.email, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY s.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ================================================
-- STORED PROCEDURE: transfer_stock
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.transfer_stock(
  p_id_variante_origen integer,
  p_id_talla_origen integer,
  p_id_variante_destino integer,
  p_id_talla_destino integer,
  p_cantidad integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.productotallastock
  SET stock = GREATEST(stock - p_cantidad, 0)
  WHERE id_variante = p_id_variante_origen AND id_talla_proveedor = p_id_talla_origen;

  UPDATE public.productotallastock
  SET stock = stock + p_cantidad
  WHERE id_variante = p_id_variante_destino AND id_talla_proveedor = p_id_talla_destino;

  RETURN jsonb_build_object('success', TRUE, 'cantidad', p_cantidad);
END;
$$;

-- ================================================
-- STORED PROCEDURE: update_category
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.update_category(
  p_id_tipo integer,
  p_nombre character varying DEFAULT NULL,
  p_codigo character varying DEFAULT NULL
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying,
  product_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.tipoproducto c
    SET
      nombre = COALESCE(p_nombre, c.nombre),
      codigo = COALESCE(p_codigo, c.codigo)
    WHERE c.id_tipo = p_id_tipo
    RETURNING c.*
  )
  SELECT
    u.id_tipo,
    u.nombre,
    u.codigo,
    COALESCE(pc.product_count, 0)::bigint AS product_count
  FROM updated u
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS product_count
    FROM public.producto p
    WHERE p.id_categoria = u.id_tipo
  ) pc ON TRUE;
$$;

-- ================================================
-- STORED PROCEDURE: update_customer
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.update_customer(
  p_id_cliente integer,
  p_nombre character varying DEFAULT NULL,
  p_apellido character varying DEFAULT NULL,
  p_email character varying DEFAULT NULL,
  p_telefono character varying DEFAULT NULL,
  p_direccion text DEFAULT NULL,
  p_ciudad character varying DEFAULT NULL,
  p_activo boolean DEFAULT NULL
)
RETURNS TABLE (
  id_cliente integer,
  nombre character varying,
  apellido character varying,
  email character varying,
  telefono character varying,
  direccion text,
  ciudad character varying,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.cliente c
    SET
      nombre = COALESCE(p_nombre, c.nombre),
      apellido = COALESCE(p_apellido, c.apellido),
      email = COALESCE(p_email, c.email),
      telefono = COALESCE(p_telefono, c.telefono),
      direccion = COALESCE(p_direccion, c.direccion),
      ciudad = COALESCE(p_ciudad, c.ciudad),
      activo = COALESCE(p_activo, c.activo)
    WHERE c.id_cliente = p_id_cliente
    RETURNING c.*
  )
  SELECT
    u.id_cliente,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    u.direccion,
    u.ciudad,
    u.activo
  FROM updated u;
$$;

-- ================================================
-- STORED PROCEDURE: update_order_status
-- Schema: public
-- ================================================

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
      id_estado = COALESCE(p_id_estado, id_estado)
    WHERE id_pedido = p_id_pedido
    RETURNING id_pedido, id_estado
  )
  SELECT jsonb_build_object(
    'success', EXISTS (SELECT 1 FROM updated),
    'id_pedido', (SELECT id_pedido FROM updated),
    'id_estado', (SELECT id_estado FROM updated)
  );
$$;

-- ================================================
-- STORED PROCEDURE: update_product
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.update_product(
  p_id_producto integer,
  p_nombre character varying DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_descripcion text DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_activo boolean DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  codigo character varying,
  descripcion text,
  id_categoria integer,
  categoria_nombre character varying,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.producto p
    SET
      nombre = COALESCE(p_nombre, p.nombre),
      codigo = COALESCE(p_codigo, p.codigo),
      descripcion = COALESCE(p_descripcion, p.descripcion),
      id_categoria = COALESCE(p_id_categoria, p.id_categoria),
      activo = COALESCE(p_activo, p.activo)
    WHERE p.id_producto = p_id_producto
    RETURNING p.*
  )
  SELECT
    u.id_producto,
    u.nombre,
    u.codigo,
    u.descripcion,
    u.id_categoria,
    c.nombre AS categoria_nombre,
    u.activo
  FROM updated u
  LEFT JOIN public.tipoproducto c ON c.id_tipo = u.id_categoria;
$$;

-- ================================================
-- STORED PROCEDURE: update_product_variant
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.update_product_variant(
  p_id_variante integer,
  p_id_color integer DEFAULT NULL,
  p_codigo_variante character varying DEFAULT NULL,
  p_nombre_variante character varying DEFAULT NULL,
  p_precio_variante numeric DEFAULT NULL,
  p_activo boolean DEFAULT NULL
)
RETURNS TABLE (
  id_variante integer,
  id_producto integer,
  id_color integer,
  codigo_variante character varying,
  nombre_variante character varying,
  precio_variante numeric,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.productovariante pv
    SET
      id_color = COALESCE(p_id_color, pv.id_color),
      codigo_variante = COALESCE(p_codigo_variante, pv.codigo_variante),
      nombre_variante = COALESCE(p_nombre_variante, pv.nombre_variante),
      precio_variante = COALESCE(p_precio_variante, pv.precio_variante),
      activo = COALESCE(p_activo, pv.activo)
    WHERE pv.id_variante = p_id_variante
    RETURNING pv.*
  )
  SELECT
    u.id_variante,
    u.id_producto,
    u.id_color,
    u.codigo_variante,
    u.nombre_variante,
    u.precio_variante,
    u.activo
  FROM updated u;
$$;

-- ================================================
-- STORED PROCEDURE: update_supplier
-- Schema: public
-- ================================================

CREATE OR REPLACE FUNCTION public.update_supplier(
  p_id_proveedor integer,
  p_nombre character varying DEFAULT NULL,
  p_contacto character varying DEFAULT NULL,
  p_telefono character varying DEFAULT NULL,
  p_email character varying DEFAULT NULL
)
RETURNS TABLE (
  id_proveedor integer,
  nombre character varying,
  contacto character varying,
  telefono character varying,
  email character varying
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.proveedor s
    SET
      nombre = COALESCE(p_nombre, s.nombre),
      contacto = COALESCE(p_contacto, s.contacto),
      telefono = COALESCE(p_telefono, s.telefono),
      email = COALESCE(p_email, s.email)
    WHERE s.id_proveedor = p_id_proveedor
    RETURNING s.*
  )
  SELECT * FROM updated;
$$;