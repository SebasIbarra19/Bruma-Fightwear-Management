-- ================================================
-- 📊 STORED PROCEDURES - UTILITIES & REPORTS
-- Funciones de utilidad y reportes del sistema
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS de todos los scripts anteriores
-- Este script contiene funciones de utilidad y reportes generales

-- ================================================
-- 📈 1. DASHBOARD STATS
-- ================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_project_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_products BIGINT,
    total_customers BIGINT,
    total_orders BIGINT,
    total_revenue DECIMAL(12,2),
    pending_orders BIGINT,
    low_stock_items BIGINT,
    out_of_stock_items BIGINT,
    top_selling_products JSONB,
    recent_orders JSONB,
    revenue_trend JSONB,
    inventory_value DECIMAL(12,2),
    customer_growth JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    date_filter TIMESTAMPTZ;
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
    
    -- Calcular fecha de filtro
    date_filter := NOW() - (p_days_back || ' days')::INTERVAL;
    
    -- Retornar estadísticas del dashboard
    RETURN QUERY
    SELECT 
        -- Totales generales
        (SELECT COUNT(*) FROM products WHERE project_id = p_project_id AND is_active = true) as total_products,
        (SELECT COUNT(*) FROM customers WHERE project_id = p_project_id AND is_active = true) as total_customers,
        (SELECT COUNT(*) FROM orders WHERE project_id = p_project_id AND created_at >= date_filter) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE project_id = p_project_id AND created_at >= date_filter 
         AND status NOT IN ('cancelled', 'refunded')) as total_revenue,
        
        -- Órdenes pendientes
        (SELECT COUNT(*) FROM orders 
         WHERE project_id = p_project_id AND status IN ('pending', 'confirmed', 'processing')) as pending_orders,
        
        -- Stock bajo y agotado
        (SELECT COUNT(*) FROM inventory i
         JOIN product_variants pv ON i.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE p.project_id = p_project_id AND p.track_inventory = true 
         AND i.quantity_available <= i.reorder_level AND i.quantity_available > 0) as low_stock_items,
        
        (SELECT COUNT(*) FROM inventory i
         JOIN product_variants pv ON i.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE p.project_id = p_project_id AND p.track_inventory = true 
         AND i.quantity_available = 0) as out_of_stock_items,
        
        -- Top productos más vendidos
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'product_name', product_name,
                 'variant_name', variant_name,
                 'quantity_sold', quantity_sold,
                 'revenue', revenue
             )
         )
         FROM (
             SELECT 
                 p.name as product_name,
                 pv.name as variant_name,
                 SUM(oi.quantity) as quantity_sold,
                 SUM(oi.total_price) as revenue
             FROM order_items oi
             JOIN product_variants pv ON oi.variant_id = pv.id
             JOIN products p ON pv.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE p.project_id = p_project_id 
             AND o.created_at >= date_filter
             AND o.status NOT IN ('cancelled', 'refunded')
             GROUP BY p.name, pv.name
             ORDER BY quantity_sold DESC
             LIMIT 5
         ) top_products) as top_selling_products,
        
        -- Órdenes recientes
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'id', id,
                 'order_number', order_number,
                 'customer_name', customer_name,
                 'total_amount', total_amount,
                 'status', status,
                 'created_at', created_at
             )
         )
         FROM (
             SELECT 
                 o.id, o.order_number, o.total_amount, o.status, o.created_at,
                 (c.first_name || ' ' || c.last_name) as customer_name
             FROM orders o
             JOIN customers c ON o.customer_id = c.id
             WHERE o.project_id = p_project_id
             ORDER BY o.created_at DESC
             LIMIT 5
         ) recent_orders) as recent_orders,
        
        -- Tendencia de ingresos (últimos 7 días)
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'date', sale_date,
                 'revenue', revenue
             ) ORDER BY sale_date
         )
         FROM (
             SELECT 
                 DATE(created_at) as sale_date,
                 COALESCE(SUM(total_amount), 0) as revenue
             FROM orders
             WHERE project_id = p_project_id 
             AND created_at >= NOW() - INTERVAL '7 days'
             AND status NOT IN ('cancelled', 'refunded')
             GROUP BY DATE(created_at)
             ORDER BY sale_date
         ) revenue_trend) as revenue_trend,
        
        -- Valor del inventario
        (SELECT COALESCE(SUM(i.quantity_available * i.average_cost), 0)
         FROM inventory i
         JOIN product_variants pv ON i.variant_id = pv.id
         JOIN products p ON pv.product_id = p.id
         WHERE p.project_id = p_project_id AND p.track_inventory = true) as inventory_value,
        
        -- Crecimiento de clientes (últimos 6 meses)
        (SELECT jsonb_agg(
             jsonb_build_object(
                 'month', month_year,
                 'new_customers', new_customers
             ) ORDER BY month_year
         )
         FROM (
             SELECT 
                 TO_CHAR(created_at, 'YYYY-MM') as month_year,
                 COUNT(*) as new_customers
             FROM customers
             WHERE project_id = p_project_id 
             AND created_at >= NOW() - INTERVAL '6 months'
             GROUP BY TO_CHAR(created_at, 'YYYY-MM')
             ORDER BY month_year
         ) customer_growth) as customer_growth;
    
