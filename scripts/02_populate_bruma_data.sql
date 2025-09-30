-- ================================================
-- 🎯 DATOS INICIALES BRUMA FIGHTWEAR
-- Poblar base de datos con catálogo completo
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script asume que ya tienes los usuarios:
-- BrumaFightwear: e435d7eb-a033-4bb0-b34c-2a040c5d2f36
-- Sebastian: 969e5a99-0448-44a4-b0d2-135c6ed32ae4

BEGIN;

-- ================================================
-- 🏢 1. CREAR PROYECTO BRUMA
-- ================================================

INSERT INTO projects (
    name, 
    slug, 
    description, 
    project_type, 
    logo_url, 
    color_scheme, 
    config, 
    is_active
) VALUES (
    'BRUMA Fightwear',
    'bruma-fightwear',
    'Tienda especializada en ropa deportiva y equipamiento de combat sports',
    'ecommerce',
    '/images/bruma/logo-full.png',
    '{"primary": "#dc2626", "secondary": "#b91c1c", "accent": "#fbbf24"}',
    '{"features": ["inventory_management", "order_processing", "customer_management", "analytics", "supplier_management"], "specialized": true, "combat_sports": true, "version": "1.0"}',
    true
);

-- Obtener project_id (se usará en las siguientes inserciones)
DO $$
DECLARE
    bruma_project_id UUID;
    bruma_owner_id UUID := 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36';
    sebastian_admin_id UUID := '969e5a99-0448-44a4-b0d2-135c6ed32ae4';
    
    -- IDs de categorías
    cat_rashguard_id UUID;
    cat_pantaloneta_id UUID;
    cat_camiseta_id UUID;
    
    -- ID de línea de productos
    line_coleccion_bruma_id UUID;
    
    -- IDs de productos
    prod_rashguard_id UUID;
    prod_pantaloneta_id UUID;
    prod_camiseta_id UUID;
    
    -- IDs de proveedores
    supplier_textil_id UUID;
    supplier_estampado_id UUID;
    
