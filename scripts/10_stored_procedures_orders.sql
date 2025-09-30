-- ================================================
-- 🛒 STORED PROCEDURES - ORDERS
-- Funciones para gestión completa de órdenes
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene operaciones complejas para gestión de órdenes

-- ================================================
-- 📝 1. CREATE ORDER
-- ================================================

CREATE OR REPLACE FUNCTION create_order(
    p_project_id UUID,
    p_customer_id UUID,
    p_order_items JSONB, -- Array de items: [{"variant_id": "uuid", "quantity": 2, "unit_price": 25.00}]
    p_shipping_address_id UUID DEFAULT NULL,
    p_billing_address_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'pending',
    p_shipping_method TEXT DEFAULT 'standard',
    p_notes TEXT DEFAULT NULL,
    p_discount_amount DECIMAL(10,2) DEFAULT 0,
    p_tax_rate DECIMAL(5,4) DEFAULT 0.16
)
RETURNS TABLE(
    id UUID,
    order_number TEXT,
    project_id UUID,
    customer_id UUID,
    customer_name TEXT,
    status TEXT,
    subtotal DECIMAL(12,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    payment_method TEXT,
    payment_status TEXT,
    shipping_method TEXT,
    shipping_status TEXT,
    items_created INTEGER,
    inventory_reserved BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    new_order_id UUID;
    order_number_value TEXT;
    item JSONB;
    variant_record RECORD;
    calculated_subtotal DECIMAL(12,2) := 0;
    calculated_tax DECIMAL(10,2);
    calculated_total DECIMAL(12,2);
    items_count INTEGER := 0;
    inventory_success BOOLEAN := true;
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
    
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'customer_id es requerido';
    END IF;
    
    IF p_order_items IS NULL OR jsonb_array_length(p_order_items) = 0 THEN
        RAISE EXCEPTION 'order_items es requerido y debe contener al menos un item';
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
    
    -- Verificar permisos de gestión de órdenes
    IF NOT (user_permissions_json->>'can_manage_orders')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar órdenes';
    END IF;
    
    -- Validar que el cliente exista
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id AND project_id = p_project_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Cliente no encontrado o inactivo';
    END IF;
    
    -- Validar métodos de pago y envío
    IF p_payment_method NOT IN ('cash', 'card', 'transfer', 'paypal', 'stripe', 'pending') THEN
        RAISE EXCEPTION 'Método de pago inválido';
    END IF;
    
    IF p_shipping_method NOT IN ('standard', 'express', 'overnight', 'pickup', 'digital') THEN
        RAISE EXCEPTION 'Método de envío inválido';
    END IF;
    
    -- Generar número de orden único
    SELECT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT, 10, '0') 
    INTO order_number_value;
    
    -- Validar y calcular items
    FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        -- Validar estructura del item
        IF NOT (item ? 'variant_id' AND item ? 'quantity') THEN
            RAISE EXCEPTION 'Cada item debe tener variant_id y quantity';
        END IF;
        
        -- Obtener información de la variante
        SELECT 
            pv.id, pv.name, pv.sku, pv.price_adjustment,
            p.base_price, p.name as product_name, p.track_inventory,
            i.quantity_available
        INTO variant_record
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN inventory i ON pv.id = i.variant_id
        WHERE pv.id = (item->>'variant_id')::UUID 
        AND p.project_id = p_project_id
        AND pv.is_active = true 
        AND p.is_active = true;
        
        IF variant_record IS NULL THEN
            RAISE EXCEPTION 'Variante % no encontrada o inactiva', item->>'variant_id';
        END IF;
        
        -- Validar stock si el producto requiere seguimiento de inventario
        IF variant_record.track_inventory THEN
            IF COALESCE(variant_record.quantity_available, 0) < (item->>'quantity')::INTEGER THEN
                RAISE EXCEPTION 'Stock insuficiente para %: disponible %, requerido %', 
                    variant_record.sku, 
                    COALESCE(variant_record.quantity_available, 0), 
                    (item->>'quantity')::INTEGER;
            END IF;
        END IF;
        
        -- Calcular precio del item
        calculated_subtotal := calculated_subtotal + 
            ((variant_record.base_price + COALESCE(variant_record.price_adjustment, 0)) * (item->>'quantity')::INTEGER);
        
        items_count := items_count + 1;
    END LOOP;
    
    -- Calcular impuestos y total
    calculated_tax := (calculated_subtotal - p_discount_amount) * p_tax_rate;
    calculated_total := calculated_subtotal - p_discount_amount + calculated_tax;
    
    -- Crear la orden
    INSERT INTO orders (
        order_number, project_id, customer_id, status, 
        subtotal, discount_amount, tax_amount, tax_rate, shipping_cost, total_amount,
        payment_method, payment_status, shipping_method, shipping_status,
        shipping_address_id, billing_address_id, notes, created_by, updated_by
    ) VALUES (
        order_number_value, p_project_id, p_customer_id, 'pending',
        calculated_subtotal, p_discount_amount, calculated_tax, p_tax_rate, 0, calculated_total,
        p_payment_method, 'pending', p_shipping_method, 'pending',
        p_shipping_address_id, p_billing_address_id, trim(p_notes), current_user_id, current_user_id
    )
    RETURNING id INTO new_order_id;
    
    -- Crear items de la orden y reservar inventario
    FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        -- Obtener información actualizada de la variante
        SELECT 
            pv.id, pv.name, pv.sku, pv.price_adjustment,
            p.base_price, p.track_inventory
        INTO variant_record
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = (item->>'variant_id')::UUID;
        
        -- Crear item de orden
        INSERT INTO order_items (
            order_id, variant_id, quantity, unit_price, total_price
        ) VALUES (
            new_order_id,
            variant_record.id,
            (item->>'quantity')::INTEGER,
            variant_record.base_price + COALESCE(variant_record.price_adjustment, 0),
            (variant_record.base_price + COALESCE(variant_record.price_adjustment, 0)) * (item->>'quantity')::INTEGER
        );
        
        -- Reservar inventario si es necesario
        IF variant_record.track_inventory THEN
            BEGIN
                -- Usar la función de ajuste de inventario para reservar stock
                PERFORM adjust_inventory(
                    p_project_id,
                    variant_record.id,
                    -(item->>'quantity')::INTEGER, -- Cantidad negativa para salida
                    NULL, -- unit_cost
                    'order_reservation',
                    new_order_id,
                    'order',
                    'Reserva automática para orden ' || order_number_value
                );
            EXCEPTION WHEN OTHERS THEN
                inventory_success := false;
                RAISE EXCEPTION 'Error al reservar inventario para %: %', variant_record.sku, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    -- Retornar información de la orden creada
    RETURN QUERY
    SELECT 
        o.id, o.order_number, o.project_id, o.customer_id,
        (c.first_name || ' ' || c.last_name) as customer_name,
        o.status, o.subtotal, o.discount_amount, o.tax_amount, 
        o.shipping_cost, o.total_amount, o.payment_method, o.payment_status,
        o.shipping_method, o.shipping_status, items_count, inventory_success,
        o.created_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = new_order_id;
    
END;
$$;

-- ================================================
-- 🔍 2. GET ORDER DETAILS
-- ================================================

CREATE OR REPLACE FUNCTION get_order_details(
    p_project_id UUID,
    p_order_id UUID DEFAULT NULL,
    p_order_number TEXT DEFAULT NULL,
    p_include_items BOOLEAN DEFAULT true,
    p_include_customer BOOLEAN DEFAULT true,
    p_include_addresses BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    order_number TEXT,
    project_id UUID,
    customer_id UUID,
    customer_info JSONB,
    status TEXT,
    subtotal DECIMAL(12,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    tax_rate DECIMAL(5,4),
    shipping_cost DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    payment_method TEXT,
    payment_status TEXT,
    shipping_method TEXT,
    shipping_status TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    order_items JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_order_id UUID;
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
    
    -- Validar parámetros (al menos uno debe estar presente)
    IF p_order_id IS NULL AND (p_order_number IS NULL OR trim(p_order_number) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar order_id o order_number';
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
    
    -- Obtener el ID de la orden
    IF p_order_id IS NOT NULL THEN
        target_order_id := p_order_id;
    ELSIF p_order_number IS NOT NULL AND trim(p_order_number) != '' THEN
        SELECT orders.id INTO target_order_id 
        FROM orders 
        WHERE orders.project_id = p_project_id 
        AND orders.order_number = trim(p_order_number);
    END IF;
    
    IF target_order_id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;
    
    -- Retornar detalles de la orden
    RETURN QUERY
    SELECT 
        o.id, o.order_number, o.project_id, o.customer_id,
        CASE WHEN p_include_customer THEN
            jsonb_build_object(
                'id', c.id,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'full_name', c.first_name || ' ' || c.last_name,
                'email', c.email,
                'phone', c.phone
            )
        ELSE '{}'::jsonb END as customer_info,
        o.status, o.subtotal, o.discount_amount, o.tax_amount, o.tax_rate,
        o.shipping_cost, o.total_amount, o.payment_method, o.payment_status,
        o.shipping_method, o.shipping_status,
        CASE WHEN p_include_addresses AND o.shipping_address_id IS NOT NULL THEN
            jsonb_build_object(
                'id', sa.id,
                'type', sa.address_type,
                'address_line_1', sa.address_line_1,
                'address_line_2', sa.address_line_2,
                'city', sa.city,
                'state', sa.state,
                'country', sa.country,
                'postal_code', sa.postal_code
            )
        ELSE '{}'::jsonb END as shipping_address,
        CASE WHEN p_include_addresses AND o.billing_address_id IS NOT NULL THEN
            jsonb_build_object(
                'id', ba.id,
                'type', ba.address_type,
                'address_line_1', ba.address_line_1,
                'address_line_2', ba.address_line_2,
                'city', ba.city,
                'state', ba.state,
                'country', ba.country,
                'postal_code', ba.postal_code
            )
        ELSE '{}'::jsonb END as billing_address,
        o.notes,
        CASE WHEN p_include_items THEN
            COALESCE(items_json.items, '[]'::jsonb)
        ELSE '[]'::jsonb END as order_items,
        o.created_at, o.updated_at, o.shipped_at, o.delivered_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN customer_addresses sa ON o.shipping_address_id = sa.id
    LEFT JOIN customer_addresses ba ON o.billing_address_id = ba.id
    LEFT JOIN (
        SELECT 
            oi.order_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'variant_id', oi.variant_id,
                    'variant_name', pv.name,
                    'variant_sku', pv.sku,
                    'product_name', p.name,
                    'size', pv.size,
                    'color', pv.color,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                ) ORDER BY oi.created_at
            ) as items
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE p_include_items = true
        GROUP BY oi.order_id
    ) items_json ON o.id = items_json.order_id
    WHERE o.id = target_order_id;
    
END;
$$;

-- ================================================
-- 🔄 3. UPDATE ORDER STATUS
-- ================================================

CREATE OR REPLACE FUNCTION update_order_status(
    p_project_id UUID,
    p_order_id UUID,
    p_status TEXT,
    p_payment_status TEXT DEFAULT NULL,
    p_shipping_status TEXT DEFAULT NULL,
    p_shipping_cost DECIMAL(10,2) DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    order_number TEXT,
    old_status TEXT,
    new_status TEXT,
    payment_status TEXT,
    shipping_status TEXT,
    total_amount DECIMAL(12,2),
    inventory_updated BOOLEAN,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    current_order RECORD;
    inventory_success BOOLEAN := true;
    item_record RECORD;
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
    
    IF p_order_id IS NULL THEN
        RAISE EXCEPTION 'order_id es requerido';
    END IF;
    
    -- Validar estados
    IF p_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') THEN
        RAISE EXCEPTION 'Estado de orden inválido';
    END IF;
    
    IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('pending', 'authorized', 'paid', 'failed', 'refunded') THEN
        RAISE EXCEPTION 'Estado de pago inválido';
    END IF;
    
    IF p_shipping_status IS NOT NULL AND p_shipping_status NOT IN ('pending', 'preparing', 'shipped', 'in_transit', 'delivered', 'returned') THEN
        RAISE EXCEPTION 'Estado de envío inválido';
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
    
    -- Verificar permisos de gestión de órdenes
    IF NOT (user_permissions_json->>'can_manage_orders')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar órdenes';
    END IF;
    
    -- Obtener orden actual
    SELECT * INTO current_order
    FROM orders 
    WHERE id = p_order_id AND project_id = p_project_id;
    
    IF current_order IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada en este proyecto';
    END IF;
    
    -- Manejar cambios de inventario según el estado
    IF p_status = 'cancelled' AND current_order.status NOT IN ('cancelled', 'refunded') THEN
        -- Restaurar inventario cuando se cancela una orden
        FOR item_record IN 
            SELECT oi.variant_id, oi.quantity, p.track_inventory
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE oi.order_id = p_order_id
        LOOP
            IF item_record.track_inventory THEN
                BEGIN
                    PERFORM adjust_inventory(
                        p_project_id,
                        item_record.variant_id,
                        item_record.quantity, -- Cantidad positiva para devolver stock
                        NULL,
                        'order_cancellation',
                        p_order_id,
                        'order',
                        'Restauración automática por cancelación de orden'
                    );
                EXCEPTION WHEN OTHERS THEN
                    inventory_success := false;
                END;
            END IF;
        END LOOP;
    END IF;
    
    -- Actualizar la orden
    UPDATE orders SET
        status = p_status,
        payment_status = COALESCE(p_payment_status, payment_status),
        shipping_status = COALESCE(p_shipping_status, shipping_status),
        shipping_cost = COALESCE(p_shipping_cost, shipping_cost),
        total_amount = CASE 
            WHEN p_shipping_cost IS NOT NULL THEN 
                subtotal - discount_amount + tax_amount + p_shipping_cost
            ELSE total_amount
        END,
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        notes = CASE 
            WHEN p_notes IS NOT NULL THEN 
                COALESCE(notes, '') || CASE WHEN notes IS NOT NULL THEN E'\n---\n' ELSE '' END || trim(p_notes)
            ELSE notes
        END,
        shipped_at = CASE WHEN p_status = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN p_status = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
        updated_by = current_user_id,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Retornar información de la actualización
    RETURN QUERY
    SELECT 
        current_order.id,
        current_order.order_number,
        current_order.status as old_status,
        p_status as new_status,
        COALESCE(p_payment_status, current_order.payment_status) as payment_status,
        COALESCE(p_shipping_status, current_order.shipping_status) as shipping_status,
        CASE 
            WHEN p_shipping_cost IS NOT NULL THEN 
                current_order.subtotal - current_order.discount_amount + current_order.tax_amount + p_shipping_cost
            ELSE current_order.total_amount
        END as total_amount,
        inventory_success,
        NOW() as updated_at;
    
END;
$$;

-- ================================================
-- 📋 4. LIST ORDERS
-- ================================================

CREATE OR REPLACE FUNCTION list_orders(
    p_project_id UUID,
    p_customer_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_payment_status TEXT DEFAULT NULL,
    p_shipping_status TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_min_amount DECIMAL(12,2) DEFAULT NULL,
    p_max_amount DECIMAL(12,2) DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE(
    id UUID,
    order_number TEXT,
    project_id UUID,
    customer_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    status TEXT,
    subtotal DECIMAL(12,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    payment_method TEXT,
    payment_status TEXT,
    shipping_method TEXT,
    shipping_status TEXT,
    items_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    search_term TEXT;
    sort_column TEXT;
    sort_direction TEXT;
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
    
    -- Preparar término de búsqueda
    search_term := CASE 
        WHEN p_search IS NOT NULL AND trim(p_search) != '' 
        THEN '%' || lower(trim(p_search)) || '%'
        ELSE NULL 
    END;
    
    -- Validar y preparar ordenamiento
    sort_column := CASE 
        WHEN p_sort_by IN ('order_number', 'status', 'total_amount', 'created_at', 'updated_at', 'shipped_at', 'delivered_at') 
        THEN p_sort_by 
        ELSE 'created_at' 
    END;
    
    sort_direction := CASE 
        WHEN lower(p_sort_order) IN ('asc', 'desc') 
        THEN lower(p_sort_order) 
        ELSE 'desc' 
    END;
    
    -- Retornar órdenes con filtros aplicados
    RETURN QUERY EXECUTE format('
        WITH filtered_orders AS (
            SELECT 
                o.id, o.order_number, o.project_id, o.customer_id,
                (c.first_name || '' '' || c.last_name) as customer_name,
                c.email as customer_email,
                o.status, o.subtotal, o.discount_amount, o.tax_amount, 
                o.shipping_cost, o.total_amount, o.payment_method, o.payment_status,
                o.shipping_method, o.shipping_status,
                COALESCE(items_count.count, 0) as items_count,
                o.created_at, o.updated_at, o.shipped_at, o.delivered_at
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN (
                SELECT order_id, COUNT(*) as count
                FROM order_items 
                GROUP BY order_id
            ) items_count ON o.id = items_count.order_id
            WHERE o.project_id = $1
            AND ($2 IS NULL OR o.customer_id = $2)
            AND ($3 IS NULL OR o.status = $3)
            AND ($4 IS NULL OR o.payment_status = $4)
            AND ($5 IS NULL OR o.shipping_status = $5)
            AND ($6 IS NULL OR o.created_at >= $6)
            AND ($7 IS NULL OR o.created_at <= $7)
            AND ($8 IS NULL OR o.total_amount >= $8)
            AND ($9 IS NULL OR o.total_amount <= $9)
            AND ($10 IS NULL OR 
                 lower(o.order_number) LIKE $10 OR 
                 lower(c.first_name || '' '' || c.last_name) LIKE $10 OR
                 lower(c.email) LIKE $10 OR
                 lower(o.status) LIKE $10)
            ORDER BY %I %s, o.created_at DESC
        ),
        counted_orders AS (
            SELECT *, COUNT(*) OVER() as total_count
            FROM filtered_orders
        )
        SELECT * FROM counted_orders
        LIMIT $11 OFFSET $12', 
        sort_column, sort_direction
    ) USING p_project_id, p_customer_id, p_status, p_payment_status, p_shipping_status,
            p_start_date, p_end_date, p_min_amount, p_max_amount, search_term, p_limit, p_offset;
    
END;
$$;

-- ================================================
-- 📊 5. ORDER ANALYTICS
-- ================================================

CREATE OR REPLACE FUNCTION get_order_analytics(
    p_project_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_orders BIGINT,
    total_revenue DECIMAL(12,2),
    average_order_value DECIMAL(12,2),
    total_items_sold BIGINT,
    orders_by_status JSONB,
    orders_by_payment_status JSONB,
    top_customers JSONB,
    top_products JSONB,
    daily_sales JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    date_filter_start TIMESTAMPTZ;
    date_filter_end TIMESTAMPTZ;
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
    
    -- Establecer filtros de fecha (últimos 30 días por defecto)
    date_filter_start := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
    date_filter_end := COALESCE(p_end_date, NOW());
    
    -- Retornar analytics
    RETURN QUERY
    WITH base_orders AS (
        SELECT o.*, c.first_name, c.last_name, c.email
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.project_id = p_project_id
        AND o.created_at >= date_filter_start
        AND o.created_at <= date_filter_end
        AND (p_customer_id IS NULL OR o.customer_id = p_customer_id)
        AND o.status NOT IN ('cancelled', 'refunded')
    ),
    order_items_data AS (
        SELECT 
            oi.order_id, oi.variant_id, oi.quantity, oi.total_price,
            pv.name as variant_name, pv.sku, p.name as product_name
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN base_orders bo ON oi.order_id = bo.id
    )
    SELECT 
        COUNT(bo.id) as total_orders,
        COALESCE(SUM(bo.total_amount), 0) as total_revenue,
        COALESCE(AVG(bo.total_amount), 0) as average_order_value,
        COALESCE(SUM(oid.quantity), 0) as total_items_sold,
        
        -- Órdenes por estado
        (SELECT jsonb_object_agg(status, count)
         FROM (
             SELECT status, COUNT(*) as count
             FROM base_orders
             GROUP BY status
         ) status_counts) as orders_by_status,
        
        -- Órdenes por estado de pago
        (SELECT jsonb_object_agg(payment_status, count)
         FROM (
             SELECT payment_status, COUNT(*) as count
             FROM base_orders
             GROUP BY payment_status
         ) payment_counts) as orders_by_payment_status,
        
        -- Top clientes
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'customer_id', customer_id,
                 'customer_name', customer_name,
                 'orders', orders,
                 'total_spent', total_spent
             ) ORDER BY total_spent DESC
         )
         FROM (
             SELECT 
                 customer_id,
                 first_name || ' ' || last_name as customer_name,
                 COUNT(*) as orders,
                 SUM(total_amount) as total_spent
             FROM base_orders
             GROUP BY customer_id, first_name, last_name
             ORDER BY total_spent DESC
             LIMIT 10
         ) top_customers_data) as top_customers,
        
        -- Top productos
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'product_name', product_name,
                 'variant_name', variant_name,
                 'sku', sku,
                 'quantity_sold', quantity_sold,
                 'revenue', revenue
             ) ORDER BY quantity_sold DESC
         )
         FROM (
             SELECT 
                 product_name, variant_name, sku,
                 SUM(quantity) as quantity_sold,
                 SUM(total_price) as revenue
             FROM order_items_data
             GROUP BY product_name, variant_name, sku
             ORDER BY quantity_sold DESC
             LIMIT 10
         ) top_products_data) as top_products,
        
        -- Ventas diarias
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'date', sale_date,
                 'orders', orders,
                 'revenue', revenue
             ) ORDER BY sale_date
         )
         FROM (
             SELECT 
                 DATE(created_at) as sale_date,
                 COUNT(*) as orders,
                 SUM(total_amount) as revenue
             FROM base_orders
             GROUP BY DATE(created_at)
             ORDER BY sale_date
         ) daily_sales_data) as daily_sales
        
    FROM base_orders bo
    LEFT JOIN order_items_data oid ON bo.id = oid.order_id;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_order IS 'Crea una orden completa con items, validaciones de stock y reserva de inventario';