END;
$$;

-- ================================================
-- 📋 2. INVENTORY REPORT
-- ================================================

CREATE OR REPLACE FUNCTION generate_inventory_report(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_low_stock_only BOOLEAN DEFAULT false,
    p_include_movements BOOLEAN DEFAULT false
)
RETURNS TABLE(
    product_name TEXT,
    variant_name TEXT,
    sku TEXT,
    category_name TEXT,
    current_stock INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    last_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2),
    stock_value DECIMAL(12,2),
    stock_status TEXT,
    location TEXT,
    recent_movements JSONB,
    last_movement_date TIMESTAMPTZ
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
    
    -- Retornar reporte de inventario
    RETURN QUERY
    SELECT 
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        COALESCE(c.name, 'Sin Categoría') as category_name,
        i.quantity_available as current_stock,
        i.reorder_level,
        i.reorder_quantity,
        i.last_cost,
        i.average_cost,
        (i.quantity_available * i.average_cost) as stock_value,
        CASE 
            WHEN i.quantity_available = 0 THEN 'out_of_stock'
            WHEN i.quantity_available <= i.reorder_level THEN 'low_stock'
            WHEN i.quantity_available <= (i.reorder_level * 2) THEN 'normal'
            ELSE 'high_stock'
        END as stock_status,
        i.location,
        CASE WHEN p_include_movements THEN
            COALESCE(movements.recent_movements, '[]'::jsonb)
        ELSE '[]'::jsonb END as recent_movements,
        movements.last_movement_date
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN (
        SELECT 
            im.inventory_id,
            jsonb_agg(
                jsonb_build_object(
                    'date', im.created_at,
                    'type', im.movement_type,
                    'quantity', im.quantity,
                    'reference_type', im.reference_type,
                    'notes', im.notes
                ) ORDER BY im.created_at DESC
            ) as recent_movements,
            MAX(im.created_at) as last_movement_date
        FROM inventory_movements im
        WHERE p_include_movements = true
        GROUP BY im.inventory_id
    ) movements ON i.id = movements.inventory_id
    WHERE p.project_id = p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (p_category_id IS NULL OR c.id = p_category_id)
    AND (p_low_stock_only = false OR i.quantity_available <= i.reorder_level)
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
-- 💰 3. SALES REPORT
-- ================================================

