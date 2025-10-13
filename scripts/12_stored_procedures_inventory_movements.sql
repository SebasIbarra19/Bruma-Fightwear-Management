-- ================================================
-- 📦 STORED PROCEDURES: INVENTORY MOVEMENTS
-- Gestión de movimientos de inventario
-- ================================================

-- Función para obtener movimientos de inventario con información completa
CREATE OR REPLACE FUNCTION get_inventory_movements(
    p_project_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_movement_type TEXT DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
    movement_id UUID,
    movement_type TEXT,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    variant_id UUID,
    variant_name TEXT,
    variant_sku TEXT,
    quantity INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    location_from TEXT,
    location_to TEXT,
    reason TEXT,
    reference_number TEXT,
    user_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    notes TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        im.id as movement_id,
        im.movement_type::TEXT,
        im.product_id,
        COALESCE(p.name, 'Producto Desconocido') as product_name,
        COALESCE(p.sku, 'N/A') as product_sku,
        im.variant_id,
        COALESCE(pv.name, 'Variante Desconocida') as variant_name,
        COALESCE(pv.sku, im.reference_sku, 'N/A') as variant_sku,
        im.quantity,
        COALESCE(im.unit_cost, 0.00) as unit_cost,
        COALESCE(im.total_cost, 0.00) as total_cost,
        COALESCE(im.location_from, 'N/A') as location_from,
        COALESCE(im.location_to, 'N/A') as location_to,
        COALESCE(im.reason, 'Sin especificar') as reason,
        COALESCE(im.reference_number, 'N/A') as reference_number,
        COALESCE(im.user_name, 'Sistema') as user_name,
        im.created_at,
        im.updated_at,
        im.notes
    FROM inventory_movements im
    LEFT JOIN products p ON im.product_id = p.id
    LEFT JOIN product_variants pv ON im.variant_id = pv.id
    WHERE im.project_id = p_project_id
      AND (p_movement_type IS NULL OR im.movement_type = p_movement_type)
      AND (p_date_from IS NULL OR DATE(im.created_at) >= p_date_from)
      AND (p_date_to IS NULL OR DATE(im.created_at) <= p_date_to)
      AND (p_search_term IS NULL OR 
           p.name ILIKE '%' || p_search_term || '%' OR
           pv.name ILIKE '%' || p_search_term || '%' OR
           im.reference_number ILIKE '%' || p_search_term || '%')
    ORDER BY im.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Función para obtener estadísticas de movimientos de inventario
CREATE OR REPLACE FUNCTION get_inventory_movement_stats(
    p_project_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_movements INTEGER,
    total_entries INTEGER,
    total_exits INTEGER,
    total_transfers INTEGER,
    total_adjustments INTEGER,
    total_value_in DECIMAL(10,2),
    total_value_out DECIMAL(10,2),
    net_value DECIMAL(10,2),
    most_active_product TEXT,
    recent_movements INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_movements,
        COUNT(CASE WHEN movement_type = 'entrada' THEN 1 END)::INTEGER as total_entries,
        COUNT(CASE WHEN movement_type = 'salida' THEN 1 END)::INTEGER as total_exits,
        COUNT(CASE WHEN movement_type = 'transferencia' THEN 1 END)::INTEGER as total_transfers,
        COUNT(CASE WHEN movement_type = 'ajuste' THEN 1 END)::INTEGER as total_adjustments,
        COALESCE(SUM(CASE WHEN movement_type IN ('entrada', 'ajuste') AND quantity > 0 THEN total_cost END), 0.00) as total_value_in,
        COALESCE(SUM(CASE WHEN movement_type IN ('salida', 'ajuste') AND quantity < 0 THEN ABS(total_cost) END), 0.00) as total_value_out,
        COALESCE(SUM(CASE 
            WHEN movement_type IN ('entrada', 'ajuste') AND quantity > 0 THEN total_cost
            WHEN movement_type IN ('salida', 'ajuste') AND quantity < 0 THEN -ABS(total_cost)
            ELSE 0
        END), 0.00) as net_value,
        COALESCE(
            (SELECT p.name 
             FROM inventory_movements im2 
             LEFT JOIN products p ON im2.product_id = p.id
             WHERE im2.project_id = p_project_id
               AND (p_date_from IS NULL OR DATE(im2.created_at) >= p_date_from)
               AND (p_date_to IS NULL OR DATE(im2.created_at) <= p_date_to)
             GROUP BY p.name
             ORDER BY COUNT(*) DESC
             LIMIT 1), 
            'N/A'
        ) as most_active_product,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::INTEGER as recent_movements
    FROM inventory_movements
    WHERE project_id = p_project_id
      AND (p_date_from IS NULL OR DATE(created_at) >= p_date_from)
      AND (p_date_to IS NULL OR DATE(created_at) <= p_date_to);
END;
$$;

-- Función para crear un nuevo movimiento de inventario
CREATE OR REPLACE FUNCTION create_inventory_movement(
    p_project_id UUID,
    p_movement_type TEXT,
    p_product_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_quantity INTEGER,
    p_unit_cost DECIMAL(10,2) DEFAULT 0.00,
    p_location_from TEXT DEFAULT NULL,
    p_location_to TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT 'Sistema',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_movement_id UUID;
    v_total_cost DECIMAL(10,2);
BEGIN
    -- Generar ID para el movimiento
    v_movement_id := gen_random_uuid();
    
    -- Calcular costo total
    v_total_cost := p_quantity * p_unit_cost;
    
    -- Insertar el movimiento
    INSERT INTO inventory_movements (
        id, project_id, movement_type, product_id, variant_id,
        quantity, unit_cost, total_cost, location_from, location_to,
        reason, reference_number, user_name, notes,
        created_at, updated_at
    ) VALUES (
        v_movement_id, p_project_id, p_movement_type, p_product_id, p_variant_id,
        p_quantity, p_unit_cost, v_total_cost, p_location_from, p_location_to,
        p_reason, p_reference_number, p_user_name, p_notes,
        NOW(), NOW()
    );
    
    RETURN v_movement_id;
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION get_inventory_movements IS 'Obtiene movimientos de inventario con filtros y paginación';
COMMENT ON FUNCTION get_inventory_movement_stats IS 'Obtiene estadísticas de movimientos de inventario';
COMMENT ON FUNCTION create_inventory_movement IS 'Crea un nuevo movimiento de inventario';