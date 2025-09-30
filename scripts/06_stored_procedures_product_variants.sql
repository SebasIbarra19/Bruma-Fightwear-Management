-- ================================================
-- 🎨 STORED PROCEDURES - PRODUCT VARIANTS
-- Funciones para gestión completa de variantes de productos
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene todos los CRUD básicos para la tabla product_variants

-- ================================================
-- 📝 1. CREATE PRODUCT VARIANT
-- ================================================

CREATE OR REPLACE FUNCTION create_product_variant(
    p_project_id UUID,
    p_product_id UUID,
    p_name TEXT,
    p_sku TEXT,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_material TEXT DEFAULT NULL,
    p_price_adjustment DECIMAL(10,2) DEFAULT 0,
    p_cost_adjustment DECIMAL(10,2) DEFAULT 0,
    p_weight_adjustment INTEGER DEFAULT 0,
    p_barcode TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true,
    p_sort_order INTEGER DEFAULT NULL,
    p_initial_stock INTEGER DEFAULT 0,
    p_initial_cost DECIMAL(10,2) DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    name TEXT,
    sku TEXT,
    size TEXT,
    color TEXT,
    material TEXT,
    price_adjustment DECIMAL(10,2),
    cost_adjustment DECIMAL(10,2),
    weight_adjustment INTEGER,
    barcode TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    inventory_created BOOLEAN,
    initial_stock_qty INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    product_record RECORD;
    new_variant_id UUID;
    new_sort_order INTEGER;
    inventory_created_flag BOOLEAN := false;
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
    
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'product_id es requerido';
    END IF;
    
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'El nombre de la variante es requerido';
    END IF;
    
    IF p_sku IS NULL OR trim(p_sku) = '' THEN
        RAISE EXCEPTION 'El SKU de la variante es requerido';
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
    
    -- Verificar permisos de gestión de productos
    IF NOT (user_permissions_json->>'can_manage_products')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar productos';
    END IF;
    
    -- Verificar que el producto existe y pertenece al proyecto
    SELECT * INTO product_record
    FROM products 
    WHERE id = p_product_id AND project_id = p_project_id AND is_active = true;
    
    IF product_record IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado o inactivo en este proyecto';
    END IF;
    
    -- Verificar que el SKU sea único globalmente en el proyecto
    IF EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.project_id = p_project_id AND pv.sku = upper(trim(p_sku))
    ) THEN
        RAISE EXCEPTION 'Ya existe una variante con el SKU "%" en este proyecto', p_sku;
    END IF;
    
    -- Verificar que el SKU tampoco exista en productos base
    IF EXISTS (
        SELECT 1 FROM products 
        WHERE project_id = p_project_id AND sku = upper(trim(p_sku))
    ) THEN
        RAISE EXCEPTION 'Ya existe un producto con el SKU "%" en este proyecto', p_sku;
    END IF;
    
    -- Determinar sort_order si no se proporciona
    IF p_sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        INTO new_sort_order
        FROM product_variants 
        WHERE product_id = p_product_id;
    ELSE
        new_sort_order := p_sort_order;
    END IF;
    
    -- Insertar la nueva variante
    INSERT INTO product_variants (
        product_id, name, sku, size, color, material,
        price_adjustment, cost_adjustment, weight_adjustment,
        barcode, is_active, sort_order
    ) VALUES (
        p_product_id,
        trim(p_name), 
        upper(trim(p_sku)), 
        trim(p_size),
        trim(p_color),
        trim(p_material),
        p_price_adjustment,
        p_cost_adjustment,
        p_weight_adjustment,
        trim(p_barcode),
        p_is_active,
        new_sort_order
    )
    RETURNING id INTO new_variant_id;
    
    -- Crear inventario inicial si se solicita
    IF p_initial_stock > 0 AND product_record.track_inventory THEN
        INSERT INTO inventory (
            project_id, product_id, variant_id, sku, 
            quantity_available, reorder_level, reorder_quantity,
            last_cost, average_cost, location
        ) VALUES (
            p_project_id, p_product_id, new_variant_id, upper(trim(p_sku)),
            p_initial_stock, 3, 10,
            COALESCE(p_initial_cost, product_record.base_cost + p_cost_adjustment),
            COALESCE(p_initial_cost, product_record.base_cost + p_cost_adjustment),
            'Almacén Principal'
        );
        
        -- Registrar movimiento de inventario inicial
        INSERT INTO inventory_movements (
            project_id, inventory_id, movement_type, quantity, unit_cost, total_cost,
            reference_type, notes, created_by
        ) VALUES (
            p_project_id,
            (SELECT id FROM inventory WHERE variant_id = new_variant_id),
            'in',
            p_initial_stock,
            COALESCE(p_initial_cost, product_record.base_cost + p_cost_adjustment),
            p_initial_stock * COALESCE(p_initial_cost, product_record.base_cost + p_cost_adjustment),
            'initial_stock',
            'Stock inicial para variante ' || trim(p_name),
            current_user_id
        );
        
        inventory_created_flag := true;
    END IF;
    
    -- Retornar la variante creada
    RETURN QUERY
    SELECT 
        pv.id, pv.product_id, pv.name, pv.sku, pv.size, pv.color, pv.material,
        pv.price_adjustment, pv.cost_adjustment, pv.weight_adjustment,
        pv.barcode, pv.is_active, pv.sort_order,
        pv.created_at, pv.updated_at,
        inventory_created_flag,
        p_initial_stock
    FROM product_variants pv
    WHERE pv.id = new_variant_id;
    