CREATE OR REPLACE FUNCTION generate_sales_report(
    p_project_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_group_by TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    p_include_details BOOLEAN DEFAULT false
)
RETURNS TABLE(
    period TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    total_orders BIGINT,
    total_items BIGINT,
    gross_revenue DECIMAL(12,2),
    discounts DECIMAL(12,2),
    taxes DECIMAL(12,2),
    shipping DECIMAL(12,2),
    net_revenue DECIMAL(12,2),
    average_order_value DECIMAL(12,2),
    top_products JSONB,
    customer_breakdown JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    date_format TEXT;
    date_trunc_format TEXT;
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
    
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'start_date y end_date son requeridos';
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
    
    -- Configurar formato de agrupación
    CASE p_group_by
        WHEN 'daily' THEN
            date_format := 'YYYY-MM-DD';
            date_trunc_format := 'day';
        WHEN 'weekly' THEN
            date_format := 'YYYY-"W"WW';
            date_trunc_format := 'week';
        WHEN 'monthly' THEN
            date_format := 'YYYY-MM';
            date_trunc_format := 'month';
        ELSE
            RAISE EXCEPTION 'group_by inválido. Use: daily, weekly, monthly';
    END CASE;
    
    -- Retornar reporte de ventas
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            DATE_TRUNC(date_trunc_format, o.created_at) as period_date,
            TO_CHAR(o.created_at, date_format) as period_label,
            o.id as order_id,
            o.subtotal,
            o.discount_amount,
            o.tax_amount,
            o.shipping_cost,
            o.total_amount,
            c.first_name || ' ' || c.last_name as customer_name,
            c.id as customer_id
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.project_id = p_project_id
        AND o.created_at >= p_start_date
        AND o.created_at <= p_end_date
        AND o.status NOT IN ('cancelled', 'refunded')
    ),
    period_sales AS (
        SELECT 
            period_label,
            period_date,
            COUNT(DISTINCT order_id) as total_orders,
            SUM(subtotal) as gross_revenue,
            SUM(discount_amount) as discounts,
            SUM(tax_amount) as taxes,
            SUM(shipping_cost) as shipping,
            SUM(total_amount) as net_revenue,
            AVG(total_amount) as average_order_value
        FROM sales_data
        GROUP BY period_label, period_date
    ),
    period_items AS (
        SELECT 
            TO_CHAR(o.created_at, date_format) as period_label,
            SUM(oi.quantity) as total_items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.project_id = p_project_id
        AND o.created_at >= p_start_date
        AND o.created_at <= p_end_date
        AND o.status NOT IN ('cancelled', 'refunded')
        GROUP BY TO_CHAR(o.created_at, date_format)
    )
    SELECT 
        ps.period_label,
        ps.period_date as period_start,
        CASE 
            WHEN date_trunc_format = 'day' THEN ps.period_date + INTERVAL '1 day' - INTERVAL '1 second'
            WHEN date_trunc_format = 'week' THEN ps.period_date + INTERVAL '1 week' - INTERVAL '1 second'
            WHEN date_trunc_format = 'month' THEN ps.period_date + INTERVAL '1 month' - INTERVAL '1 second'
        END as period_end,
        ps.total_orders,
        COALESCE(pi.total_items, 0) as total_items,
        ps.gross_revenue,
        ps.discounts,
        ps.taxes,
        ps.shipping,
        ps.net_revenue,
        ps.average_order_value,
        
        -- Top productos del período (si se incluyen detalles)
        CASE WHEN p_include_details THEN
            (SELECT jsonb_agg(
                 jsonb_build_object(
                     'product_name', product_name,
                     'quantity_sold', quantity_sold,
                     'revenue', revenue
                 )
             )
             FROM (
                 SELECT 
                     p.name as product_name,
                     SUM(oi.quantity) as quantity_sold,
                     SUM(oi.total_price) as revenue
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN product_variants pv ON oi.variant_id = pv.id
                 JOIN products p ON pv.product_id = p.id
                 WHERE o.project_id = p_project_id
                 AND TO_CHAR(o.created_at, date_format) = ps.period_label
                 AND o.status NOT IN ('cancelled', 'refunded')
                 GROUP BY p.name
                 ORDER BY quantity_sold DESC
                 LIMIT 3
             ) top_products_period)
        ELSE '[]'::jsonb END as top_products,
        
        -- Breakdown de clientes (si se incluyen detalles)
        CASE WHEN p_include_details THEN
            (SELECT jsonb_build_object(
                 'new_customers', new_customers,
                 'returning_customers', returning_customers,
                 'total_customers', total_customers
             )
             FROM (
                 SELECT 
                     COUNT(CASE WHEN first_order.period_label = ps.period_label THEN 1 END) as new_customers,
                     COUNT(CASE WHEN first_order.period_label != ps.period_label THEN 1 END) as returning_customers,
                     COUNT(DISTINCT sd.customer_id) as total_customers
                 FROM sales_data sd
                 JOIN (
                     SELECT 
                         customer_id,
                         MIN(TO_CHAR(created_at, date_format)) as period_label
                     FROM orders
                     WHERE project_id = p_project_id
                     GROUP BY customer_id
                 ) first_order ON sd.customer_id = first_order.customer_id
                 WHERE sd.period_label = ps.period_label
             ) customer_breakdown_period)
        ELSE '{}'::jsonb END as customer_breakdown
        
    FROM period_sales ps
    LEFT JOIN period_items pi ON ps.period_label = pi.period_label
    ORDER BY ps.period_date;
    