COMMENT ON FUNCTION get_order_details IS 'Obtiene detalles completos de una orden con items, cliente y direcciones';
COMMENT ON FUNCTION update_order_status IS 'Actualiza estado de orden con manejo automático de inventario';
COMMENT ON FUNCTION list_orders IS 'Lista órdenes con filtros avanzados y estadísticas';
COMMENT ON FUNCTION get_order_analytics IS 'Genera analytics completos de órdenes y ventas';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_order TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_details TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION list_orders TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_analytics TO authenticated;

-- ================================================
-- ✅ FUNCIONES ORDERS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_order() - Crear orden completa con validaciones de stock y reserva automática
-- ✅ get_order_details() - Obtener detalles completos con items, cliente y direcciones
-- ✅ update_order_status() - Actualizar estado con manejo automático de inventario
-- ✅ list_orders() - Listar órdenes con filtros avanzados y paginación
-- ✅ get_order_analytics() - Analytics completos de ventas y rendimiento

/*
EJEMPLOS DE USO:

-- Crear orden completa
SELECT * FROM create_order(
    'uuid-proyecto',
    'uuid-cliente',
    '[
        {"variant_id": "uuid-variante-1", "quantity": 2},
        {"variant_id": "uuid-variante-2", "quantity": 1}
    ]'::jsonb,
    'uuid-direccion-envio',
    'uuid-direccion-facturacion',
    'card',
    'express',
    'Entregar en horario de oficina',
    5.00,
    0.16
);

-- Obtener detalles completos de orden
SELECT * FROM get_order_details(
    'uuid-proyecto',
    p_order_id := 'uuid-orden',
    p_include_items := true,
    p_include_customer := true,
    p_include_addresses := true
);

-- Actualizar estado a enviado
SELECT * FROM update_order_status(
    'uuid-proyecto',
    'uuid-orden',
    'shipped',
    'paid',
    'shipped',
    15.00,
    'TRACK123456789',
    'Enviado con FedEx Express'
);

-- Listar órdenes pendientes
SELECT * FROM list_orders(
    'uuid-proyecto',
    p_status := 'pending',
    p_sort_by := 'created_at',
    p_sort_order := 'desc'
);

-- Obtener analytics de ventas del último mes
SELECT * FROM get_order_analytics(
    'uuid-proyecto',
    NOW() - INTERVAL '30 days',
    NOW()
);
*/