BEGIN
    -- Obtener el ID del proyecto
    SELECT id INTO bruma_project_id FROM projects WHERE slug = 'bruma-fightwear';
    RAISE NOTICE 'Proyecto BRUMA creado con ID: %', bruma_project_id;

    -- ================================================
    -- 👥 2. ASIGNAR USUARIOS AL PROYECTO
    -- ================================================
    
    INSERT INTO user_projects (
        user_id, 
        project_id, 
        role, 
        permissions, 
        is_active
    ) VALUES 
    (
        bruma_owner_id,
        bruma_project_id,
        'owner',
        '{"can_manage_users": true, "can_manage_settings": true, "can_manage_inventory": true, "can_manage_orders": true, "can_manage_suppliers": true, "can_view_analytics": true, "can_manage_products": true}',
        true
    ),
    (
        sebastian_admin_id,
        bruma_project_id,
        'admin',
        '{"can_manage_users": false, "can_manage_settings": true, "can_manage_inventory": true, "can_manage_orders": true, "can_manage_suppliers": true, "can_view_analytics": true, "can_manage_products": true}',
        true
    );
    
    RAISE NOTICE 'Usuarios asignados al proyecto';

    -- ================================================
    -- ⚙️ 3. CONFIGURAR ECOMMERCE
    -- ================================================
    
    INSERT INTO ecommerce_config (
        project_id,
        store_name,
        store_description,
        currency,
        tax_rate,
        manage_inventory,
        allow_backorders,
        track_quantity,
        shipping_enabled,
        shipping_config,
        payment_config,
        additional_config
    ) VALUES (
        bruma_project_id,
        'BRUMA Fightwear',
        'Ropa deportiva y equipamiento profesional de combat sports. Especialistas en Rashguards, Pantalonetas y Camisetas de alta calidad.',
        'USD',
        0.08, -- 8% tax
        true,
        false,
        true,
        true,
        '{"free_shipping_threshold": 100, "default_shipping_rate": 15, "express_shipping_rate": 25, "carriers": ["DHL", "FedEx", "Correos"]}',
        '{"payment_methods": ["transferencia", "paypal", "sinpemovil", "cortesia"], "default_currency": "USD", "accept_crypto": false}',
        '{"business_hours": "9:00-18:00", "timezone": "America/Caracas", "language": "es", "country": "VE"}'
    );
    
    RAISE NOTICE 'Configuración ecommerce establecida';

    -- ================================================
    -- 🏷️ 4. CREAR CATEGORÍAS
    -- ================================================
    
    INSERT INTO categories (
        project_id, name, slug, description, sort_order, is_active
    ) VALUES 
    (
        bruma_project_id, 'Rashguard', 'rashguard', 
        'Camisetas de lycra para combat sports, ideales para grappling, BJJ y MMA', 
        1, true
    ),
    (
        bruma_project_id, 'Pantaloneta', 'pantaloneta', 
        'Shorts deportivos para combat sports, cómodos y resistentes', 
        2, true
    ),
    (
        bruma_project_id, 'Camiseta', 'camiseta', 
        'Camisetas casuales y deportivas de alta calidad', 
        3, true
    );
    
    -- Obtener IDs de categorías
    SELECT id INTO cat_rashguard_id FROM categories WHERE project_id = bruma_project_id AND slug = 'rashguard';
    SELECT id INTO cat_pantaloneta_id FROM categories WHERE project_id = bruma_project_id AND slug = 'pantaloneta';
    SELECT id INTO cat_camiseta_id FROM categories WHERE project_id = bruma_project_id AND slug = 'camiseta';
    
    RAISE NOTICE 'Categorías creadas: Rashguard (%), Pantaloneta (%), Camiseta (%)', cat_rashguard_id, cat_pantaloneta_id, cat_camiseta_id;

    -- ================================================
    -- 📋 5. CREAR LÍNEAS DE PRODUCTOS
    -- ================================================
    
    INSERT INTO product_lines (
        project_id, name, slug, description, sort_order, is_active
    ) VALUES (
        bruma_project_id, 
        'Colección Bruma', 
        'coleccion-bruma', 
        'Línea principal de productos BRUMA Fightwear con diseños exclusivos y materiales de primera calidad', 
        1, true
    );
    
    SELECT id INTO line_coleccion_bruma_id FROM product_lines WHERE project_id = bruma_project_id AND slug = 'coleccion-bruma';
    RAISE NOTICE 'Línea de productos creada: Colección Bruma (%)', line_coleccion_bruma_id;

    -- ================================================
    -- 🥊 6. CREAR ATRIBUTOS DE PRODUCTOS
    -- ================================================
    
    INSERT INTO product_attributes (
        project_id, name, slug, attribute_type, options, unit, is_required, is_variant, sort_order
    ) VALUES 
    (
        bruma_project_id, 'Material', 'material', 'select', 
        '["Lycra", "Polyester", "Algodón", "Lycra/Polyester Mix"]', 
        null, true, false, 1
    ),
    (
        bruma_project_id, 'Gramaje', 'gramaje', 'number', 
        '[]', 'gr/m²', false, false, 2
    ),
    (
        bruma_project_id, 'Elasticidad', 'elasticidad', 'number', 
        '[]', '%', false, false, 3
    ),
    (
        bruma_project_id, 'Tipo de Costura', 'tipo-costura', 'select', 
        '["Flatlock", "Overlock", "Coverstitch"]', 
        null, false, false, 4
    );

    -- ================================================
    -- 🎽 7. CREAR PRODUCTOS BASE
    -- ================================================
    
    -- RASHGUARD BRUMA
    INSERT INTO products (
        project_id, category_id, product_line_id, name, slug, description, short_description,
        sku, base_price, base_cost, weight, materials, care_instructions, tags,
        track_inventory, continue_selling_when_out_of_stock, is_active, sort_order
    ) VALUES (
        bruma_project_id, cat_rashguard_id, line_coleccion_bruma_id,
        'Rashguard Bruma', 'rashguard-bruma',
        'Rashguard de alta calidad de la Colección Bruma. Fabricado en lycra premium con costuras flatlock para máxima comodidad y durabilidad. Ideal para BJJ, Grappling, MMA y actividades acuáticas.',
        'Rashguard profesional BRUMA - Lycra premium',
        'RAS-BRU', 50.00, 30.00, 180, -- 180 gramos
        '["Lycra"]',
        'Lavar en agua fría, no usar blanqueador, secar al aire',
        '{rashguard, bjj, grappling, mma, lycra, combat, sports, bruma}',
        true, false, true, 1
    );
    
    -- PANTALONETA BRUMA
    INSERT INTO products (
        project_id, category_id, product_line_id, name, slug, description, short_description,
        sku, base_price, base_cost, weight, materials, care_instructions, tags,
        track_inventory, continue_selling_when_out_of_stock, is_active, sort_order
    ) VALUES (
        bruma_project_id, cat_pantaloneta_id, line_coleccion_bruma_id,
        'Pantaloneta Bruma', 'pantaloneta-bruma',
        'Pantaloneta deportiva de la Colección Bruma. Confeccionada en polyester de alta resistencia con corte ergonómico. Perfecta para entrenamientos intensos y competencias.',
        'Pantaloneta deportiva BRUMA - Polyester resistente',
        'PAN-BRU', 50.00, 30.00, 220, -- 220 gramos
        '["Polyester"]',
        'Lavar en agua fría, no usar blanqueador, secar al aire',
        '{pantaloneta, shorts, polyester, combat, sports, training, bruma}',
        true, false, true, 2
    );
    
    -- CAMISETA BRUMA
    INSERT INTO products (
        project_id, category_id, product_line_id, name, slug, description, short_description,
        sku, base_price, base_cost, weight, materials, care_instructions, tags,
        track_inventory, continue_selling_when_out_of_stock, is_active, sort_order
    ) VALUES (
        bruma_project_id, cat_camiseta_id, line_coleccion_bruma_id,
        'Camiseta Bruma', 'camiseta-bruma',
        'Camiseta casual de la Colección Bruma. Fabricada en algodón suave y cómodo con el icónico logo BRUMA. Ideal para uso diario y representar la marca.',
        'Camiseta casual BRUMA - Algodón suave',
        'CAM-BRU', 22.00, 10.00, 150, -- 150 gramos
        '["Algodón"]',
        'Lavar en agua fría, planchar a temperatura media',
        '{camiseta, casual, algodon, logo, bruma, lifestyle}',
        true, false, true, 3
    );
    
    -- Obtener IDs de productos
    SELECT id INTO prod_rashguard_id FROM products WHERE project_id = bruma_project_id AND sku = 'RAS-BRU';
    SELECT id INTO prod_pantaloneta_id FROM products WHERE project_id = bruma_project_id AND sku = 'PAN-BRU';
    SELECT id INTO prod_camiseta_id FROM products WHERE project_id = bruma_project_id AND sku = 'CAM-BRU';
    
    RAISE NOTICE 'Productos creados: Rashguard (%), Pantaloneta (%), Camiseta (%)', prod_rashguard_id, prod_pantaloneta_id, prod_camiseta_id;

    -- ================================================
    -- 🎨 8. CREAR VARIANTES (TALLAS Y COLORES)
    -- ================================================
    
    -- VARIANTES RASHGUARD (Negro y Blanco, XS-XL)
    INSERT INTO product_variants (
        product_id, name, sku, size, color, price_adjustment, cost_adjustment, is_active, sort_order
    ) VALUES 
    -- Negro
    (prod_rashguard_id, 'Rashguard Bruma - Negro - XS', 'RAS-BRU-N-XS', 'XS', 'Negro', 0, 0, true, 1),
    (prod_rashguard_id, 'Rashguard Bruma - Negro - S', 'RAS-BRU-N-S', 'S', 'Negro', 0, 0, true, 2),
    (prod_rashguard_id, 'Rashguard Bruma - Negro - M', 'RAS-BRU-N-M', 'M', 'Negro', 0, 0, true, 3),
    (prod_rashguard_id, 'Rashguard Bruma - Negro - L', 'RAS-BRU-N-L', 'L', 'Negro', 0, 0, true, 4),
    (prod_rashguard_id, 'Rashguard Bruma - Negro - XL', 'RAS-BRU-N-XL', 'XL', 'Negro', 0, 0, true, 5),
    -- Blanco
    (prod_rashguard_id, 'Rashguard Bruma - Blanco - XS', 'RAS-BRU-B-XS', 'XS', 'Blanco', 0, 0, true, 6),
    (prod_rashguard_id, 'Rashguard Bruma - Blanco - S', 'RAS-BRU-B-S', 'S', 'Blanco', 0, 0, true, 7),
    (prod_rashguard_id, 'Rashguard Bruma - Blanco - M', 'RAS-BRU-B-M', 'M', 'Blanco', 0, 0, true, 8),
    (prod_rashguard_id, 'Rashguard Bruma - Blanco - L', 'RAS-BRU-B-L', 'L', 'Blanco', 0, 0, true, 9),
    (prod_rashguard_id, 'Rashguard Bruma - Blanco - XL', 'RAS-BRU-B-XL', 'XL', 'Blanco', 0, 0, true, 10);
    
    -- VARIANTES PANTALONETA (Negro y Blanco, XS-XL)
    INSERT INTO product_variants (
        product_id, name, sku, size, color, price_adjustment, cost_adjustment, is_active, sort_order
    ) VALUES 
    -- Negro
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Negro - XS', 'PAN-BRU-N-XS', 'XS', 'Negro', 0, 0, true, 11),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Negro - S', 'PAN-BRU-N-S', 'S', 'Negro', 0, 0, true, 12),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Negro - M', 'PAN-BRU-N-M', 'M', 'Negro', 0, 0, true, 13),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Negro - L', 'PAN-BRU-N-L', 'L', 'Negro', 0, 0, true, 14),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Negro - XL', 'PAN-BRU-N-XL', 'XL', 'Negro', 0, 0, true, 15),
    -- Blanco
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Blanco - XS', 'PAN-BRU-B-XS', 'XS', 'Blanco', 0, 0, true, 16),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Blanco - S', 'PAN-BRU-B-S', 'S', 'Blanco', 0, 0, true, 17),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Blanco - M', 'PAN-BRU-B-M', 'M', 'Blanco', 0, 0, true, 18),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Blanco - L', 'PAN-BRU-B-L', 'L', 'Blanco', 0, 0, true, 19),
    (prod_pantaloneta_id, 'Pantaloneta Bruma - Blanco - XL', 'PAN-BRU-B-XL', 'XL', 'Blanco', 0, 0, true, 20);
    
    -- VARIANTES CAMISETA (Negro y Blanco, XS-XL)
    INSERT INTO product_variants (
        product_id, name, sku, size, color, price_adjustment, cost_adjustment, is_active, sort_order
    ) VALUES 
    -- Negro
    (prod_camiseta_id, 'Camiseta Bruma - Negro - XS', 'CAM-BRU-N-XS', 'XS', 'Negro', 0, 0, true, 21),
    (prod_camiseta_id, 'Camiseta Bruma - Negro - S', 'CAM-BRU-N-S', 'S', 'Negro', 0, 0, true, 22),
    (prod_camiseta_id, 'Camiseta Bruma - Negro - M', 'CAM-BRU-N-M', 'M', 'Negro', 0, 0, true, 23),
    (prod_camiseta_id, 'Camiseta Bruma - Negro - L', 'CAM-BRU-N-L', 'L', 'Negro', 0, 0, true, 24),
    (prod_camiseta_id, 'Camiseta Bruma - Negro - XL', 'CAM-BRU-N-XL', 'XL', 'Negro', 0, 0, true, 25),
    -- Blanco
    (prod_camiseta_id, 'Camiseta Bruma - Blanco - XS', 'CAM-BRU-B-XS', 'XS', 'Blanco', 0, 0, true, 26),
    (prod_camiseta_id, 'Camiseta Bruma - Blanco - S', 'CAM-BRU-B-S', 'S', 'Blanco', 0, 0, true, 27),
    (prod_camiseta_id, 'Camiseta Bruma - Blanco - M', 'CAM-BRU-B-M', 'M', 'Blanco', 0, 0, true, 28),
    (prod_camiseta_id, 'Camiseta Bruma - Blanco - L', 'CAM-BRU-B-L', 'L', 'Blanco', 0, 0, true, 29),
    (prod_camiseta_id, 'Camiseta Bruma - Blanco - XL', 'CAM-BRU-B-XL', 'XL', 'Blanco', 0, 0, true, 30);
    
    RAISE NOTICE 'Variantes creadas: 30 total (3 productos × 2 colores × 5 tallas)';

    -- ================================================
    -- 🏭 9. CREAR PROVEEDORES
    -- ================================================
    
    -- Proveedor de textiles
    INSERT INTO suppliers (
        project_id, name, legal_name, tax_id, supplier_type, website, notes, is_active
    ) VALUES (
        bruma_project_id,
        'Textiles Deportivos CA',
        'Textiles Deportivos Caracas C.A.',
        'J-12345678-9',
        'textile',
        'https://textilesdepca.com',
        'Proveedor principal de lycra y polyester. Excelente calidad y tiempos de entrega.',
        true
    );
    
    -- Proveedor de estampado
    INSERT INTO suppliers (
        project_id, name, legal_name, tax_id, supplier_type, website, notes, is_active
    ) VALUES (
        bruma_project_id,
        'Estampados BRUMA',
        'Estampados y Bordados BRUMA SRLMR',
        'J-98765432-1',
        'printing',
        null,
        'Especialistas en estampado y bordado para ropa deportiva. Trabajo exclusivo para BRUMA.',
        true
    );
    
    -- Obtener IDs de proveedores
    SELECT id INTO supplier_textil_id FROM suppliers WHERE project_id = bruma_project_id AND name = 'Textiles Deportivos CA';
    SELECT id INTO supplier_estampado_id FROM suppliers WHERE project_id = bruma_project_id AND name = 'Estampados BRUMA';
    
    RAISE NOTICE 'Proveedores creados: Textiles (%), Estampados (%)', supplier_textil_id, supplier_estampado_id;
    
    -- Contactos de proveedores
    INSERT INTO supplier_contacts (
        supplier_id, name, position, email, phone, is_primary
    ) VALUES 
    (supplier_textil_id, 'María González', 'Gerente de Ventas', 'ventas@textilesdepca.com', '+58-212-555-0101', true),
    (supplier_textil_id, 'Carlos Rodríguez', 'Representante Técnico', 'tecnico@textilesdepca.com', '+58-212-555-0102', false),
    (supplier_estampado_id, 'Ana Martínez', 'Directora Creativa', 'ana@estampadosbruma.com', '+58-414-555-0201', true);
    
    -- Direcciones de proveedores
    INSERT INTO supplier_addresses (
        supplier_id, address_type, address_line_1, city, state, country, postal_code, is_primary
    ) VALUES 
    (supplier_textil_id, 'main', 'Av. Principal Los Ruices, Edificio Textil, Piso 3', 'Caracas', 'Miranda', 'Venezuela', '1071', true),
    (supplier_estampado_id, 'main', 'Calle Los Creativos #45, Zona Industrial', 'Caracas', 'Distrito Capital', 'Venezuela', '1050', true);

    -- ================================================
    -- 📦 10. CONFIGURAR INVENTARIO INICIAL
    -- ================================================
    
    -- Insertar inventario para todas las variantes (5 unidades cada una)
    INSERT INTO inventory (
        project_id, product_id, variant_id, sku, quantity_available, 
        reorder_level, reorder_quantity, last_cost, average_cost, location
    )
    SELECT 
        bruma_project_id,
        pv.product_id,
        pv.id,
        pv.sku,
        5, -- 5 unidades por variante
        3, -- Reorden cuando queden 3
        10, -- Reordenar 10 unidades
        CASE 
            WHEN p.sku LIKE 'RAS-%' THEN 30.00
            WHEN p.sku LIKE 'PAN-%' THEN 30.00
            WHEN p.sku LIKE 'CAM-%' THEN 10.00
        END as last_cost,
        CASE 
            WHEN p.sku LIKE 'RAS-%' THEN 30.00
            WHEN p.sku LIKE 'PAN-%' THEN 30.00
            WHEN p.sku LIKE 'CAM-%' THEN 10.00
        END as average_cost,
        'Almacén Principal'
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE p.project_id = bruma_project_id;
    
    -- Registrar movimiento inicial de inventario
    INSERT INTO inventory_movements (
        project_id, inventory_id, movement_type, quantity, unit_cost, total_cost,
        reference_type, notes, created_by
    )
    SELECT 
        bruma_project_id,
        i.id,
        'in',
        5,
        i.last_cost,
        (5 * i.last_cost),
        'initial_stock',
        'Stock inicial del catálogo BRUMA Fightwear',
        bruma_owner_id
    FROM inventory i
    WHERE i.project_id = bruma_project_id;
    
    RAISE NOTICE 'Inventario inicial configurado: 150 unidades total (30 variantes × 5 c/u)';

    -- ================================================
    -- 👥 11. CREAR CLIENTES DE EJEMPLO
    -- ================================================
    
    INSERT INTO customers (
        project_id, email, first_name, last_name, phone, customer_group, is_active
    ) VALUES 
    (bruma_project_id, 'juan.fighter@email.com', 'Juan', 'Pérez', '+58-414-555-1001', 'regular', true),
    (bruma_project_id, 'maria.bjj@email.com', 'María', 'González', '+58-424-555-1002', 'vip', true),
    (bruma_project_id, 'carlos.mma@email.com', 'Carlos', 'Rodríguez', '+58-412-555-1003', 'wholesale', true);
    
    RAISE NOTICE 'Clientes de ejemplo creados';

    -- ================================================
    -- ✅ RESUMEN FINAL
    -- ================================================
    
    RAISE NOTICE '🎉 ¡CATÁLOGO BRUMA FIGHTWEAR CREADO EXITOSAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN COMPLETO:';
    RAISE NOTICE '   🏢 Proyecto: BRUMA Fightwear';
    RAISE NOTICE '   👥 Usuarios: 2 (Owner + Admin)';
    RAISE NOTICE '   ⚙️  Configuración: Ecommerce completa';
    RAISE NOTICE '   🏷️  Categorías: 3 (Rashguard, Pantaloneta, Camiseta)';
    RAISE NOTICE '   📋 Líneas: 1 (Colección Bruma)';
    RAISE NOTICE '   🎽 Productos: 3 productos base';
    RAISE NOTICE '   🎨 Variantes: 30 (3×2 colores×5 tallas)';
    RAISE NOTICE '   📦 Stock: 150 unidades (5 por variante)';
    RAISE NOTICE '   🏭 Proveedores: 2 (Textiles + Estampados)';
    RAISE NOTICE '   👥 Clientes: 3 ejemplos';
    RAISE NOTICE '';
    RAISE NOTICE '💰 VALOR TOTAL INVENTARIO:';
    RAISE NOTICE '   - Rashguards: 10 variantes × 5 unidades × $30 = $1,500';
    RAISE NOTICE '   - Pantalonetas: 10 variantes × 5 unidades × $30 = $1,500';  
    RAISE NOTICE '   - Camisetas: 10 variantes × 5 unidades × $10 = $500';
    RAISE NOTICE '   💼 TOTAL COSTO: $3,500';
    RAISE NOTICE '   💸 TOTAL VENTA: $6,100 (Rashguards: $2,500 + Pantalonetas: $2,500 + Camisetas: $1,100)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡Lista para dominar el mercado de combat sports!';

