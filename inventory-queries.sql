-- ================================================
-- 📦 INVENTORY QUERIES - SIN AUTENTICACIÓN
-- Queries SQL simples equivalentes a los stored procedures
-- ================================================

-- ================================================
-- 1. 📊 GET STOCK STATUS QUERY
-- Equivalente a get_stock_status() SP
-- ================================================

/*
Estructura de salida:
inventory_id, product_id, product_name, product_sku, variant_id, variant_name, 
variant_sku, size, color, quantity_available, reorder_level, reorder_quantity,
last_cost, average_cost, total_value, location, stock_status, needs_reorder, updated_at
*/

-- Query básica para obtener estado del stock
SELECT 
    i.id as inventory_id,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    pv.id as variant_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    pv.size,
    pv.color,
    i.quantity_available,
    i.reorder_level,
    i.reorder_quantity,
    i.last_cost,
    i.average_cost,
    (i.quantity_available * i.average_cost) as total_value,
    i.location,
    CASE 
        WHEN i.quantity_available = 0 THEN 'out_of_stock'
        WHEN i.quantity_available <= i.reorder_level THEN 'low_stock'
        WHEN i.quantity_available <= (i.reorder_level * 2) THEN 'normal'
        ELSE 'high_stock'
    END as stock_status,
    (i.quantity_available <= i.reorder_level) as needs_reorder,
    i.updated_at
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = $1 -- p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
ORDER BY 
    CASE 
        WHEN i.quantity_available = 0 THEN 1
        WHEN i.quantity_available <= i.reorder_level THEN 2
        ELSE 3
    END,
    p.name, pv.name;

-- ================================================
-- 2. ⚠️ GET LOW STOCK ALERTS QUERY  
-- Equivalente a get_low_stock_alerts() SP
-- ================================================

/*
Estructura de salida:
alert_id, product_id, product_name, variant_id, variant_name, variant_sku,
current_stock, reorder_level, reorder_quantity, suggested_order_quantity,
alert_level, estimated_cost, location, last_updated
*/

SELECT 
    i.id as alert_id,
    p.id as product_id,
    p.name as product_name,
    pv.id as variant_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    i.quantity_available as current_stock,
    i.reorder_level,
    i.reorder_quantity,
    GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) as suggested_order_quantity,
    CASE 
        WHEN i.quantity_available = 0 THEN 'critical'
        WHEN i.quantity_available <= (i.reorder_level * 0.5) THEN 'high'
        WHEN i.quantity_available <= i.reorder_level THEN 'medium'
        ELSE 'low'
    END as alert_level,
    (GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) * i.average_cost) as estimated_cost,
    i.location,
    i.updated_at as last_updated
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = $1 -- p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (
        i.quantity_available = 0 OR -- incluir sin stock
        i.quantity_available <= i.reorder_level -- stock bajo
    )
ORDER BY 
    CASE 
        WHEN i.quantity_available = 0 THEN 1
        WHEN i.quantity_available <= (i.reorder_level * 0.5) THEN 2
        WHEN i.quantity_available <= i.reorder_level THEN 3
        ELSE 4
    END,
    p.name, pv.name;

-- ================================================
-- 3. 💰 GET INVENTORY VALUATION QUERY
-- Equivalente a get_inventory_valuation() SP  
-- ================================================

/*
Estructura de salida:
total_items, total_quantity, total_value_at_cost, total_value_at_price,
potential_profit, profit_margin, category_breakdown
*/

