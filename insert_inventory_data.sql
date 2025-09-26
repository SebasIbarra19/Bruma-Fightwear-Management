-- Script para insertar datos de inventario de BRUMA Fightwear
-- Primero verificamos que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('suppliers', 'inventory');

-- Insertar proveedores de ejemplo para BRUMA
INSERT INTO suppliers (project_id, name, contact_name, contact_email, contact_phone, address, city, country, is_active)
VALUES 
  ('bruma-fightwear-id', 'Textiles Maya', 'Juan Carlos López', 'juan@textilesmaya.com', '+502 2345-6789', 'Zona 4, Ciudad de Guatemala', 'Guatemala', 'Guatemala', true),
  ('bruma-fightwear-id', 'Bordados Premium', 'María Rodríguez', 'maria@bordadospremium.com', '+502 3456-7890', 'Zona 10, Ciudad de Guatemala', 'Guatemala', 'Guatemala', true),
  ('bruma-fightwear-id', 'Equipos Deportivos SA', 'Carlos Mendoza', 'carlos@equiposdeportivos.com', '+502 4567-8901', 'Zona 12, Ciudad de Guatemala', 'Guatemala', 'Guatemala', true)
ON CONFLICT DO NOTHING;

-- Obtener los IDs de los proveedores insertados
-- Los usaremos para insertar el inventario
SELECT id, name FROM suppliers WHERE project_id = 'bruma-fightwear-id';

-- Insertar items de inventario para BRUMA
-- Ropa deportiva típica de MMA/Fighting
INSERT INTO inventory (project_id, supplier_id, name, sku, description, category, quantity, min_stock_level, max_stock_level, unit_cost, selling_price, location, is_active)
SELECT 
  'bruma-fightwear-id',
  s.id,
  inv.name,
  inv.sku,
  inv.description,
  inv.category,
  inv.quantity,
  inv.min_stock_level,
  inv.max_stock_level,
  inv.unit_cost,
  inv.selling_price,
  inv.location,
  inv.is_active
FROM suppliers s
CROSS JOIN (
  VALUES
    ('Rashguard Manga Larga Negra', 'BRU-RG-001', 'Rashguard de manga larga para entrenamiento MMA', 'Rashguards', 25, 5, 50, 35.00, 75.00, 'Almacén A-1', true),
    ('Shorts MMA BRUMA Classic', 'BRU-SH-001', 'Shorts de MMA con velcro lateral y bordado BRUMA', 'Shorts', 18, 3, 30, 28.00, 65.00, 'Almacén A-2', true),
    ('Guantes MMA 4oz Profesional', 'BRU-GL-001', 'Guantes de MMA 4oz con cierre de velcro', 'Guantes', 12, 2, 20, 45.00, 95.00, 'Almacén B-1', true),
    ('Espinilleras BRUMA Pro', 'BRU-SP-001', 'Espinilleras de alta calidad con amortiguación', 'Protecciones', 8, 2, 15, 52.00, 110.00, 'Almacén B-2', true),
    ('Camiseta BRUMA Logo', 'BRU-TS-001', 'Camiseta casual con logo BRUMA bordado', 'Camisetas', 35, 10, 60, 15.00, 35.00, 'Almacén A-3', true),
    ('Sudadera BRUMA Hoodie', 'BRU-HD-001', 'Sudadera con capucha y logo BRUMA', 'Sudaderas', 20, 5, 40, 32.00, 75.00, 'Almacén A-4', true),
    ('Vendas para Manos 4.5m', 'BRU-VD-001', 'Vendas de algodón para protección de manos', 'Accesorios', 45, 15, 80, 8.00, 18.00, 'Almacén C-1', true),
    ('Protector Bucal BRUMA', 'BRU-PB-001', 'Protector bucal moldeable con estuche', 'Protecciones', 22, 8, 40, 12.00, 28.00, 'Almacén C-2', true)
) AS inv(name, sku, description, category, quantity, min_stock_level, max_stock_level, unit_cost, selling_price, location, is_active)
WHERE s.project_id = 'bruma-fightwear-id' AND s.name = 'Textiles Maya'
ON CONFLICT DO NOTHING;

-- Verificar datos insertados
SELECT i.*, s.name as supplier_name 
FROM inventory i 
JOIN suppliers s ON i.supplier_id = s.id 
WHERE i.project_id = 'bruma-fightwear-id'
ORDER BY i.category, i.name;