END;
$$;

-- ================================================
-- 🚨 4. LOW STOCK ALERT REPORT
-- ================================================

CREATE OR REPLACE FUNCTION get_low_stock_alert_report(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_urgent_only BOOLEAN DEFAULT false
)
RETURNS TABLE(
    alert_level TEXT,
    product_name TEXT,
    variant_name TEXT,
    sku TEXT,
    category_name TEXT,
    current_stock INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    suggested_order_quantity INTEGER,
    days_of_stock_remaining INTEGER,
    estimated_reorder_cost DECIMAL(12,2),
    supplier_info JSONB,
    location TEXT
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
    
    -- Retornar reporte de alertas de stock bajo
    RETURN QUERY
    WITH stock_velocity AS (
        SELECT 
            oi.variant_id,
            AVG(daily_sales.daily_quantity) as avg_daily_sales
        FROM (
            SELECT 
                oi.variant_id,
                DATE(o.created_at) as sale_date,
                SUM(oi.quantity) as daily_quantity
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.project_id = p_project_id
            AND o.created_at >= NOW() - INTERVAL '30 days'
            AND o.status NOT IN ('cancelled', 'refunded')
            GROUP BY oi.variant_id, DATE(o.created_at)
        ) daily_sales
        GROUP BY oi.variant_id
    )
    SELECT 
        CASE 
            WHEN i.quantity_available = 0 THEN 'critical'
            WHEN i.quantity_available <= (i.reorder_level / 2) THEN 'urgent'
            ELSE 'warning'
        END as alert_level,
        p.name as product_name,
        pv.name as variant_name,
        pv.sku,
        COALESCE(c.name, 'Sin Categoría') as category_name,
        i.quantity_available as current_stock,
        i.reorder_level,
        i.reorder_quantity,
        GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) as suggested_order_quantity,
        CASE 
            WHEN COALESCE(sv.avg_daily_sales, 0) > 0 THEN 
                FLOOR(i.quantity_available / sv.avg_daily_sales)
            ELSE 999
        END as days_of_stock_remaining,
        (GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available) * i.last_cost) as estimated_reorder_cost,
        COALESCE(supplier_info.supplier_data, '{}'::jsonb) as supplier_info,
        i.location
    FROM inventory i
    JOIN product_variants pv ON i.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stock_velocity sv ON pv.id = sv.variant_id
    LEFT JOIN (
        SELECT 
            p.id as product_id,
            jsonb_build_object(
                'name', s.name,
                'company_name', s.company_name,
                'email', s.email,
                'phone', s.phone,
                'payment_terms', s.payment_terms
            ) as supplier_data
        FROM products p
        LEFT JOIN suppliers s ON p.primary_supplier_id = s.id
        WHERE s.is_active = true
    ) supplier_info ON p.id = supplier_info.product_id
    WHERE p.project_id = p_project_id
    AND p.track_inventory = true
    AND p.is_active = true
    AND pv.is_active = true
    AND (p_category_id IS NULL OR c.id = p_category_id)
    AND i.quantity_available <= i.reorder_level
    AND (p_urgent_only = false OR i.quantity_available <= (i.reorder_level / 2))
    ORDER BY 
        CASE 
            WHEN i.quantity_available = 0 THEN 1
            WHEN i.quantity_available <= (i.reorder_level / 2) THEN 2
            ELSE 3
        END,
        COALESCE(sv.avg_daily_sales, 0) DESC,
        p.name, pv.name;
    
END;
$$;

-- ================================================
-- 📧 5. SYSTEM NOTIFICATIONS
-- ================================================

