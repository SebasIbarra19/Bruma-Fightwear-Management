-- ================================================
-- 📦 QUERIES DIRECTOS PARA SUPABASE
-- Ejecutar directamente en el SQL Editor de Supabase
-- ================================================

-- Project ID de BRUMA Fightwear
-- '4cffbb29-0a5b-414c-86c0-9509a19485d3'

-- ================================================
-- 1. 📊 ESTADÍSTICAS GENERALES DE INVENTARIO
-- ================================================

SELECT 
    'ESTADÍSTICAS GENERALES' as tipo,
    COUNT(DISTINCT p.id) as total_productos,
    COALESCE(SUM(i.quantity_available), 0) as total_items_stock,
    COALESCE(SUM(i.quantity_available * i.average_cost), 0)::decimal(10,2) as valor_total_inventario,
    COUNT(CASE WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 1 END) as items_stock_bajo
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE i.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true;

-- ================================================
-- 2. 📋 LISTADO COMPLETO DE INVENTARIO
-- ================================================

SELECT 
    p.name as producto,
    pv.name as variante,
    pv.sku as codigo_sku,
    pv.size as talla,
    pv.color as color,
    i.quantity_available as stock_actual,
    i.reorder_level as nivel_reorden,
    i.average_cost as costo_promedio,
    (i.quantity_available * i.average_cost)::decimal(10,2) as valor_total,
    i.location as ubicacion,
    CASE 
        WHEN i.quantity_available = 0 THEN '🔴 Sin Stock'
        WHEN i.quantity_available <= i.reorder_level THEN '🟡 Stock Bajo'
        WHEN i.quantity_available <= (i.reorder_level * 2) THEN '🟢 Normal'
        ELSE '🔵 Alto Stock'
    END as estado_stock,
    c.name as categoria,
    i.updated_at as ultima_actualizacion
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
    AND p.is_active = true
    AND pv.is_active = true
ORDER BY p.name, pv.name;

-- ================================================
-- 3. ⚠️ ALERTAS DE STOCK BAJO
-- ================================================

SELECT 
    '🚨 ALERTAS DE STOCK' as tipo,
    p.name as producto,
    pv.name as variante,
    pv.sku as codigo_sku,
    i.quantity_available as stock_actual,
    i.reorder_level as nivel_reorden,
    i.reorder_quantity as cantidad_reorden,
    GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) as cantidad_sugerida,
    (GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) * i.average_cost)::decimal(10,2) as costo_estimado,
    CASE 
        WHEN i.quantity_available = 0 THEN '🔴 CRÍTICO - Sin Stock'
        WHEN i.quantity_available <= (i.reorder_level * 0.5) THEN '🟠 ALTO - Muy Bajo'
        WHEN i.quantity_available <= i.reorder_level THEN '🟡 MEDIO - Necesita Reorden'
        ELSE '🟢 BAJO - Monitorear'
    END as nivel_alerta,
    i.location as ubicacion,
    c.name as categoria
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (
        i.quantity_available = 0 OR 
        i.quantity_available <= i.reorder_level
    )
ORDER BY 
    CASE 
        WHEN i.quantity_available = 0 THEN 1
        WHEN i.quantity_available <= (i.reorder_level * 0.5) THEN 2
        WHEN i.quantity_available <= i.reorder_level THEN 3
        ELSE 4
    END,
    p.name;

-- ================================================
-- 4. 💰 VALORACIÓN POR CATEGORÍAS
-- ================================================

SELECT 
    COALESCE(c.name, 'Sin Categoría') as categoria,
    COUNT(i.id) as total_items,
    SUM(i.quantity_available) as cantidad_total,
    SUM(i.quantity_available * i.average_cost)::decimal(12,2) as valor_costo,
    SUM(i.quantity_available * (p.base_price + COALESCE(pv.price_adjustment, 0)))::decimal(12,2) as valor_venta,
    SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - i.average_cost))::decimal(12,2) as ganancia_potencial,
    CASE 
        WHEN SUM(i.quantity_available * i.average_cost) > 0 THEN
            ROUND(
                (SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - i.average_cost)) / 
                SUM(i.quantity_available * i.average_cost) * 100)::numeric, 2
            )
        ELSE 0
    END as margen_ganancia_pct
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND i.quantity_available > 0
GROUP BY c.id, c.name
ORDER BY valor_costo DESC;

-- ================================================
-- 5. 📈 RESUMEN PARA DASHBOARD (KPIs)
-- ================================================

WITH inventory_stats AS (
    SELECT 
        COUNT(DISTINCT p.id) as productos_unicos,
        COUNT(i.id) as variantes_total,
        SUM(i.quantity_available) as items_total,
        SUM(i.quantity_available * i.average_cost) as valor_inventario,
        COUNT(CASE WHEN i.quantity_available = 0 THEN 1 END) as sin_stock,
        COUNT(CASE WHEN i.quantity_available > 0 AND i.quantity_available <= i.reorder_level THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN i.quantity_available > i.reorder_level THEN 1 END) as stock_normal
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE i.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'
        AND p.track_inventory = true
        AND p.is_active = true
        AND pv.is_active = true
)
SELECT 
    '📊 KPIs PARA DASHBOARD' as seccion,
    productos_unicos as "Total Productos",
    items_total as "Total Items en Stock", 
    valor_inventario::decimal(10,2) as "Valor Total Inventario ($)",
    (sin_stock + stock_bajo) as "Items Necesitan Atención",
    ROUND(((sin_stock + stock_bajo)::decimal / variantes_total * 100), 1) as "% Items con Problemas",
    sin_stock as "Sin Stock",
    stock_bajo as "Stock Bajo", 
    stock_normal as "Stock Normal"
FROM inventory_stats;

-- ================================================
-- 6. 🔍 VERIFICAR DATOS DISPONIBLES
-- ================================================

-- Verificar si existen datos en las tablas principales
SELECT 'inventory' as tabla, COUNT(*) as registros 
FROM inventory 
WHERE project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

UNION ALL

SELECT 'product_variants', COUNT(*) 
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

UNION ALL

SELECT 'products', COUNT(*) 
FROM products
WHERE project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

UNION ALL

SELECT 'categories', COUNT(*) 
FROM categories
WHERE project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'

ORDER BY tabla;