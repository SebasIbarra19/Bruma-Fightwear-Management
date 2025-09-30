-- ================================================
-- 🎽 STORED PROCEDURES - PRODUCTS
-- Funciones para gestión completa de productos
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene todos los CRUD básicos para la tabla products

-- ================================================
-- 📝 1. CREATE PRODUCT
-- ================================================

CREATE OR REPLACE FUNCTION create_product(
    p_project_id UUID,
    p_name TEXT,
    p_slug TEXT,
    p_sku TEXT,
    p_category_id UUID DEFAULT NULL,
    p_product_line_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_short_description TEXT DEFAULT NULL,
    p_base_price DECIMAL(10,2) DEFAULT 0,
    p_base_cost DECIMAL(10,2) DEFAULT 0,
    p_weight INTEGER DEFAULT NULL,
    p_materials JSONB DEFAULT '[]',
    p_care_instructions TEXT DEFAULT NULL,
    p_tags JSONB DEFAULT '[]',
    p_track_inventory BOOLEAN DEFAULT true,
    p_continue_selling_when_out_of_stock BOOLEAN DEFAULT false,
    p_is_active BOOLEAN DEFAULT true,
    p_sort_order INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    category_id UUID,
    product_line_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    sku TEXT,
    base_price DECIMAL(10,2),
    base_cost DECIMAL(10,2),
    weight INTEGER,
    materials JSONB,
    care_instructions TEXT,
    tags JSONB,
    track_inventory BOOLEAN,
    continue_selling_when_out_of_stock BOOLEAN,
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
    new_sort_order INTEGER;
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
    
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'El nombre del producto es requerido';
    END IF;
    
    IF p_slug IS NULL OR trim(p_slug) = '' THEN
        RAISE EXCEPTION 'El slug del producto es requerido';
    END IF;
    
    IF p_sku IS NULL OR trim(p_sku) = '' THEN
        RAISE EXCEPTION 'El SKU del producto es requerido';
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
    
    -- Validar formato del slug
    IF p_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones';
    END IF;
    
    -- Verificar que el slug sea único en el proyecto
    IF EXISTS (
        SELECT 1 FROM products 
        WHERE project_id = p_project_id AND slug = lower(trim(p_slug))
    ) THEN
        RAISE EXCEPTION 'Ya existe un producto con el slug "%" en este proyecto', p_slug;
    END IF;
    
    -- Verificar que el SKU sea único en el proyecto
    IF EXISTS (
        SELECT 1 FROM products 
        WHERE project_id = p_project_id AND sku = upper(trim(p_sku))
    ) THEN
        RAISE EXCEPTION 'Ya existe un producto con el SKU "%" en este proyecto', p_sku;
    END IF;
    
    -- Validar categoría si se proporciona
    IF p_category_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE id = p_category_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Categoría no encontrada o inactiva';
        END IF;
    END IF;
    
    -- Validar línea de productos si se proporciona
    IF p_product_line_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM product_lines 
            WHERE id = p_product_line_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Línea de productos no encontrada o inactiva';
        END IF;
    END IF;
    
    -- Validar precios
    IF p_base_price < 0 THEN
        RAISE EXCEPTION 'El precio base no puede ser negativo';
    END IF;
    
    IF p_base_cost < 0 THEN
        RAISE EXCEPTION 'El costo base no puede ser negativo';
    END IF;
    
    -- Determinar sort_order si no se proporciona
    IF p_sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        INTO new_sort_order
        FROM products 
        WHERE project_id = p_project_id;
    ELSE
        new_sort_order := p_sort_order;
    END IF;
    
    -- Insertar el nuevo producto
    INSERT INTO products (
        project_id, category_id, product_line_id, name, slug, 
        description, short_description, sku, base_price, base_cost,
        weight, materials, care_instructions, tags,
        track_inventory, continue_selling_when_out_of_stock, 
        is_active, sort_order, created_by, updated_by
    ) VALUES (
        p_project_id, p_category_id, p_product_line_id,
        trim(p_name), lower(trim(p_slug)), 
        trim(p_description), trim(p_short_description), 
        upper(trim(p_sku)), p_base_price, p_base_cost,
        p_weight, p_materials, trim(p_care_instructions), p_tags,
        p_track_inventory, p_continue_selling_when_out_of_stock,
        p_is_active, new_sort_order, current_user_id, current_user_id
    );
    
    -- Retornar el producto creado
    RETURN QUERY
    SELECT 
        pr.id, pr.project_id, pr.category_id, pr.product_line_id,
        pr.name, pr.slug, pr.description, pr.short_description, pr.sku,
        pr.base_price, pr.base_cost, pr.weight, pr.materials,
        pr.care_instructions, pr.tags, pr.track_inventory,
        pr.continue_selling_when_out_of_stock, pr.is_active, pr.sort_order,
        pr.created_at, pr.updated_at
    FROM products pr
    WHERE pr.project_id = p_project_id 
    AND pr.slug = lower(trim(p_slug));
    
END;
$$;

-- ================================================
-- 🔍 2. GET PRODUCT
-- ================================================

CREATE OR REPLACE FUNCTION get_product(
    p_project_id UUID,
    p_product_id UUID DEFAULT NULL,
    p_slug TEXT DEFAULT NULL,
    p_sku TEXT DEFAULT NULL,
    p_include_variants BOOLEAN DEFAULT false
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    category_id UUID,
    category_name TEXT,
    product_line_id UUID,
    product_line_name TEXT,
    name TEXT,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    sku TEXT,
    base_price DECIMAL(10,2),
    base_cost DECIMAL(10,2),
    weight INTEGER,
    materials JSONB,
    care_instructions TEXT,
    tags JSONB,
    track_inventory BOOLEAN,
    continue_selling_when_out_of_stock BOOLEAN,
    is_active BOOLEAN,
    sort_order INTEGER,
    variant_count BIGINT,
    total_stock BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    variants JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_product_id UUID;
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
    IF p_product_id IS NULL AND (p_slug IS NULL OR trim(p_slug) = '') AND (p_sku IS NULL OR trim(p_sku) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar product_id, slug o sku';
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
    
    -- Obtener el ID del producto
    IF p_product_id IS NOT NULL THEN
        target_product_id := p_product_id;
    ELSIF p_slug IS NOT NULL AND trim(p_slug) != '' THEN
        SELECT products.id INTO target_product_id 
        FROM products 
        WHERE products.project_id = p_project_id 
        AND products.slug = lower(trim(p_slug));
    ELSIF p_sku IS NOT NULL AND trim(p_sku) != '' THEN
        SELECT products.id INTO target_product_id 
        FROM products 
        WHERE products.project_id = p_project_id 
        AND products.sku = upper(trim(p_sku));
    END IF;
    
    IF target_product_id IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;
    
    -- Retornar el producto con información adicional
    RETURN QUERY
    SELECT 
        pr.id, pr.project_id, pr.category_id, c.name as category_name,
        pr.product_line_id, pl.name as product_line_name,
        pr.name, pr.slug, pr.description, pr.short_description, pr.sku,
        pr.base_price, pr.base_cost, pr.weight, pr.materials,
        pr.care_instructions, pr.tags, pr.track_inventory,
        pr.continue_selling_when_out_of_stock, pr.is_active, pr.sort_order,
        COALESCE(vc.variant_count, 0) as variant_count,
        COALESCE(inv.total_stock, 0) as total_stock,
        pr.created_at, pr.updated_at,
        CASE WHEN p_include_variants THEN 
            COALESCE(variants_json.variants, '[]'::jsonb)
        ELSE '[]'::jsonb END as variants
    FROM products pr
    LEFT JOIN categories c ON pr.category_id = c.id
    LEFT JOIN product_lines pl ON pr.product_line_id = pl.id
    LEFT JOIN (
        SELECT product_id, COUNT(*) as variant_count 
        FROM product_variants 
        WHERE is_active = true 
        GROUP BY product_id
    ) vc ON pr.id = vc.product_id
    LEFT JOIN (
        SELECT 
            pv.product_id, 
            SUM(i.quantity_available) as total_stock
        FROM product_variants pv
        LEFT JOIN inventory i ON pv.id = i.variant_id
        GROUP BY pv.product_id
    ) inv ON pr.id = inv.product_id
    LEFT JOIN (
        SELECT 
            pv.product_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', pv.id,
                    'name', pv.name,
                    'sku', pv.sku,
                    'size', pv.size,
                    'color', pv.color,
                    'price_adjustment', pv.price_adjustment,
                    'cost_adjustment', pv.cost_adjustment,
                    'is_active', pv.is_active,
                    'stock', COALESCE(i.quantity_available, 0)
                ) ORDER BY pv.sort_order, pv.name
            ) as variants
        FROM product_variants pv
        LEFT JOIN inventory i ON pv.id = i.variant_id
        WHERE pv.is_active = true AND p_include_variants = true
        GROUP BY pv.product_id
    ) variants_json ON pr.id = variants_json.product_id
    WHERE pr.id = target_product_id;
    
END;
$$;

-- ================================================
-- ✏️ 3. UPDATE PRODUCT
-- ================================================

CREATE OR REPLACE FUNCTION update_product(
    p_project_id UUID,
    p_product_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_product_line_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_short_description TEXT DEFAULT NULL,
    p_base_price DECIMAL(10,2) DEFAULT NULL,
    p_base_cost DECIMAL(10,2) DEFAULT NULL,
    p_weight INTEGER DEFAULT NULL,
    p_materials JSONB DEFAULT NULL,
    p_care_instructions TEXT DEFAULT NULL,
    p_tags JSONB DEFAULT NULL,
    p_track_inventory BOOLEAN DEFAULT NULL,
    p_continue_selling_when_out_of_stock BOOLEAN DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    category_id UUID,
    product_line_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    sku TEXT,
    base_price DECIMAL(10,2),
    base_cost DECIMAL(10,2),
    weight INTEGER,
    materials JSONB,
    care_instructions TEXT,
    tags JSONB,
    track_inventory BOOLEAN,
    continue_selling_when_out_of_stock BOOLEAN,
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
    
    IF p_product_id IS NULL THEN
        RAISE EXCEPTION 'product_id es requerido';
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
    
    -- Validar que el producto pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM products 
        WHERE id = p_product_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Producto no encontrado en este proyecto';
    END IF;
    
    -- Validar categoría si se proporciona
    IF p_category_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE id = p_category_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Categoría no encontrada o inactiva';
        END IF;
    END IF;
    
    -- Validar línea de productos si se proporciona
    IF p_product_line_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM product_lines 
            WHERE id = p_product_line_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Línea de productos no encontrada o inactiva';
        END IF;
    END IF;
    
    -- Validar precios si se proporcionan
    IF p_base_price IS NOT NULL AND p_base_price < 0 THEN
        RAISE EXCEPTION 'El precio base no puede ser negativo';
    END IF;
    
    IF p_base_cost IS NOT NULL AND p_base_cost < 0 THEN
        RAISE EXCEPTION 'El costo base no puede ser negativo';
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE products SET
        category_id = COALESCE(p_category_id, category_id),
        product_line_id = COALESCE(p_product_line_id, product_line_id),
        name = COALESCE(trim(p_name), name),
        description = COALESCE(trim(p_description), description),
        short_description = COALESCE(trim(p_short_description), short_description),
        base_price = COALESCE(p_base_price, base_price),
        base_cost = COALESCE(p_base_cost, base_cost),
        weight = COALESCE(p_weight, weight),
        materials = COALESCE(p_materials, materials),
        care_instructions = COALESCE(trim(p_care_instructions), care_instructions),
        tags = COALESCE(p_tags, tags),
        track_inventory = COALESCE(p_track_inventory, track_inventory),
        continue_selling_when_out_of_stock = COALESCE(p_continue_selling_when_out_of_stock, continue_selling_when_out_of_stock),
        is_active = COALESCE(p_is_active, is_active),
        sort_order = COALESCE(p_sort_order, sort_order),
        updated_by = current_user_id,
        updated_at = NOW()
    WHERE id = p_product_id AND project_id = p_project_id;
    
    -- Verificar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto con ID "%" no encontrado en este proyecto', p_product_id;
    END IF;
    
    -- Retornar el producto actualizado
    RETURN QUERY
    SELECT 
        pr.id, pr.project_id, pr.category_id, pr.product_line_id,
        pr.name, pr.slug, pr.description, pr.short_description, pr.sku,
        pr.base_price, pr.base_cost, pr.weight, pr.materials,
        pr.care_instructions, pr.tags, pr.track_inventory,
        pr.continue_selling_when_out_of_stock, pr.is_active, pr.sort_order,
        pr.created_at, pr.updated_at
    FROM products pr
    WHERE pr.id = p_product_id;
    
END;
$$;

-- ================================================
-- 🗑️ 4. DELETE PRODUCT
-- ================================================

CREATE OR REPLACE FUNCTION delete_product(
    p_project_id UUID,
    p_product_id UUID,
    p_force_delete BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    variant_count INTEGER;
    order_count INTEGER;
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
    
    -- Validar que el producto pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM products 
        WHERE id = p_product_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Producto no encontrado en este proyecto';
    END IF;
    
    -- Verificar dependencias si no es eliminación forzada
    IF NOT p_force_delete THEN
        -- Contar variantes
        SELECT COUNT(*) INTO variant_count
        FROM product_variants 
        WHERE product_id = p_product_id;
        
        -- Contar órdenes con este producto
        SELECT COUNT(DISTINCT oi.order_id) INTO order_count
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE pv.product_id = p_product_id;
        
        IF variant_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el producto porque tiene % variantes. Use force_delete=true para eliminar todo.', variant_count;
        END IF;
        
        IF order_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el producto porque aparece en % órdenes. Use force_delete=true para proceder.', order_count;
        END IF;
    END IF;
    
    -- Si es eliminación forzada, eliminar dependencias
    IF p_force_delete THEN
        -- Eliminar movimientos de inventario relacionados
        DELETE FROM inventory_movements 
        WHERE inventory_id IN (
            SELECT i.id FROM inventory i
            JOIN product_variants pv ON i.variant_id = pv.id
            WHERE pv.product_id = p_product_id
        );
        
        -- Eliminar inventario relacionado
        DELETE FROM inventory 
        WHERE variant_id IN (
            SELECT id FROM product_variants WHERE product_id = p_product_id
        );
        
        -- Eliminar variantes del producto
        DELETE FROM product_variants WHERE product_id = p_product_id;
        
        -- Note: No eliminamos order_items porque las órdenes históricas deben mantenerse
        -- Solo marcamos el producto como inactivo en su lugar si hay órdenes
        IF order_count > 0 THEN
            UPDATE products SET 
                is_active = false,
                updated_by = current_user_id,
                updated_at = NOW()
            WHERE id = p_product_id AND project_id = p_project_id;
            
            RETURN true;
        END IF;
    END IF;
    
    -- Eliminar el producto
    DELETE FROM products 
    WHERE id = p_product_id AND project_id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto con ID "%" no encontrado en este proyecto', p_product_id;
    END IF;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 📋 5. LIST PRODUCTS
-- ================================================

CREATE OR REPLACE FUNCTION list_products(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_product_line_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_is_active BOOLEAN DEFAULT NULL,
    p_track_inventory BOOLEAN DEFAULT NULL,
    p_low_stock BOOLEAN DEFAULT false,
    p_search TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'updated_at',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    category_id UUID,
    category_name TEXT,
    product_line_id UUID,
    product_line_name TEXT,
    name TEXT,
    slug TEXT,
    description TEXT,
    short_description TEXT,
    sku TEXT,
    base_price DECIMAL(10,2),
    base_cost DECIMAL(10,2),
    weight INTEGER,
    materials JSONB,
    care_instructions TEXT,
    tags JSONB,
    track_inventory BOOLEAN,
    continue_selling_when_out_of_stock BOOLEAN,
    is_active BOOLEAN,
    sort_order INTEGER,
    variant_count BIGINT,
    total_stock BIGINT,
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
        WHEN p_sort_by IN ('name', 'sku', 'base_price', 'created_at', 'updated_at', 'sort_order') 
        THEN p_sort_by 
        ELSE 'updated_at' 
    END;
    
    sort_direction := CASE 
        WHEN lower(p_sort_order) IN ('asc', 'desc') 
        THEN lower(p_sort_order) 
        ELSE 'desc' 
    END;
    
    -- Retornar productos con filtros aplicados
    RETURN QUERY EXECUTE format('
        WITH filtered_products AS (
            SELECT 
                pr.id, pr.project_id, pr.category_id, c.name as category_name,
                pr.product_line_id, pl.name as product_line_name,
                pr.name, pr.slug, pr.description, pr.short_description, pr.sku,
                pr.base_price, pr.base_cost, pr.weight, pr.materials,
                pr.care_instructions, pr.tags, pr.track_inventory,
                pr.continue_selling_when_out_of_stock, pr.is_active, pr.sort_order,
                COALESCE(vc.variant_count, 0) as variant_count,
                COALESCE(inv.total_stock, 0) as total_stock,
                pr.created_at, pr.updated_at
            FROM products pr
            LEFT JOIN categories c ON pr.category_id = c.id
            LEFT JOIN product_lines pl ON pr.product_line_id = pl.id
            LEFT JOIN (
                SELECT product_id, COUNT(*) as variant_count 
                FROM product_variants 
                WHERE is_active = true 
                GROUP BY product_id
            ) vc ON pr.id = vc.product_id
            LEFT JOIN (
                SELECT 
                    pv.product_id, 
                    SUM(i.quantity_available) as total_stock
                FROM product_variants pv
                LEFT JOIN inventory i ON pv.id = i.variant_id
                GROUP BY pv.product_id
            ) inv ON pr.id = inv.product_id
            WHERE pr.project_id = $1
            AND ($2 IS NULL OR pr.category_id = $2)
            AND ($3 IS NULL OR pr.product_line_id = $3)
            AND ($4 IS NULL OR pr.is_active = $4)
            AND ($5 IS NULL OR pr.track_inventory = $5)
            AND ($6 = false OR (pr.track_inventory = true AND COALESCE(inv.total_stock, 0) <= 5))
            AND ($7 IS NULL OR 
                 lower(pr.name) LIKE $7 OR 
                 lower(pr.description) LIKE $7 OR
                 lower(pr.sku) LIKE $7 OR
                 lower(pr.slug) LIKE $7)
            ORDER BY %I %s, pr.name ASC
        ),
        counted_products AS (
            SELECT *, COUNT(*) OVER() as total_count
            FROM filtered_products
        )
        SELECT * FROM counted_products
        LIMIT $8 OFFSET $9', 
        sort_column, sort_direction
    ) USING p_project_id, p_category_id, p_product_line_id, p_is_active, 
            p_track_inventory, p_low_stock, search_term, p_limit, p_offset;
    
END;
$$;

-- ================================================
-- 🔄 6. DUPLICATE PRODUCT
-- ================================================

CREATE OR REPLACE FUNCTION duplicate_product(
    p_project_id UUID,
    p_product_id UUID,
    p_new_name TEXT DEFAULT NULL,
    p_new_slug TEXT DEFAULT NULL,
    p_new_sku TEXT DEFAULT NULL,
    p_include_variants BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    slug TEXT,
    sku TEXT,
    variants_duplicated INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    source_product RECORD;
    new_product_id UUID;
    variants_count INTEGER := 0;
    variant_record RECORD;
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
    
    -- Obtener producto fuente
    SELECT * INTO source_product
    FROM products 
    WHERE id = p_product_id AND project_id = p_project_id;
    
    IF source_product IS NULL THEN
        RAISE EXCEPTION 'Producto fuente no encontrado';
    END IF;
    
    -- Preparar nombres únicos
    p_new_name := COALESCE(p_new_name, source_product.name || ' (Copia)');
    p_new_slug := COALESCE(p_new_slug, source_product.slug || '-copia');
    p_new_sku := COALESCE(p_new_sku, source_product.sku || '-COPY');
    
    -- Verificar unicidad de slug y SKU
    IF EXISTS (SELECT 1 FROM products WHERE project_id = p_project_id AND slug = p_new_slug) THEN
        p_new_slug := p_new_slug || '-' || extract(epoch from now())::text;
    END IF;
    
    IF EXISTS (SELECT 1 FROM products WHERE project_id = p_project_id AND sku = p_new_sku) THEN
        p_new_sku := p_new_sku || '-' || extract(epoch from now())::text;
    END IF;
    
    -- Crear producto duplicado
    INSERT INTO products (
        project_id, category_id, product_line_id, name, slug, 
        description, short_description, sku, base_price, base_cost,
        weight, materials, care_instructions, tags,
        track_inventory, continue_selling_when_out_of_stock, 
        is_active, sort_order, created_by, updated_by
    ) VALUES (
        source_product.project_id, source_product.category_id, source_product.product_line_id,
        p_new_name, p_new_slug, source_product.description, source_product.short_description,
        p_new_sku, source_product.base_price, source_product.base_cost,
        source_product.weight, source_product.materials, source_product.care_instructions,
        source_product.tags, source_product.track_inventory, 
        source_product.continue_selling_when_out_of_stock,
        source_product.is_active, source_product.sort_order + 1,
        current_user_id, current_user_id
    )
    RETURNING id INTO new_product_id;
    
    -- Duplicar variantes si se solicita
    IF p_include_variants THEN
        FOR variant_record IN 
            SELECT * FROM product_variants 
            WHERE product_id = p_product_id 
            ORDER BY sort_order, name
        LOOP
            INSERT INTO product_variants (
                product_id, name, sku, size, color, material,
                price_adjustment, cost_adjustment, weight_adjustment,
                barcode, is_active, sort_order
            ) VALUES (
                new_product_id,
                variant_record.name,
                variant_record.sku || '-COPY',
                variant_record.size,
                variant_record.color,
                variant_record.material,
                variant_record.price_adjustment,
                variant_record.cost_adjustment,
                variant_record.weight_adjustment,
                variant_record.barcode,
                variant_record.is_active,
                variant_record.sort_order
            );
            
            variants_count := variants_count + 1;
        END LOOP;
    END IF;
    
    -- Retornar información del producto duplicado
    RETURN QUERY
    SELECT 
        new_product_id,
        p_new_name,
        p_new_slug,
        p_new_sku,
        variants_count;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_product IS 'Crea un nuevo producto con validaciones completas';
COMMENT ON FUNCTION get_product IS 'Obtiene un producto por ID/slug/SKU con información adicional';
COMMENT ON FUNCTION update_product IS 'Actualiza un producto existente con validaciones';
COMMENT ON FUNCTION delete_product IS 'Elimina un producto y opcionalmente sus dependencias';
COMMENT ON FUNCTION list_products IS 'Lista productos con filtros avanzados y paginación';
COMMENT ON FUNCTION duplicate_product IS 'Duplica un producto con opción de incluir variantes';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_product TO authenticated;
GRANT EXECUTE ON FUNCTION get_product TO authenticated;
GRANT EXECUTE ON FUNCTION update_product TO authenticated;
GRANT EXECUTE ON FUNCTION delete_product TO authenticated;
GRANT EXECUTE ON FUNCTION list_products TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_product TO authenticated;

-- ================================================
-- ✅ FUNCIONES PRODUCTS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_product() - Crear producto nuevo con validaciones completas
-- ✅ get_product() - Obtener producto por ID/slug/SKU con variantes opcionales
-- ✅ update_product() - Actualizar producto con validaciones de precios y relaciones
-- ✅ delete_product() - Eliminar producto (con/sin dependencias y órden histórica)
-- ✅ list_products() - Listar productos con filtros avanzados y ordenamiento
-- ✅ duplicate_product() - Duplicar producto con variantes opcionales

/*
EJEMPLOS DE USO:

-- Crear producto
SELECT * FROM create_product(
    'uuid-proyecto',
    'uuid-categoria',
    'uuid-linea-productos',
    'Rashguard Premium',
    'rashguard-premium',
    'Rashguard de alta calidad...',
    'Rashguard premium lycra',
    'RAS-PREM',
    75.00,
    45.00
);

-- Obtener producto con variantes
SELECT * FROM get_product(
    'uuid-proyecto',
    p_slug := 'rashguard-premium',
    p_include_variants := true
);

-- Listar productos con filtros
SELECT * FROM list_products(
    'uuid-proyecto',
    p_category_id := 'uuid-categoria',
    p_search := 'rashguard',
    p_low_stock := true
);

-- Duplicar producto
SELECT * FROM duplicate_product(
    'uuid-proyecto',
    'uuid-producto-original',
    'Rashguard Premium V2',
    'rashguard-premium-v2',
    'RAS-PREM-V2'
);
*/