END;
$$;

-- ================================================
-- 🔍 2. GET PRODUCT VARIANT
-- ================================================

CREATE OR REPLACE FUNCTION get_product_variant(
    p_project_id UUID,
    p_variant_id UUID DEFAULT NULL,
    p_sku TEXT DEFAULT NULL,
    p_include_inventory BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    category_name TEXT,
    name TEXT,
    sku TEXT,
    size TEXT,
    color TEXT,
    material TEXT,
    price_adjustment DECIMAL(10,2),
    cost_adjustment DECIMAL(10,2),
    weight_adjustment INTEGER,
    final_price DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    final_weight INTEGER,
    barcode TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    stock_quantity INTEGER,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    location TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_variant_id UUID;
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
    
    IF p_variant_id IS NULL AND (p_sku IS NULL OR trim(p_sku) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar variant_id o sku';
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
    
    -- Obtener el ID de la variante
    IF p_variant_id IS NOT NULL THEN
        target_variant_id := p_variant_id;
    ELSE
        SELECT pv.id INTO target_variant_id 
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.project_id = p_project_id 
        AND pv.sku = upper(trim(p_sku));
        
        IF target_variant_id IS NULL THEN
            RAISE EXCEPTION 'Variante con SKU "%" no encontrada', p_sku;
        END IF;
    END IF;
    
    -- Retornar la variante con información completa
    RETURN QUERY
    SELECT 
        pv.id, pv.product_id, p.name as product_name, p.sku as product_sku,
        c.name as category_name,
        pv.name, pv.sku, pv.size, pv.color, pv.material,
        pv.price_adjustment, pv.cost_adjustment, pv.weight_adjustment,
        (p.base_price + pv.price_adjustment) as final_price,
        (p.base_cost + pv.cost_adjustment) as final_cost,
        (COALESCE(p.weight, 0) + pv.weight_adjustment) as final_weight,
        pv.barcode, pv.is_active, pv.sort_order,
        CASE WHEN p_include_inventory THEN COALESCE(i.quantity_available, 0) ELSE NULL END as stock_quantity,
        CASE WHEN p_include_inventory THEN i.reorder_level ELSE NULL END as reorder_level,
        CASE WHEN p_include_inventory THEN i.reorder_quantity ELSE NULL END as reorder_quantity,
        CASE WHEN p_include_inventory THEN i.location ELSE NULL END as location,
        pv.created_at, pv.updated_at
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON pv.id = i.variant_id AND p_include_inventory = true
    WHERE pv.id = target_variant_id
    AND p.project_id = p_project_id;
    
END;
$$;

-- ================================================
-- ✏️ 3. UPDATE PRODUCT VARIANT
-- ================================================

CREATE OR REPLACE FUNCTION update_product_variant(
    p_project_id UUID,
    p_variant_id UUID,
    p_name TEXT DEFAULT NULL,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_material TEXT DEFAULT NULL,
    p_price_adjustment DECIMAL(10,2) DEFAULT NULL,
    p_cost_adjustment DECIMAL(10,2) DEFAULT NULL,
    p_weight_adjustment INTEGER DEFAULT NULL,
    p_barcode TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    name TEXT,
    sku TEXT,
    size TEXT,
    color TEXT,
    material TEXT,
    price_adjustment DECIMAL(10,2),
    cost_adjustment DECIMAL(10,2),
    weight_adjustment INTEGER,
    barcode TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
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
    
    IF p_variant_id IS NULL THEN
        RAISE EXCEPTION 'variant_id es requerido';
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
    
    -- Verificar permisos de gestión de productos
    IF NOT (user_permissions_json->>'can_manage_products')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar productos';
    END IF;
    
    -- Validar que la variante pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = p_variant_id AND p.project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Variante no encontrada en este proyecto';
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE product_variants SET
        name = COALESCE(trim(p_name), name),
        size = COALESCE(trim(p_size), size),
        color = COALESCE(trim(p_color), color),
        material = COALESCE(trim(p_material), material),
        price_adjustment = COALESCE(p_price_adjustment, price_adjustment),
        cost_adjustment = COALESCE(p_cost_adjustment, cost_adjustment),
        weight_adjustment = COALESCE(p_weight_adjustment, weight_adjustment),
        barcode = COALESCE(trim(p_barcode), barcode),
        is_active = COALESCE(p_is_active, is_active),
        sort_order = COALESCE(p_sort_order, sort_order),
        updated_at = NOW()
    WHERE id = p_variant_id;
    
    -- Verificar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante con ID "%" no encontrada', p_variant_id;
    END IF;
    
    -- Actualizar costo promedio en inventario si cambió el costo
    IF p_cost_adjustment IS NOT NULL THEN
        UPDATE inventory SET
            last_cost = (
                SELECT p.base_cost + pv.cost_adjustment 
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = p_variant_id
            ),
            updated_at = NOW()
        WHERE variant_id = p_variant_id;
    END IF;
    
    -- Retornar la variante actualizada
    RETURN QUERY
    SELECT 
        pv.id, pv.product_id, pv.name, pv.sku, pv.size, pv.color, pv.material,
        pv.price_adjustment, pv.cost_adjustment, pv.weight_adjustment,
        pv.barcode, pv.is_active, pv.sort_order,
        pv.created_at, pv.updated_at
    FROM product_variants pv
    WHERE pv.id = p_variant_id;
    
END;
$$;

-- ================================================
-- 🗑️ 4. DELETE PRODUCT VARIANT
-- ================================================

CREATE OR REPLACE FUNCTION delete_product_variant(
    p_project_id UUID,
    p_variant_id UUID,
    p_force_delete BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    order_count INTEGER;
    current_stock INTEGER;
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
    
    -- Verificar permisos de gestión de productos
    IF NOT (user_permissions_json->>'can_manage_products')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar productos';
    END IF;
    
    -- Validar que la variante pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = p_variant_id AND p.project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Variante no encontrada en este proyecto';
    END IF;
    
    -- Verificar dependencias si no es eliminación forzada
    IF NOT p_force_delete THEN
        -- Contar órdenes con esta variante
        SELECT COUNT(*) INTO order_count
        FROM order_items 
        WHERE variant_id = p_variant_id;
        
        -- Verificar stock actual
        SELECT COALESCE(quantity_available, 0) INTO current_stock
        FROM inventory 
        WHERE variant_id = p_variant_id;
        
        IF order_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la variante porque aparece en % órdenes. Use force_delete=true para proceder.', order_count;
        END IF;
        
        IF current_stock > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la variante porque tiene % unidades en stock. Use force_delete=true para proceder.', current_stock;
        END IF;
    END IF;
    
    -- Si es eliminación forzada o no hay impedimentos, proceder
    IF p_force_delete OR (order_count = 0 AND current_stock = 0) THEN
        -- Eliminar movimientos de inventario
        DELETE FROM inventory_movements 
        WHERE inventory_id IN (
            SELECT id FROM inventory WHERE variant_id = p_variant_id
        );
        
        -- Eliminar inventario
        DELETE FROM inventory WHERE variant_id = p_variant_id;
        
        -- Note: No eliminamos order_items porque las órdenes históricas deben mantenerse
        -- Si hay órdenes históricas, solo marcamos como inactiva
        IF order_count > 0 THEN
            UPDATE product_variants SET 
                is_active = false,
                updated_at = NOW()
            WHERE id = p_variant_id;
            
            RETURN true;
        END IF;
    END IF;
    
    -- Eliminar la variante
    DELETE FROM product_variants WHERE id = p_variant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante con ID "%" no encontrada', p_variant_id;
    END IF;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 📋 5. LIST PRODUCT VARIANTS
-- ================================================

CREATE OR REPLACE FUNCTION list_product_variants(
    p_project_id UUID,
    p_product_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_is_active BOOLEAN DEFAULT NULL,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_low_stock BOOLEAN DEFAULT false,
    p_search TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'sort_order',
    p_sort_order TEXT DEFAULT 'asc'
)
RETURNS TABLE(
    id UUID,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    category_name TEXT,
    name TEXT,
    sku TEXT,
    size TEXT,
    color TEXT,
    material TEXT,
    price_adjustment DECIMAL(10,2),
    cost_adjustment DECIMAL(10,2),
    weight_adjustment INTEGER,
    final_price DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    final_weight INTEGER,
    barcode TEXT,
    is_active BOOLEAN,
    sort_order INTEGER,
    stock_quantity INTEGER,
    reorder_level INTEGER,
    location TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
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
        WHEN p_sort_by IN ('name', 'sku', 'size', 'color', 'final_price', 'sort_order', 'created_at', 'updated_at') 
        THEN p_sort_by 
        ELSE 'sort_order' 
    END;
    
    sort_direction := CASE 
        WHEN lower(p_sort_order) IN ('asc', 'desc') 
        THEN lower(p_sort_order) 
        ELSE 'asc' 
    END;
    
    -- Retornar variantes con filtros aplicados
    RETURN QUERY EXECUTE format('
        WITH filtered_variants AS (
            SELECT 
                pv.id, pv.product_id, p.name as product_name, p.sku as product_sku,
                c.name as category_name,
                pv.name, pv.sku, pv.size, pv.color, pv.material,
                pv.price_adjustment, pv.cost_adjustment, pv.weight_adjustment,
                (p.base_price + pv.price_adjustment) as final_price,
                (p.base_cost + pv.cost_adjustment) as final_cost,
                (COALESCE(p.weight, 0) + pv.weight_adjustment) as final_weight,
                pv.barcode, pv.is_active, pv.sort_order,
                COALESCE(i.quantity_available, 0) as stock_quantity,
                i.reorder_level, i.location,
                pv.created_at, pv.updated_at
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON pv.id = i.variant_id
            WHERE p.project_id = $1
            AND ($2 IS NULL OR pv.product_id = $2)
            AND ($3 IS NULL OR pv.is_active = $3)
            AND ($4 IS NULL OR pv.size = $4)
            AND ($5 IS NULL OR pv.color = $5)
            AND ($6 = false OR (p.track_inventory = true AND COALESCE(i.quantity_available, 0) <= COALESCE(i.reorder_level, 3)))
            AND ($7 IS NULL OR 
                 lower(pv.name) LIKE $7 OR 
                 lower(pv.sku) LIKE $7 OR
                 lower(pv.size) LIKE $7 OR
                 lower(pv.color) LIKE $7 OR
                 lower(p.name) LIKE $7)
            ORDER BY %I %s, pv.name ASC
        ),
        counted_variants AS (
            SELECT *, COUNT(*) OVER() as total_count
            FROM filtered_variants
        )
        SELECT * FROM counted_variants
        LIMIT $8 OFFSET $9', 
        sort_column, sort_direction
    ) USING p_project_id, p_product_id, p_is_active, p_size, p_color, 
            p_low_stock, search_term, p_limit, p_offset;
    
END;
$$;

-- ================================================
-- 🔄 6. BULK UPDATE VARIANTS
-- ================================================

CREATE OR REPLACE FUNCTION bulk_update_variants(
    p_project_id UUID,
    p_variant_updates JSONB -- [{"id": "uuid", "price_adjustment": 5.00, "is_active": true}, ...]
)
RETURNS TABLE(
    updated_count INTEGER,
    errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    variant_update JSONB;
    update_count INTEGER := 0;
    error_list JSONB := '[]'::jsonb;
    variant_id_val UUID;
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
    
    IF p_variant_updates IS NULL THEN
        RAISE EXCEPTION 'variant_updates es requerido';
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
    
    -- Verificar permisos de gestión de productos
    IF NOT (user_permissions_json->>'can_manage_products')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar productos';
    END IF;
    
    -- Procesar cada actualización
    FOR variant_update IN SELECT * FROM jsonb_array_elements(p_variant_updates)
    LOOP
        BEGIN
            variant_id_val := (variant_update->>'id')::UUID;
            
            -- Verificar que la variante pertenece al proyecto
            IF NOT EXISTS (
                SELECT 1 FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = variant_id_val AND p.project_id = p_project_id
            ) THEN
                error_list := error_list || jsonb_build_object(
                    'id', variant_id_val,
                    'error', 'Variante no encontrada en este proyecto'
                );
                CONTINUE;
            END IF;
            
            -- Actualizar la variante
            UPDATE product_variants SET
                name = COALESCE((variant_update->>'name')::TEXT, name),
                size = COALESCE((variant_update->>'size')::TEXT, size),
                color = COALESCE((variant_update->>'color')::TEXT, color),
                material = COALESCE((variant_update->>'material')::TEXT, material),
                price_adjustment = COALESCE((variant_update->>'price_adjustment')::DECIMAL(10,2), price_adjustment),
                cost_adjustment = COALESCE((variant_update->>'cost_adjustment')::DECIMAL(10,2), cost_adjustment),
                weight_adjustment = COALESCE((variant_update->>'weight_adjustment')::INTEGER, weight_adjustment),
                barcode = COALESCE((variant_update->>'barcode')::TEXT, barcode),
                is_active = COALESCE((variant_update->>'is_active')::BOOLEAN, is_active),
                sort_order = COALESCE((variant_update->>'sort_order')::INTEGER, sort_order),
                updated_at = NOW()
            WHERE id = variant_id_val;
            
            IF FOUND THEN
                update_count := update_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_list := error_list || jsonb_build_object(
                'id', variant_id_val,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT update_count, error_list;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_product_variant IS 'Crea una nueva variante de producto con inventario inicial opcional';
COMMENT ON FUNCTION get_product_variant IS 'Obtiene una variante por ID o SKU con información de inventario';
COMMENT ON FUNCTION update_product_variant IS 'Actualiza una variante existente y sincroniza inventario';
COMMENT ON FUNCTION delete_product_variant IS 'Elimina una variante manejando dependencias de órdenes e inventario';
COMMENT ON FUNCTION list_product_variants IS 'Lista variantes con filtros avanzados y información de inventario';
COMMENT ON FUNCTION bulk_update_variants IS 'Actualiza múltiples variantes en una sola operación';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_product_variant TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_variant TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_variant TO authenticated;
GRANT EXECUTE ON FUNCTION delete_product_variant TO authenticated;
GRANT EXECUTE ON FUNCTION list_product_variants TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_variants TO authenticated;

-- ================================================
-- ✅ FUNCIONES PRODUCT VARIANTS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_product_variant() - Crear variante con inventario inicial automático
-- ✅ get_product_variant() - Obtener variante por ID/SKU con precios finales calculados
-- ✅ update_product_variant() - Actualizar variante con sincronización de inventario
-- ✅ delete_product_variant() - Eliminar variante preservando historial de órdenes
-- ✅ list_product_variants() - Listar variantes con filtros avanzados y stock
-- ✅ bulk_update_variants() - Actualización masiva con manejo de errores

/*
EJEMPLOS DE USO:

-- Crear variante con inventario inicial
SELECT * FROM create_product_variant(
    'uuid-proyecto',
    'uuid-producto',
    'Rashguard Bruma - Negro - M',
    'RAS-BRU-N-M',
    'M',
    'Negro',
    'Lycra',
    0,
    0,
    0,
    null,
    true,
    3,
    10,
    30.00
);

-- Obtener variante con inventario
SELECT * FROM get_product_variant(
    'uuid-proyecto',
    p_sku := 'RAS-BRU-N-M',
    p_include_inventory := true
);

-- Listar variantes con filtros
SELECT * FROM list_product_variants(
    'uuid-proyecto',
    p_product_id := 'uuid-producto',
    p_color := 'Negro',
    p_low_stock := true
);

-- Actualización masiva de precios
SELECT * FROM bulk_update_variants(
    'uuid-proyecto',
    '[
        {"id": "uuid1", "price_adjustment": 5.00},
        {"id": "uuid2", "price_adjustment": 3.00},
        {"id": "uuid3", "is_active": false}
    ]'::jsonb
);
*/