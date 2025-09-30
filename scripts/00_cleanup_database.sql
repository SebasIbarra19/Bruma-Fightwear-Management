-- ================================================
-- 🧹 LIMPIEZA DE TABLAS EXISTENTES
-- Ejecutar ANTES del schema completo
-- ================================================

-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos existentes ⚠️
-- Solo ejecutar si estás seguro de empezar desde cero

BEGIN;

-- Deshabilitar checks de foreign keys temporalmente
SET session_replication_role = replica;

-- ================================================
-- 🗑️ ELIMINAR TABLAS EN ORDEN CORRECTO
-- ================================================

-- Eliminar tablas de datos/transacciones primero
DROP TABLE IF EXISTS purchase_receipt_items CASCADE;
DROP TABLE IF EXISTS purchase_receipts CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS order_shipments CASCADE;
DROP TABLE IF EXISTS order_payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Eliminar tablas de catálogo
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_attribute_values CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_lines CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Eliminar tablas de proveedores
DROP TABLE IF EXISTS supplier_prices CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS supplier_addresses CASCADE;
DROP TABLE IF EXISTS supplier_contacts CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Eliminar configuración y core
DROP TABLE IF EXISTS ecommerce_config CASCADE;
DROP TABLE IF EXISTS user_projects CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Eliminar tablas viejas si existen
DROP TABLE IF EXISTS pedidodetalle CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS productotallastock CASCADE;
DROP TABLE IF EXISTS productovariante CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS codigoenvio CASCADE;
DROP TABLE IF EXISTS metodopago CASCADE;
DROP TABLE IF EXISTS estado CASCADE;
DROP TABLE IF EXISTS coleccion CASCADE;
DROP TABLE IF EXISTS color CASCADE;
DROP TABLE IF EXISTS tallaproveedor_medida CASCADE;
DROP TABLE IF EXISTS tallaproveedor CASCADE;
DROP TABLE IF EXISTS tallabase CASCADE;
DROP TABLE IF EXISTS tipoproducto_medida CASCADE;
DROP TABLE IF EXISTS tipoproducto CASCADE;
DROP TABLE IF EXISTS tipomedida CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;

-- Restaurar checks de foreign keys
SET session_replication_role = DEFAULT;

COMMIT;

-- ================================================
-- ✅ LIMPIEZA COMPLETADA
-- ================================================

-- Verificar que no quedan tablas relacionadas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT IN ('users') -- Mantener tabla de usuarios de Supabase
ORDER BY tablename;

-- ¡Ahora puedes ejecutar 01_create_schema_complete.sql! 🚀