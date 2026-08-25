-- Alinear las migraciones con el esquema REAL de la base.
--
-- Hallazgo: `initial_schema.sql` declara TODAS las columnas de texto como
-- `character varying` sin límite, pero la base remota tiene límites concretos en
-- 29 columnas. Las migraciones nunca reflejaron eso — se descubrió al fallar
-- `create_category` con "value too long for type character varying(10)" sobre
-- `tipoproducto.codigo`, una columna que el repo declara sin límite.
--
-- Por qué importa: un despliegue desde cero (staging, entorno nuevo, restauración
-- de un desastre) produciría un esquema distinto al de producción en 29 puntos.
-- Los `varchar` sin límite aceptarían datos que la base real rechaza, y el bug
-- solo aparecería al promover a producción.
--
-- Esta migración es un NO-OP contra la base actual: solo declara los tipos que ya
-- tiene. Su valor es que a partir de ahora las migraciones sí describen la
-- realidad, y un entorno nuevo nace idéntico a producción.
--
-- Generada comparando el spec OpenAPI que expone PostgREST contra los CREATE
-- TABLE del repo. No se pudo usar `supabase db pull` porque requiere Docker para
-- la base sombra y no está disponible en esta máquina.

-- cliente
ALTER TABLE public.cliente ALTER COLUMN apellido TYPE character varying(100);
ALTER TABLE public.cliente ALTER COLUMN ciudad TYPE character varying(50);
ALTER TABLE public.cliente ALTER COLUMN email TYPE character varying(100);
ALTER TABLE public.cliente ALTER COLUMN nombre TYPE character varying(100);
ALTER TABLE public.cliente ALTER COLUMN telefono TYPE character varying(20);

-- codigoenvio
ALTER TABLE public.codigoenvio ALTER COLUMN codigo TYPE character varying(20);
ALTER TABLE public.codigoenvio ALTER COLUMN descripcion TYPE character varying(100);

-- coleccion
ALTER TABLE public.coleccion ALTER COLUMN nombre TYPE character varying(100);

-- color
ALTER TABLE public.color ALTER COLUMN codigo TYPE character varying(10);
ALTER TABLE public.color ALTER COLUMN hex_code TYPE character varying(7);
ALTER TABLE public.color ALTER COLUMN nombre TYPE character varying(50);

-- estado
ALTER TABLE public.estado ALTER COLUMN nombre TYPE character varying(50);

-- metodopago
ALTER TABLE public.metodopago ALTER COLUMN codigo TYPE character varying(50);
ALTER TABLE public.metodopago ALTER COLUMN nombre TYPE character varying(100);

-- pedido
ALTER TABLE public.pedido ALTER COLUMN cliente_email TYPE character varying(100);
ALTER TABLE public.pedido ALTER COLUMN cliente_nombre TYPE character varying(100);
ALTER TABLE public.pedido ALTER COLUMN referencia_pago TYPE character varying(100);

-- producto
ALTER TABLE public.producto ALTER COLUMN codigo TYPE character varying(20);
ALTER TABLE public.producto ALTER COLUMN nombre TYPE character varying(100);

-- productovariante
ALTER TABLE public.productovariante ALTER COLUMN codigo_variante TYPE character varying(30);
ALTER TABLE public.productovariante ALTER COLUMN nombre_variante TYPE character varying(150);

-- proveedor
ALTER TABLE public.proveedor ALTER COLUMN contacto TYPE character varying(100);
ALTER TABLE public.proveedor ALTER COLUMN email TYPE character varying(100);
ALTER TABLE public.proveedor ALTER COLUMN nombre TYPE character varying(100);
ALTER TABLE public.proveedor ALTER COLUMN telefono TYPE character varying(20);

-- tallabase
ALTER TABLE public.tallabase ALTER COLUMN codigo TYPE character varying(10);
ALTER TABLE public.tallabase ALTER COLUMN descripcion TYPE character varying(50);

-- tipoproducto
ALTER TABLE public.tipoproducto ALTER COLUMN codigo TYPE character varying(10);
ALTER TABLE public.tipoproducto ALTER COLUMN nombre TYPE character varying(50);

NOTIFY pgrst, 'reload schema';
