-- ================================================
-- 📦 QUERIES ESPECÍFICOS PARA APIs - FORMATO JSON
-- Usar estos queries en las API routes de Next.js
-- ================================================

-- ================================================
-- 1. QUERY PARA ESTADÍSTICAS DEL DASHBOARD 
-- Endpoint: /api/inventory/stats
-- ================================================

SELECT 
    COUNT(DISTINCT p.id)::integer as total_products,
    COALESCE(SUM(i.quantity_available), 0)::integer as total_items,
    COALESCE(SUM(i.quantity_available * i.average_cost), 0)::decimal(10,2) as total_value,
    COUNT(CASE WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 1 END)::integer as low_stock_items
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE i.project_id = $1 -- parametro project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true;

-- ================================================
-- 2. QUERY PARA ALERTAS DE STOCK BAJO
-- Endpoint: /api/inventory/alerts  
-- ================================================

SELECT 
    i.id as alert_id,
    p.id as product_id,
    p.name as product_name,
    pv.id as variant_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    i.quantity_available as current_stock,
    COALESCE(i.reorder_level, 0) as reorder_level,
    COALESCE(i.reorder_quantity, 10) as reorder_quantity,
    GREATEST(
        COALESCE(i.reorder_quantity, 10), 
        COALESCE(i.reorder_level, 0) - i.quantity_available
    ) as suggested_order_quantity,
    CASE 
        WHEN i.quantity_available = 0 THEN 'critical'
        WHEN i.quantity_available <= (COALESCE(i.reorder_level, 0) * 0.5) THEN 'high'
        WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 'medium'
        ELSE 'low'
    END as alert_level,
    (GREATEST(
        COALESCE(i.reorder_quantity, 10), 
        COALESCE(i.reorder_level, 0) - i.quantity_available
    ) * COALESCE(i.average_cost, 0))::decimal(10,2) as estimated_cost,
    COALESCE(i.location, 'Almacén Principal') as location,
    i.updated_at as last_updated
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE i.project_id = $1 -- parametro project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (
        i.quantity_available = 0 OR 
        i.quantity_available <= COALESCE(i.reorder_level, 0)
    )
ORDER BY 
    CASE 
        WHEN i.quantity_available = 0 THEN 1
        WHEN i.quantity_available <= (COALESCE(i.reorder_level, 0) * 0.5) THEN 2
        WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 3
        ELSE 4
    END,
    p.name, pv.name
LIMIT $2 OFFSET $3; -- parametros limit, offset

-- ================================================
-- 3. QUERY PARA LISTADO DE INVENTARIO
-- Endpoint: /api/inventory/items
-- ================================================

SELECT 
    i.id as inventory_id,
    pv.id as variant_id,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    pv.sku as variant_sku,
    pv.name as variant_name,
    COALESCE(pv.variant_description, pv.name) as variant_description,
    COALESCE(c.name, 'Sin Categoría') as category_name,
    i.quantity_available,
    COALESCE(i.quantity_reserved, 0) as quantity_reserved,
    COALESCE(i.quantity_on_order, 0) as quantity_on_order,
    COALESCE(i.reorder_level, 0) as reorder_level,
    COALESCE(i.reorder_quantity, 10) as reorder_quantity,
    COALESCE(i.average_cost, 0)::decimal(10,2) as unit_cost,
    (i.quantity_available * COALESCE(i.average_cost, 0))::decimal(10,2) as total_value,
    COALESCE(i.location, 'Almacén Principal') as location,
    CASE 
        WHEN i.quantity_available = 0 THEN 'out_of_stock'
        WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 'low_stock'
        WHEN i.quantity_available <= (COALESCE(i.reorder_level, 0) * 2) THEN 'normal'
        ELSE 'high_stock'
    END as stock_status,
    i.created_at,
    i.updated_at
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE i.project_id = $1 -- parametro project_id
    AND p.is_active = true
    AND pv.is_active = true
    -- Filtros opcionales con CASE statements
    AND ($2::text IS NULL OR $2 = '' OR (
        p.name ILIKE '%' || $2 || '%' OR
        pv.name ILIKE '%' || $2 || '%' OR
        pv.sku ILIKE '%' || $2 || '%'
    )) -- parametro search_term
    AND ($3::text IS NULL OR $3 = '' OR $3 = 'all' OR (
        CASE $3
            WHEN 'in_stock' THEN i.quantity_available > 0
            WHEN 'low_stock' THEN i.quantity_available > 0 AND i.quantity_available <= COALESCE(i.reorder_level, 0)
            WHEN 'out_of_stock' THEN i.quantity_available = 0
            WHEN 'normal' THEN i.quantity_available > COALESCE(i.reorder_level, 0)
            ELSE true
        END
    )) -- parametro status_filter
