-- ================================================
-- 📦 STORED PROCEDURES - INVENTORY
-- Funciones para gestión completa de inventario
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene operaciones especializadas para gestión de inventario

-- ================================================
-- 📈 1. ADJUST INVENTORY
-- ================================================

CREATE OR REPLACE FUNCTION adjust_inventory(
    p_project_id UUID,
    p_variant_id UUID,
    p_quantity_change INTEGER, -- Positivo para entrada, negativo para salida
    p_unit_cost DECIMAL(10,2) DEFAULT NULL,
    p_reason TEXT DEFAULT 'manual_adjustment',
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT 'manual',
    p_notes TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS TABLE(
    inventory_id UUID,
    variant_id UUID,
    variant_sku TEXT,
    previous_quantity INTEGER,
    quantity_change INTEGER,
    new_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    movement_id UUID,
    success BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    current_inventory RECORD;
    calculated_unit_cost DECIMAL(10,2);
    new_total_quantity INTEGER;
    new_movement_id UUID;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    IF p_variant_id IS NULL THEN
        RAISE EXCEPTION 'variant_id es requerido';
    END IF;
    
    IF p_quantity_change = 0 THEN
        RAISE EXCEPTION 'quantity_change no puede ser cero';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Verificar permisos de gestión de inventario
    IF NOT (user_permissions_json->>'can_manage_inventory')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar inventario';
    END IF;
    
    -- Verificar que la variante pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = p_variant_id AND p.project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Variante no encontrada en este proyecto';
    END IF;
    
    -- Obtener inventario actual o crear si no existe
    SELECT * INTO current_inventory
    FROM inventory i
    WHERE i.variant_id = p_variant_id AND i.project_id = p_project_id;
    
    IF current_inventory IS NULL THEN
        -- Crear registro de inventario si no existe
        SELECT pv.sku, p.base_cost INTO current_inventory.sku, calculated_unit_cost
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = p_variant_id;
        
        INSERT INTO inventory (
            project_id, product_id, variant_id, sku,
            quantity_available, reorder_level, reorder_quantity,
            last_cost, average_cost, location
        ) VALUES (
            p_project_id,
            (SELECT product_id FROM product_variants WHERE id = p_variant_id),
            p_variant_id,
            current_inventory.sku,
            0, 3, 10,
            COALESCE(p_unit_cost, calculated_unit_cost),
            COALESCE(p_unit_cost, calculated_unit_cost),
            COALESCE(p_location, 'Almacén Principal')
        )
        RETURNING * INTO current_inventory;
    END IF;
    
    -- Calcular nuevo total
    new_total_quantity := current_inventory.quantity_available + p_quantity_change;
    
    -- Validar que no resulte en stock negativo
    IF new_total_quantity < 0 THEN
        RAISE EXCEPTION 'La operación resultaría en stock negativo (actual: %, cambio: %)', 
            current_inventory.quantity_available, p_quantity_change;
    END IF;
    
    -- Determinar costo unitario
    calculated_unit_cost := COALESCE(p_unit_cost, current_inventory.average_cost);
    
    -- Actualizar inventario
    UPDATE inventory SET
        quantity_available = new_total_quantity,
        last_cost = calculated_unit_cost,
        -- Recalcular costo promedio solo para entradas
        average_cost = CASE 
            WHEN p_quantity_change > 0 THEN
                ((quantity_available * average_cost) + (p_quantity_change * calculated_unit_cost)) / new_total_quantity
            ELSE average_cost
        END,
        location = COALESCE(p_location, location),
        updated_at = NOW()
    WHERE id = current_inventory.id;
    
    -- Registrar movimiento de inventario
    INSERT INTO inventory_movements (
        project_id, inventory_id, movement_type, quantity, unit_cost, total_cost,
        reference_id, reference_type, notes, created_by
    ) VALUES (
        p_project_id,
        current_inventory.id,
        CASE WHEN p_quantity_change > 0 THEN 'in' ELSE 'out' END,
        ABS(p_quantity_change),
        calculated_unit_cost,
        ABS(p_quantity_change) * calculated_unit_cost,
        p_reference_id,
        p_reference_type,
        COALESCE(p_notes, p_reason),
        current_user_id
    )
    RETURNING id INTO new_movement_id;
    
    -- Retornar información del ajuste
    RETURN QUERY
    SELECT 
        current_inventory.id,
        p_variant_id,
        current_inventory.sku,
        current_inventory.quantity_available as previous_quantity,
        p_quantity_change,
        new_total_quantity,
        calculated_unit_cost,
        ABS(p_quantity_change) * calculated_unit_cost as total_cost,
        new_movement_id,
        true as success;
    
END;
$$;

-- ================================================
-- 📊 2. GET STOCK STATUS
-- ================================================

CREATE OR REPLACE FUNCTION get_stock_status(
    p_project_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_product_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_low_stock_only BOOLEAN DEFAULT false
)
RETURNS TABLE(
    inventory_id UUID,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    variant_id UUID,
    variant_name TEXT,
    variant_sku TEXT,
    size TEXT,
    color TEXT,
    quantity_available INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    last_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2),
    total_value DECIMAL(10,2),
    location TEXT,
    stock_status TEXT,
    needs_reorder BOOLEAN,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Retornar estado del inventario
    RETURN QUERY
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
    WHERE i.project_id = p_project_id
    AND (p_variant_id IS NULL OR i.variant_id = p_variant_id)
    AND (p_product_id IS NULL OR p.id = p_product_id)
    AND (p_category_id IS NULL OR c.id = p_category_id)
    AND (p_low_stock_only = false OR i.quantity_available <= i.reorder_level)
    AND p.track_inventory = true
    ORDER BY 
        CASE 
            WHEN i.quantity_available = 0 THEN 1
            WHEN i.quantity_available <= i.reorder_level THEN 2
            ELSE 3
        END,
        p.name, pv.name;
    
END;
$$;

-- ================================================
-- 🔄 3. TRANSFER STOCK
-- ================================================

CREATE OR REPLACE FUNCTION transfer_stock(
    p_project_id UUID,
    p_from_variant_id UUID,
    p_to_variant_id UUID,
    p_quantity INTEGER,
    p_reason TEXT DEFAULT 'stock_transfer',
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    from_variant_sku TEXT,
    to_variant_sku TEXT,
    quantity_transferred INTEGER,
    from_new_quantity INTEGER,
    to_new_quantity INTEGER,
    transfer_movements_created INTEGER,
    success BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    from_inventory RECORD;
    to_inventory RECORD;
    movement_out_id UUID;
    movement_in_id UUID;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    IF p_from_variant_id IS NULL THEN
        RAISE EXCEPTION 'from_variant_id es requerido';
    END IF;
    
    IF p_to_variant_id IS NULL THEN
        RAISE EXCEPTION 'to_variant_id es requerido';
    END IF;
    
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'quantity debe ser mayor que cero';
    END IF;
    
    IF p_from_variant_id = p_to_variant_id THEN
        RAISE EXCEPTION 'No se puede transferir a la misma variante';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Verificar permisos de gestión de inventario
    IF NOT (user_permissions_json->>'can_manage_inventory')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar inventario';
    END IF;
    
    -- Obtener inventario origen
    SELECT * INTO from_inventory
    FROM inventory i
    WHERE i.variant_id = p_from_variant_id AND i.project_id = p_project_id;
    
    IF from_inventory IS NULL THEN
        RAISE EXCEPTION 'Inventario origen no encontrado';
    END IF;
    
    -- Verificar stock suficiente
    IF from_inventory.quantity_available < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente en origen (disponible: %, requerido: %)', 
            from_inventory.quantity_available, p_quantity;
    END IF;
    
    -- Obtener o crear inventario destino
    SELECT * INTO to_inventory
    FROM inventory i
    WHERE i.variant_id = p_to_variant_id AND i.project_id = p_project_id;
    
    IF to_inventory IS NULL THEN
        -- Crear inventario destino
        SELECT pv.sku INTO to_inventory.sku
        FROM product_variants pv WHERE pv.id = p_to_variant_id;
        
        INSERT INTO inventory (
            project_id, product_id, variant_id, sku,
            quantity_available, reorder_level, reorder_quantity,
            last_cost, average_cost, location
        ) VALUES (
            p_project_id,
            (SELECT product_id FROM product_variants WHERE id = p_to_variant_id),
            p_to_variant_id,
            to_inventory.sku,
            0, 3, 10,
            from_inventory.average_cost,
            from_inventory.average_cost,
            from_inventory.location
        )
        RETURNING * INTO to_inventory;
    END IF;
    
    -- Realizar transferencia (restar del origen)
    UPDATE inventory SET
        quantity_available = quantity_available - p_quantity,
        updated_at = NOW()
    WHERE id = from_inventory.id;
    
    -- Agregar al destino
    UPDATE inventory SET
        quantity_available = quantity_available + p_quantity,
        -- Actualizar costo promedio en destino
        average_cost = ((quantity_available * average_cost) + (p_quantity * from_inventory.average_cost)) / (quantity_available + p_quantity),
        last_cost = from_inventory.average_cost,
        updated_at = NOW()
    WHERE id = to_inventory.id;
    
    -- Registrar movimiento de salida
    INSERT INTO inventory_movements (
        project_id, inventory_id, movement_type, quantity, unit_cost, total_cost,
        reference_type, notes, created_by
    ) VALUES (
        p_project_id, from_inventory.id, 'out', p_quantity,
        from_inventory.average_cost, p_quantity * from_inventory.average_cost,
        'transfer_out',
        COALESCE(p_notes, 'Transferencia a ' || to_inventory.sku || ' - ' || p_reason),
        current_user_id
    )
    RETURNING id INTO movement_out_id;
    
    -- Registrar movimiento de entrada
    INSERT INTO inventory_movements (
        project_id, inventory_id, movement_type, quantity, unit_cost, total_cost,
        reference_type, notes, created_by
    ) VALUES (
        p_project_id, to_inventory.id, 'in', p_quantity,
        from_inventory.average_cost, p_quantity * from_inventory.average_cost,
        'transfer_in',
        COALESCE(p_notes, 'Transferencia desde ' || from_inventory.sku || ' - ' || p_reason),
        current_user_id
    )
    RETURNING id INTO movement_in_id;
    
    -- Retornar resultado de la transferencia
    RETURN QUERY
    SELECT 
        from_inventory.sku,
        to_inventory.sku,
        p_quantity,
        (from_inventory.quantity_available - p_quantity) as from_new_quantity,
        (to_inventory.quantity_available + p_quantity) as to_new_quantity,
        2 as transfer_movements_created,
        true as success;
    
END;
$$;

-- ================================================
-- 🚨 4. LOW STOCK ALERT
-- ================================================

CREATE OR REPLACE FUNCTION get_low_stock_alerts(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_include_out_of_stock BOOLEAN DEFAULT true
)
RETURNS TABLE(
    alert_id UUID,
    product_id UUID,
    product_name TEXT,
    variant_id UUID,
    variant_name TEXT,
    variant_sku TEXT,
    current_stock INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    suggested_order_quantity INTEGER,
    alert_level TEXT,
    estimated_cost DECIMAL(10,2),
    location TEXT,
    last_updated TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Retornar alertas de stock bajo
    RETURN QUERY
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
            WHEN i.quantity_available <= (i.reorder_level / 2) THEN 'urgent'
            ELSE 'warning'
        END as alert_level,
        (GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) * i.last_cost) as estimated_cost,
        i.location,
        i.updated_at as last_updated
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.project_id = p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (p_category_id IS NULL OR c.id = p_category_id)
    AND (
        (p_include_out_of_stock = true AND i.quantity_available <= i.reorder_level) OR
        (p_include_out_of_stock = false AND i.quantity_available > 0 AND i.quantity_available <= i.reorder_level)
    )
    ORDER BY 
        CASE 
            WHEN i.quantity_available = 0 THEN 1
            WHEN i.quantity_available <= (i.reorder_level / 2) THEN 2
            ELSE 3
        END,
        i.quantity_available ASC,
        p.name, pv.name;
    
END;
$$;

-- ================================================
-- 📋 5. INVENTORY MOVEMENTS HISTORY
-- ================================================

CREATE OR REPLACE FUNCTION get_inventory_movements(
    p_project_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_movement_type TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    movement_id UUID,
    inventory_id UUID,
    variant_sku TEXT,
    product_name TEXT,
    movement_type TEXT,
    quantity INTEGER,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_id UUID,
    reference_type TEXT,
    notes TEXT,
    created_by UUID,
    created_by_email TEXT,
    created_at TIMESTAMPTZ,
    running_balance INTEGER,
    total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Retornar movimientos de inventario
    RETURN QUERY
    WITH filtered_movements AS (
        SELECT 
            im.id as movement_id,
            im.inventory_id,
            pv.sku as variant_sku,
            p.name as product_name,
            im.movement_type::TEXT,
            im.quantity,
            im.unit_cost,
            im.total_cost,
            im.reference_id,
            im.reference_type,
            im.notes,
            im.created_by,
            au.email as created_by_email,
            im.created_at,
            -- Calcular balance acumulado
            SUM(CASE WHEN im.movement_type = 'in' THEN im.quantity ELSE -im.quantity END) 
                OVER (PARTITION BY im.inventory_id ORDER BY im.created_at, im.id) as running_balance
        FROM inventory_movements im
        JOIN inventory i ON im.inventory_id = i.id
        JOIN product_variants pv ON i.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN auth.users au ON im.created_by = au.id
        WHERE im.project_id = p_project_id
        AND (p_variant_id IS NULL OR i.variant_id = p_variant_id)
        AND (p_movement_type IS NULL OR im.movement_type::TEXT = p_movement_type)
        AND (p_reference_type IS NULL OR im.reference_type = p_reference_type)
        AND (p_start_date IS NULL OR im.created_at >= p_start_date)
        AND (p_end_date IS NULL OR im.created_at <= p_end_date)
        ORDER BY im.created_at DESC, im.id DESC
    ),
    counted_movements AS (
        SELECT *, COUNT(*) OVER() as total_count
        FROM filtered_movements
    )
    SELECT * FROM counted_movements
    LIMIT p_limit OFFSET p_offset;
    
END;
$$;

-- ================================================
-- 📊 6. INVENTORY VALUATION REPORT
-- ================================================

CREATE OR REPLACE FUNCTION get_inventory_valuation(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_valuation_method TEXT DEFAULT 'average' -- 'average', 'last', 'fifo'
)
RETURNS TABLE(
    total_items BIGINT,
    total_quantity BIGINT,
    total_value_at_cost DECIMAL(12,2),
    total_value_at_price DECIMAL(12,2),
    potential_profit DECIMAL(12,2),
    profit_margin DECIMAL(5,2),
    category_breakdown JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    category_data JSONB;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Calcular breakdown por categoría
    SELECT jsonb_agg(
        jsonb_build_object(
            'category_id', category_id,
            'category_name', category_name,
            'items', items,
            'quantity', quantity,
            'value_at_cost', value_at_cost,
            'value_at_price', value_at_price,
            'profit', profit
        )
    ) INTO category_data
    FROM (
        SELECT 
            COALESCE(c.id, '00000000-0000-0000-0000-000000000000'::UUID) as category_id,
            COALESCE(c.name, 'Sin Categoría') as category_name,
            COUNT(i.id) as items,
            SUM(i.quantity_available) as quantity,
            SUM(i.quantity_available * 
                CASE 
                    WHEN p_valuation_method = 'average' THEN i.average_cost
                    WHEN p_valuation_method = 'last' THEN i.last_cost
                    ELSE i.average_cost -- Default to average
                END
            ) as value_at_cost,
            SUM(i.quantity_available * (p.base_price + pv.price_adjustment)) as value_at_price,
            SUM(i.quantity_available * ((p.base_price + pv.price_adjustment) - 
                CASE 
                    WHEN p_valuation_method = 'average' THEN i.average_cost
                    WHEN p_valuation_method = 'last' THEN i.last_cost
                    ELSE i.average_cost
                END
            )) as profit
        FROM inventory i
        JOIN product_variants pv ON i.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE i.project_id = p_project_id
        AND (p_category_id IS NULL OR c.id = p_category_id)
        AND p.track_inventory = true
        AND p.is_active = true
        AND pv.is_active = true
        AND i.quantity_available > 0
        GROUP BY c.id, c.name
        ORDER BY value_at_cost DESC
    ) category_summary;
    
    -- Retornar reporte de valuación
    RETURN QUERY
    SELECT 
        COUNT(i.id) as total_items,
        SUM(i.quantity_available) as total_quantity,
        SUM(i.quantity_available * 
            CASE 
                WHEN p_valuation_method = 'average' THEN i.average_cost
                WHEN p_valuation_method = 'last' THEN i.last_cost
                ELSE i.average_cost
            END
        ) as total_value_at_cost,
        SUM(i.quantity_available * (p.base_price + pv.price_adjustment)) as total_value_at_price,
        SUM(i.quantity_available * ((p.base_price + pv.price_adjustment) - 
            CASE 
                WHEN p_valuation_method = 'average' THEN i.average_cost
                WHEN p_valuation_method = 'last' THEN i.last_cost
                ELSE i.average_cost
            END
        )) as potential_profit,
        CASE 
            WHEN SUM(i.quantity_available * (p.base_price + pv.price_adjustment)) > 0 THEN
                ROUND(
                    (SUM(i.quantity_available * ((p.base_price + pv.price_adjustment) - 
                        CASE 
                            WHEN p_valuation_method = 'average' THEN i.average_cost
                            WHEN p_valuation_method = 'last' THEN i.last_cost
                            ELSE i.average_cost
                        END
                    )) / SUM(i.quantity_available * (p.base_price + pv.price_adjustment))) * 100, 2
                )
            ELSE 0
        END as profit_margin,
        COALESCE(category_data, '[]'::jsonb) as category_breakdown
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.project_id = p_project_id
    AND (p_category_id IS NULL OR c.id = p_category_id)
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND i.quantity_available > 0;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION adjust_inventory IS 'Ajusta inventario con movimientos automáticos y cálculo de costos promedio';
COMMENT ON FUNCTION get_stock_status IS 'Obtiene estado completo del inventario con alertas de reorden';
COMMENT ON FUNCTION transfer_stock IS 'Transfiere stock entre variantes con movimientos balanceados';
COMMENT ON FUNCTION get_low_stock_alerts IS 'Genera alertas de stock bajo con recomendaciones de reorden';
COMMENT ON FUNCTION get_inventory_movements IS 'Historial de movimientos con balance acumulado';
COMMENT ON FUNCTION get_inventory_valuation IS 'Reporte de valuación con breakdown por categoría';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION adjust_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_status TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_stock TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_movements TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_valuation TO authenticated;

-- ================================================
-- ✅ FUNCIONES INVENTORY COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ adjust_inventory() - Ajustar stock con movimientos automáticos y costos promedio
-- ✅ get_stock_status() - Estado completo del inventario con alertas
-- ✅ transfer_stock() - Transferir stock entre variantes con trazabilidad
-- ✅ get_low_stock_alerts() - Alertas inteligentes con recomendaciones
-- ✅ get_inventory_movements() - Historial completo con balance acumulado
-- ✅ get_inventory_valuation() - Valuación con múltiples métodos y breakdown

/*
EJEMPLOS DE USO:

-- Ajustar inventario (entrada)
SELECT * FROM adjust_inventory(
    'uuid-proyecto',
    'uuid-variante',
    20,
    25.00,
    'purchase_receipt',
    'uuid-orden-compra',
    'purchase_order',
    'Recepción de orden de compra #123'
);

-- Obtener estado de stock con alertas
SELECT * FROM get_stock_status(
    'uuid-proyecto',
    p_low_stock_only := true
);

-- Transferir stock entre variantes
SELECT * FROM transfer_stock(
    'uuid-proyecto',
    'uuid-variante-origen',
    'uuid-variante-destino',
    5,
    'size_correction',
    'Corrección de tallas incorrectas'
);

-- Obtener alertas de stock bajo
SELECT * FROM get_low_stock_alerts(
    'uuid-proyecto',
    p_include_out_of_stock := true
);

-- Reporte de valuación de inventario
SELECT * FROM get_inventory_valuation(
    'uuid-proyecto',
    p_valuation_method := 'average'
);

-- ================================================
-- 📋 LIST INVENTORY ITEMS
-- ================================================

CREATE OR REPLACE FUNCTION list_inventory_items(
    p_project_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_category_filter TEXT DEFAULT NULL,
    p_status_filter TEXT DEFAULT NULL, -- 'in_stock', 'low_stock', 'out_of_stock', 'all'
    p_location_filter TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'product_name',
    p_sort_direction TEXT DEFAULT 'ASC',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    inventory_id UUID,
    variant_id UUID,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    variant_sku TEXT,
    variant_description TEXT,
    category_name TEXT,
    quantity_available INTEGER,
    quantity_reserved INTEGER,
    quantity_on_order INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    location TEXT,
    last_movement_date TIMESTAMPTZ,
    stock_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    base_query TEXT;
    where_conditions TEXT[];
    order_clause TEXT;
    limit_clause TEXT;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    -- Validar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Validar parámetros requeridos
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'project_id es requerido';
    END IF;
    
    -- Obtener permisos del usuario para este proyecto
    SELECT up.permissions INTO user_permissions_json
    FROM user_projects up
    WHERE up.user_id = current_user_id 
    AND up.project_id = p_project_id 
    AND up.is_active = true;
    
    -- Verificar que el usuario tenga acceso
    IF user_permissions_json IS NULL THEN
        RAISE EXCEPTION 'No tienes acceso a este proyecto';
    END IF;
    
    -- Construir condiciones WHERE
    where_conditions := ARRAY['p.project_id = $1'];
    
    -- Filtro de búsqueda
    IF p_search_term IS NOT NULL AND trim(p_search_term) != '' THEN
        where_conditions := where_conditions || ARRAY[
            '(p.name ILIKE $' || (array_length(where_conditions, 1) + 1) || 
            ' OR p.sku ILIKE $' || (array_length(where_conditions, 1) + 1) ||
            ' OR pv.sku ILIKE $' || (array_length(where_conditions, 1) + 1) ||
            ' OR pv.variant_description ILIKE $' || (array_length(where_conditions, 1) + 1) || ')'
        ];
    END IF;
    
    -- Filtro de categoría
    IF p_category_filter IS NOT NULL AND trim(p_category_filter) != '' THEN
        where_conditions := where_conditions || ARRAY[
            'c.name = $' || (array_length(where_conditions, 1) + 1)
        ];
    END IF;
    
    -- Filtro de estado de stock
    IF p_status_filter IS NOT NULL AND p_status_filter != 'all' THEN
        CASE p_status_filter
            WHEN 'in_stock' THEN
                where_conditions := where_conditions || ARRAY['COALESCE(i.quantity_available, 0) > 0'];
            WHEN 'low_stock' THEN
                where_conditions := where_conditions || ARRAY[
                    'COALESCE(i.quantity_available, 0) > 0 AND COALESCE(i.quantity_available, 0) <= COALESCE(i.reorder_level, 0)'
                ];
            WHEN 'out_of_stock' THEN
                where_conditions := where_conditions || ARRAY['COALESCE(i.quantity_available, 0) = 0'];
        END CASE;
    END IF;
    
    -- Filtro de ubicación
    IF p_location_filter IS NOT NULL AND trim(p_location_filter) != '' THEN
        where_conditions := where_conditions || ARRAY[
            'i.location = $' || (array_length(where_conditions, 1) + 1)
        ];
    END IF;
    
    -- Construir ORDER BY
    CASE p_sort_by
        WHEN 'product_name' THEN order_clause := 'p.name';
        WHEN 'sku' THEN order_clause := 'COALESCE(pv.sku, p.sku)';
        WHEN 'category' THEN order_clause := 'c.name';
        WHEN 'quantity' THEN order_clause := 'COALESCE(i.quantity_available, 0)';
        WHEN 'value' THEN order_clause := 'COALESCE(i.quantity_available, 0) * COALESCE(i.unit_cost, 0)';
        WHEN 'last_movement' THEN order_clause := 'i.last_movement_date';
        ELSE order_clause := 'p.name';
    END CASE;
    
    order_clause := order_clause || ' ' || CASE WHEN upper(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;
    
    -- Construir LIMIT y OFFSET
    limit_clause := '';
    IF p_limit > 0 THEN
        limit_clause := ' LIMIT ' || p_limit;
        IF p_offset > 0 THEN
            limit_clause := limit_clause || ' OFFSET ' || p_offset;
        END IF;
    END IF;
    
    -- Ejecutar consulta
    RETURN QUERY
    SELECT 
        i.id as inventory_id,
        pv.id as variant_id,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        pv.sku as variant_sku,
        pv.variant_description,
        c.name as category_name,
        COALESCE(i.quantity_available, 0) as quantity_available,
        COALESCE(i.quantity_reserved, 0) as quantity_reserved,
        COALESCE(i.quantity_on_order, 0) as quantity_on_order,
        i.reorder_level,
        i.reorder_quantity,
        i.unit_cost,
        COALESCE(i.quantity_available, 0) * COALESCE(i.unit_cost, 0) as total_value,
        i.location,
        i.last_movement_date,
        CASE 
            WHEN COALESCE(i.quantity_available, 0) = 0 THEN 'out_of_stock'
            WHEN COALESCE(i.quantity_available, 0) <= COALESCE(i.reorder_level, 0) THEN 'low_stock'
            ELSE 'in_stock'
        END as stock_status,
        i.created_at,
        i.updated_at
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    LEFT JOIN inventory i ON pv.id = i.variant_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.project_id = p_project_id
        AND (p_search_term IS NULL OR trim(p_search_term) = '' OR (
            p.name ILIKE '%' || p_search_term || '%' OR
            p.sku ILIKE '%' || p_search_term || '%' OR
            pv.sku ILIKE '%' || p_search_term || '%' OR
            pv.variant_description ILIKE '%' || p_search_term || '%'
        ))
        AND (p_category_filter IS NULL OR trim(p_category_filter) = '' OR c.name = p_category_filter)
        AND (p_status_filter IS NULL OR p_status_filter = 'all' OR (
            CASE p_status_filter
                WHEN 'in_stock' THEN COALESCE(i.quantity_available, 0) > 0
                WHEN 'low_stock' THEN COALESCE(i.quantity_available, 0) > 0 AND COALESCE(i.quantity_available, 0) <= COALESCE(i.reorder_level, 0)
                WHEN 'out_of_stock' THEN COALESCE(i.quantity_available, 0) = 0
                ELSE true
            END
        ))
        AND (p_location_filter IS NULL OR trim(p_location_filter) = '' OR i.location = p_location_filter)
    ORDER BY 
        CASE WHEN p_sort_by = 'product_name' THEN p.name END ASC,
        CASE WHEN p_sort_by = 'sku' THEN COALESCE(pv.sku, p.sku) END ASC,
        CASE WHEN p_sort_by = 'category' THEN c.name END ASC,
        CASE WHEN p_sort_by = 'quantity' THEN COALESCE(i.quantity_available, 0) END DESC,
        CASE WHEN p_sort_by = 'value' THEN COALESCE(i.quantity_available, 0) * COALESCE(i.unit_cost, 0) END DESC,
        CASE WHEN p_sort_by = 'last_movement' THEN i.last_movement_date END DESC
    LIMIT COALESCE(p_limit, 50)
    OFFSET COALESCE(p_offset, 0);
END;
$$;

-- Comentarios y permisos
COMMENT ON FUNCTION list_inventory_items IS 'Lista todos los items de inventario con filtros avanzados';
GRANT EXECUTE ON FUNCTION list_inventory_items TO authenticated;
*/