CREATE OR REPLACE FUNCTION get_system_notifications(
    p_project_id UUID,
    p_notification_types TEXT[] DEFAULT ARRAY['stock', 'orders', 'system'],
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    severity TEXT,
    data JSONB,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    notifications JSONB := '[]'::jsonb;
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
    
    -- Generar notificaciones dinámicas
    
    -- Notificaciones de stock bajo
    IF 'stock' = ANY(p_notification_types) THEN
        INSERT INTO notifications (
            SELECT 
                gen_random_uuid(),
                'stock' as type,
                'Stock Bajo: ' || p.name as title,
                'El producto ' || p.name || ' (' || pv.sku || ') tiene stock bajo. Actual: ' || 
                i.quantity_available || ', Nivel de reorden: ' || i.reorder_level as message,
                CASE 
                    WHEN i.quantity_available = 0 THEN 'critical'
                    WHEN i.quantity_available <= (i.reorder_level / 2) THEN 'high'
                    ELSE 'medium'
                END as severity,
                jsonb_build_object(
                    'product_id', p.id,
                    'variant_id', pv.id,
                    'current_stock', i.quantity_available,
                    'reorder_level', i.reorder_level,
                    'suggested_quantity', GREATEST(i.reorder_quantity, i.reorder_level - i.quantity_available)
                ) as data,
                false as is_read,
                NOW() as created_at
            FROM inventory i
            JOIN product_variants pv ON i.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE p.project_id = p_project_id
            AND p.track_inventory = true
            AND i.quantity_available <= i.reorder_level
            AND p.is_active = true
            AND pv.is_active = true
        );
    END IF;
    
    -- Notificaciones de órdenes pendientes
    IF 'orders' = ANY(p_notification_types) THEN
        INSERT INTO notifications (
            SELECT 
                gen_random_uuid(),
                'orders' as type,
                'Órdenes Pendientes' as title,
                COUNT(*) || ' órdenes requieren atención' as message,
                CASE 
                    WHEN COUNT(*) >= 10 THEN 'high'
                    WHEN COUNT(*) >= 5 THEN 'medium'
                    ELSE 'low'
                END as severity,
                jsonb_build_object(
                    'pending_orders', COUNT(*),
                    'oldest_order', MIN(created_at)
                ) as data,
                false as is_read,
                NOW() as created_at
            FROM orders
            WHERE project_id = p_project_id
            AND status IN ('pending', 'confirmed')
            AND created_at <= NOW() - INTERVAL '24 hours'
            HAVING COUNT(*) > 0
        );
    END IF;
    
    -- Seleccionar y retornar notificaciones
    RETURN QUERY
    SELECT 
        n.id, n.type, n.title, n.message, n.severity, n.data, n.is_read, n.created_at
    FROM notifications n
    WHERE n.type = ANY(p_notification_types)
    ORDER BY 
        CASE n.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            ELSE 4
        END,
        n.created_at DESC
    LIMIT p_limit;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION get_dashboard_stats IS 'Genera estadísticas completas para el dashboard principal';
COMMENT ON FUNCTION generate_inventory_report IS 'Genera reporte detallado de inventario con movimientos';
COMMENT ON FUNCTION generate_sales_report IS 'Genera reporte de ventas con agrupación configurable';
COMMENT ON FUNCTION get_low_stock_alert_report IS 'Genera reporte de alertas de stock bajo con predicciones';
COMMENT ON FUNCTION get_system_notifications IS 'Genera notificaciones del sistema dinámicamente';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION generate_inventory_report TO authenticated;
GRANT EXECUTE ON FUNCTION generate_sales_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_alert_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_notifications TO authenticated;

-- ================================================
-- ✅ FUNCIONES UTILITIES & REPORTS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ get_dashboard_stats() - Estadísticas completas del dashboard con métricas clave
-- ✅ generate_inventory_report() - Reporte detallado de inventario con movimientos
-- ✅ generate_sales_report() - Reporte de ventas con agrupación temporal configurable
-- ✅ get_low_stock_alert_report() - Alertas de stock bajo con predicciones inteligentes
-- ✅ get_system_notifications() - Sistema de notificaciones dinámicas

/*
EJEMPLOS DE USO:

-- Dashboard stats de los últimos 30 días
SELECT * FROM get_dashboard_stats(
    'uuid-proyecto',
    30
);

-- Reporte de inventario con stock bajo
SELECT * FROM generate_inventory_report(
    'uuid-proyecto',
    p_low_stock_only := true,
    p_include_movements := true
);

-- Reporte de ventas mensual
SELECT * FROM generate_sales_report(
    'uuid-proyecto',
    '2024-01-01'::timestamptz,
    '2024-12-31'::timestamptz,
    'monthly',
    true
);

-- Alertas de stock crítico
SELECT * FROM get_low_stock_alert_report(
    'uuid-proyecto',
    p_urgent_only := true
);

-- Notificaciones del sistema
SELECT * FROM get_system_notifications(
    'uuid-proyecto',
    ARRAY['stock', 'orders'],
    20
);
*/