SELECT 
    COUNT(i.id) as total_items,
    SUM(i.quantity_available) as total_quantity,
    SUM(i.quantity_available * i.average_cost) as total_value_at_cost,
    SUM(i.quantity_available * (p.base_price + COALESCE(pv.price_adjustment, 0))) as total_value_at_price,
    SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - i.average_cost)) as potential_profit,
    CASE 
        WHEN SUM(i.quantity_available * i.average_cost) > 0 THEN
            ROUND(
                (SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - i.average_cost)) / 
                SUM(i.quantity_available * i.average_cost) * 100)::numeric, 2
            )
        ELSE 0
    END as profit_margin,
    
    -- Category breakdown como JSON
    (
        SELECT json_agg(
            json_build_object(
                'category_id', COALESCE(c.id, '00000000-0000-0000-0000-000000000000'::UUID),
                'category_name', COALESCE(c.name, 'Sin Categoría'),
                'items', cat_stats.items,
                'quantity', cat_stats.quantity,
                'value_at_cost', cat_stats.value_at_cost,
                'value_at_price', cat_stats.value_at_price,
                'profit', cat_stats.profit
            )
        )
        FROM (
            SELECT 
                COALESCE(c.id, '00000000-0000-0000-0000-000000000000'::UUID) as category_id,
                COALESCE(c.name, 'Sin Categoría') as category_name,
                COUNT(i.id) as items,
                SUM(i.quantity_available) as quantity,
                SUM(i.quantity_available * i.average_cost) as value_at_cost,
                SUM(i.quantity_available * (p.base_price + COALESCE(pv.price_adjustment, 0))) as value_at_price,
                SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - i.average_cost)) as profit
            FROM inventory i
            JOIN product_variants pv ON i.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE i.project_id = $1
                AND p.track_inventory = true
                AND p.is_active = true
                AND pv.is_active = true
                AND i.quantity_available > 0
            GROUP BY c.id, c.name
        ) cat_stats
        LEFT JOIN categories c ON cat_stats.category_id = c.id
    ) as category_breakdown
    
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = $1 -- p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND i.quantity_available > 0;

-- ================================================
-- 4. 📋 LIST INVENTORY ITEMS QUERY
-- Equivalente a list_inventory_items() SP
-- ================================================

/*
Estructura de salida:
inventory_id, variant_id, product_id, product_name, product_sku, variant_sku,
variant_description, category_name, quantity_available, quantity_reserved,
quantity_on_order, reorder_level, reorder_quantity, unit_cost, total_value,
location, last_movement_date, stock_status, created_at, updated_at
*/

SELECT 
    i.id as inventory_id,
    pv.id as variant_id,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    pv.sku as variant_sku,
    pv.variant_description,
    COALESCE(c.name, 'Sin Categoría') as category_name,
    i.quantity_available,
    COALESCE(i.quantity_reserved, 0) as quantity_reserved,
    COALESCE(i.quantity_on_order, 0) as quantity_on_order,
    i.reorder_level,
    i.reorder_quantity,
    i.average_cost as unit_cost,
    (i.quantity_available * i.average_cost) as total_value,
    i.location,
    (
        SELECT MAX(im.created_at) 
        FROM inventory_movements im 
        WHERE im.inventory_id = i.id
    ) as last_movement_date,
    CASE 
        WHEN i.quantity_available = 0 THEN 'out_of_stock'
        WHEN i.quantity_available <= i.reorder_level THEN 'low_stock'
        WHEN i.quantity_available <= (i.reorder_level * 2) THEN 'normal'
        ELSE 'high_stock'
    END as stock_status,
    i.created_at,
    i.updated_at
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = $1 -- p_project_id
    AND p.is_active = true
    AND pv.is_active = true
ORDER BY p.name, pv.name
LIMIT $2 OFFSET $3; -- p_limit, p_offset

-- ================================================
-- 5. 📊 INVENTORY STATS SUMMARY QUERY
-- Para estadísticas generales del dashboard
-- ================================================

/*
Estructura de salida optimizada para el dashboard:
total_products, total_stock_value, total_items_count, low_stock_count
*/

SELECT 
    COUNT(DISTINCT p.id) as total_products,
    COALESCE(SUM(i.quantity_available * i.average_cost), 0) as total_stock_value,
    COALESCE(SUM(i.quantity_available), 0) as total_items_count,
    COUNT(CASE WHEN i.quantity_available <= i.reorder_level THEN 1 END) as low_stock_count
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE i.project_id = $1 -- p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true;