END $$;

COMMIT;

-- ================================================
-- 🔍 QUERIES DE VERIFICACIÓN
-- ================================================

-- Verificar estructura completa
/*
-- Contar registros por tabla
SELECT 'projects' as tabla, COUNT(*) as registros FROM projects WHERE slug = 'bruma-fightwear'
UNION ALL
SELECT 'user_projects', COUNT(*) FROM user_projects up JOIN projects p ON up.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL  
SELECT 'categories', COUNT(*) FROM categories c JOIN projects p ON c.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'products', COUNT(*) FROM products pr JOIN projects p ON pr.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants pv JOIN products pr ON pv.product_id = pr.id JOIN projects p ON pr.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory i JOIN projects p ON i.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers s JOIN projects p ON s.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'customers', COUNT(*) FROM customers c JOIN projects p ON c.project_id = p.id WHERE p.slug = 'bruma-fightwear';

-- Ver productos con variantes
SELECT 
    p.name as producto,
    p.base_price as precio_base,
    COUNT(pv.id) as variantes,
    SUM(i.quantity_available) as stock_total,
    SUM(i.quantity_available * (p.base_price + pv.price_adjustment)) as valor_inventario
FROM products p
JOIN projects pr ON p.project_id = pr.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN inventory i ON pv.id = i.variant_id
WHERE pr.slug = 'bruma-fightwear'
GROUP BY p.id, p.name, p.base_price
ORDER BY p.sort_order;
*/