ORDER BY p.name, pv.name
LIMIT $4 OFFSET $5; -- parametros limit, offset

-- ================================================
-- 4. QUERY PARA VALORACIÓN DE INVENTARIO
-- Endpoint: /api/inventory/valuation
-- ================================================

WITH category_breakdown AS (
    SELECT 
        json_agg(
            json_build_object(
                'category_id', COALESCE(c.id::text, ''),
                'category_name', COALESCE(c.name, 'Sin Categoría'),
                'items', COUNT(i.id),
                'quantity', SUM(i.quantity_available),
                'value_at_cost', SUM(i.quantity_available * COALESCE(i.average_cost, 0)),
                'value_at_price', SUM(i.quantity_available * (p.base_price + COALESCE(pv.price_adjustment, 0))),
                'profit', SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - COALESCE(i.average_cost, 0)))
            )
        ) as breakdown
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
)
SELECT 
    COUNT(i.id) as total_items,
    SUM(i.quantity_available) as total_quantity,
    SUM(i.quantity_available * COALESCE(i.average_cost, 0))::decimal(12,2) as total_value_at_cost,
    SUM(i.quantity_available * (p.base_price + COALESCE(pv.price_adjustment, 0)))::decimal(12,2) as total_value_at_price,
    SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - COALESCE(i.average_cost, 0)))::decimal(12,2) as potential_profit,
    CASE 
        WHEN SUM(i.quantity_available * COALESCE(i.average_cost, 0)) > 0 THEN
            ROUND(
                (SUM(i.quantity_available * ((p.base_price + COALESCE(pv.price_adjustment, 0)) - COALESCE(i.average_cost, 0))) / 
                SUM(i.quantity_available * COALESCE(i.average_cost, 0)) * 100)::numeric, 2
            )
        ELSE 0
    END as profit_margin,
    COALESCE(cb.breakdown, '[]'::json) as category_breakdown
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
CROSS JOIN category_breakdown cb
WHERE i.project_id = $1 -- parametro project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND i.quantity_available > 0;

-- ================================================
-- 5. QUERY PARA ESTADO DEL STOCK (DETALLADO)
-- Endpoint: /api/inventory/stock-status
-- ================================================

SELECT 
    i.id as inventory_id,
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    pv.id as variant_id,
    pv.name as variant_name,
    pv.sku as variant_sku,
    COALESCE(pv.size, '') as size,
    COALESCE(pv.color, '') as color,
    i.quantity_available,
    COALESCE(i.reorder_level, 0) as reorder_level,
    COALESCE(i.reorder_quantity, 10) as reorder_quantity,
    COALESCE(i.last_cost, 0)::decimal(10,2) as last_cost,
    COALESCE(i.average_cost, 0)::decimal(10,2) as average_cost,
    (i.quantity_available * COALESCE(i.average_cost, 0))::decimal(10,2) as total_value,
    COALESCE(i.location, 'Almacén Principal') as location,
    CASE 
        WHEN i.quantity_available = 0 THEN 'out_of_stock'
        WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 'low_stock'
        WHEN i.quantity_available <= (COALESCE(i.reorder_level, 0) * 2) THEN 'normal'
        ELSE 'high_stock'
    END as stock_status,
    (i.quantity_available <= COALESCE(i.reorder_level, 0)) as needs_reorder,
    i.updated_at
FROM inventory i
JOIN product_variants pv ON i.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE i.project_id = $1 -- parametro project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    -- Filtro opcional para solo items con stock bajo
    AND ($2::boolean IS NULL OR $2 = false OR i.quantity_available <= COALESCE(i.reorder_level, 0))
ORDER BY 
    CASE 
        WHEN i.quantity_available = 0 THEN 1
        WHEN i.quantity_available <= COALESCE(i.reorder_level, 0) THEN 2
        ELSE 3
    END,
    p.name, pv.name;