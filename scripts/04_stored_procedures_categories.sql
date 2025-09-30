-- ================================================
-- 🏷️ STORED PROCEDURES - CATEGORIES
-- Funciones para gestión completa de categorías
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene todos los CRUD básicos para la tabla categories

-- ================================================
-- 📝 1. CREATE CATEGORY
-- ================================================

CREATE OR REPLACE FUNCTION create_category(
    p_project_id UUID,
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT DEFAULT NULL,
    p_parent_id UUID DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    parent_id UUID,
    image_url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
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
        RAISE EXCEPTION 'El nombre de la categoría es requerido';
    END IF;
    
    IF p_slug IS NULL OR trim(p_slug) = '' THEN
        RAISE EXCEPTION 'El slug de la categoría es requerido';
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
        RAISE EXCEPTION 'No tienes permisos para gestionar categorías';
    END IF;
    
    -- Validar formato del slug
    IF p_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones';
    END IF;
    
    -- Verificar que el slug sea único en el proyecto
    IF EXISTS (
        SELECT 1 FROM categories 
        WHERE project_id = p_project_id AND slug = lower(trim(p_slug))
    ) THEN
        RAISE EXCEPTION 'Ya existe una categoría con el slug "%" en este proyecto', p_slug;
    END IF;
    
    -- Validar categoría padre si se proporciona
    IF p_parent_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE id = p_parent_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Categoría padre no encontrada o inactiva';
        END IF;
    END IF;
    
    -- Determinar sort_order si no se proporciona
    IF p_sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        INTO new_sort_order
        FROM categories 
        WHERE project_id = p_project_id 
        AND (parent_id = p_parent_id OR (parent_id IS NULL AND p_parent_id IS NULL));
    ELSE
        new_sort_order := p_sort_order;
    END IF;
    
    -- Insertar la nueva categoría
    INSERT INTO categories (
        project_id, name, slug, description, parent_id, 
        image_url, icon, sort_order, is_active,
        created_by, updated_by
    ) VALUES (
        p_project_id,
        trim(p_name), 
        lower(trim(p_slug)), 
        trim(p_description), 
        p_parent_id,
        trim(p_image_url),
        trim(p_icon),
        new_sort_order,
        p_is_active,
        current_user_id, 
        current_user_id
    );
    
    -- Retornar la categoría creada
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.name, c.slug, c.description, 
        c.parent_id, c.image_url, c.icon, c.sort_order, c.is_active,
        c.created_at, c.updated_at
    FROM categories c
    WHERE c.project_id = p_project_id 
    AND c.slug = lower(trim(p_slug));
    
END;
$$;

-- ================================================
-- 🔍 2. GET CATEGORY
-- ================================================

CREATE OR REPLACE FUNCTION get_category(
    p_project_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_slug TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    parent_id UUID,
    parent_name TEXT,
    image_url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
    product_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_category_id UUID;
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
    IF p_category_id IS NULL AND (p_slug IS NULL OR trim(p_slug) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar category_id o slug';
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
    
    -- Obtener el ID de la categoría
    IF p_category_id IS NOT NULL THEN
        target_category_id := p_category_id;
    ELSE
        SELECT categories.id INTO target_category_id 
        FROM categories 
        WHERE categories.project_id = p_project_id 
        AND categories.slug = lower(trim(p_slug)) 
        AND categories.is_active = true;
        
        IF target_category_id IS NULL THEN
            RAISE EXCEPTION 'Categoría con slug "%" no encontrada', p_slug;
        END IF;
    END IF;
    
    -- Retornar la categoría con información adicional
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.name, c.slug, c.description, 
        c.parent_id, parent_cat.name as parent_name,
        c.image_url, c.icon, c.sort_order, c.is_active,
        COALESCE(pc.product_count, 0) as product_count,
        c.created_at, c.updated_at
    FROM categories c
    LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
    LEFT JOIN (
        SELECT category_id, COUNT(*) as product_count 
        FROM products 
        WHERE project_id = p_project_id AND is_active = true 
        GROUP BY category_id
    ) pc ON c.id = pc.category_id
    WHERE c.id = target_category_id;
    
END;
$$;

-- ================================================
-- ✏️ 3. UPDATE CATEGORY
-- ================================================

CREATE OR REPLACE FUNCTION update_category(
    p_project_id UUID,
    p_category_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_parent_id UUID DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    parent_id UUID,
    image_url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
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
    
    IF p_category_id IS NULL THEN
        RAISE EXCEPTION 'category_id es requerido';
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
        RAISE EXCEPTION 'No tienes permisos para gestionar categorías';
    END IF;
    
    -- Validar que la categoría pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE id = p_category_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Categoría no encontrada en este proyecto';
    END IF;
    
    -- Validar categoría padre si se proporciona
    IF p_parent_id IS NOT NULL THEN
        -- No puede ser padre de sí misma
        IF p_parent_id = p_category_id THEN
            RAISE EXCEPTION 'Una categoría no puede ser padre de sí misma';
        END IF;
        
        -- Verificar que la categoría padre existe y está activa
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE id = p_parent_id AND project_id = p_project_id AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Categoría padre no encontrada o inactiva';
        END IF;
        
        -- Evitar referencias circulares (verificar que el padre no sea descendiente)
        IF EXISTS (
            WITH RECURSIVE category_tree AS (
                SELECT id, parent_id, 1 as level
                FROM categories 
                WHERE id = p_category_id AND project_id = p_project_id
                
                UNION ALL
                
                SELECT c.id, c.parent_id, ct.level + 1
                FROM categories c
                JOIN category_tree ct ON c.parent_id = ct.id
                WHERE ct.level < 10 -- Evitar bucles infinitos
            )
            SELECT 1 FROM category_tree WHERE id = p_parent_id
        ) THEN
            RAISE EXCEPTION 'Referencia circular detectada: la categoría padre no puede ser descendiente de esta categoría';
        END IF;
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE categories SET
        name = COALESCE(trim(p_name), name),
        description = COALESCE(trim(p_description), description),
        parent_id = CASE 
            WHEN p_parent_id IS NOT NULL THEN p_parent_id
            ELSE parent_id 
        END,
        image_url = COALESCE(trim(p_image_url), image_url),
        icon = COALESCE(trim(p_icon), icon),
        sort_order = COALESCE(p_sort_order, sort_order),
        is_active = COALESCE(p_is_active, is_active),
        updated_by = current_user_id,
        updated_at = NOW()
    WHERE id = p_category_id AND project_id = p_project_id;
    
    -- Verificar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoría con ID "%" no encontrada en este proyecto', p_category_id;
    END IF;
    
    -- Retornar la categoría actualizada
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.name, c.slug, c.description, 
        c.parent_id, c.image_url, c.icon, c.sort_order, c.is_active,
        c.created_at, c.updated_at
    FROM categories c
    WHERE c.id = p_category_id;
    
END;
$$;

-- ================================================
-- 🗑️ 4. DELETE CATEGORY
-- ================================================

CREATE OR REPLACE FUNCTION delete_category(
    p_project_id UUID,
    p_category_id UUID,
    p_force_delete BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    product_count INTEGER;
    children_count INTEGER;
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
    
    IF p_category_id IS NULL THEN
        RAISE EXCEPTION 'category_id es requerido';
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
        RAISE EXCEPTION 'No tienes permisos para gestionar categorías';
    END IF;
    
    -- Validar que la categoría pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE id = p_category_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Categoría no encontrada en este proyecto';
    END IF;
    
    -- Verificar dependencias si no es eliminación forzada
    IF NOT p_force_delete THEN
        -- Contar productos asociados
        SELECT COUNT(*) INTO product_count
        FROM products 
        WHERE category_id = p_category_id AND project_id = p_project_id;
        
        -- Contar categorías hijas
        SELECT COUNT(*) INTO children_count
        FROM categories 
        WHERE parent_id = p_category_id AND project_id = p_project_id;
        
        IF product_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene % productos asociados. Use force_delete=true para eliminar todo.', product_count;
        END IF;
        
        IF children_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la categoría porque tiene % subcategorías. Use force_delete=true o mueva las subcategorías primero.', children_count;
        END IF;
    END IF;
    
    -- Si es eliminación forzada, manejar dependencias
    IF p_force_delete THEN
        -- Mover subcategorías al nivel padre de la categoría a eliminar
        UPDATE categories 
        SET parent_id = (SELECT parent_id FROM categories WHERE id = p_category_id)
        WHERE parent_id = p_category_id AND project_id = p_project_id;
        
        -- Desasociar productos (moverlos a categoría NULL)
        UPDATE products 
        SET category_id = NULL
        WHERE category_id = p_category_id AND project_id = p_project_id;
    END IF;
    
    -- Eliminar la categoría
    DELETE FROM categories 
    WHERE id = p_category_id AND project_id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoría con ID "%" no encontrada en este proyecto', p_category_id;
    END IF;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 📋 5. LIST CATEGORIES
-- ================================================

CREATE OR REPLACE FUNCTION list_categories(
    p_project_id UUID,
    p_parent_id UUID DEFAULT NULL,
    p_include_children BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_is_active BOOLEAN DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    parent_id UUID,
    parent_name TEXT,
    image_url TEXT,
    icon TEXT,
    sort_order INTEGER,
    is_active BOOLEAN,
    product_count BIGINT,
    children_count BIGINT,
    level INTEGER,
    path TEXT,
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
    
    -- Retornar categorías con estructura jerárquica
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Casos base: categorías raíz o categorías específicas
        SELECT 
            c.id, c.project_id, c.name, c.slug, c.description, 
            c.parent_id, c.image_url, c.icon, c.sort_order, c.is_active,
            c.created_at, c.updated_at,
            1 as level,
            c.name::TEXT as path
        FROM categories c
        WHERE c.project_id = p_project_id
        AND (
            (p_parent_id IS NULL AND p_include_children = false AND c.parent_id IS NULL) OR
            (p_parent_id IS NOT NULL AND c.parent_id = p_parent_id) OR
            (p_parent_id IS NULL AND p_include_children = true AND c.parent_id IS NULL)
        )
        AND (p_is_active IS NULL OR c.is_active = p_is_active)
        AND (search_term IS NULL OR 
             lower(c.name) LIKE search_term OR 
             lower(c.description) LIKE search_term OR
             lower(c.slug) LIKE search_term)
        
        UNION ALL
        
        -- Casos recursivos: hijos si se solicita incluir hijos
        SELECT 
            c.id, c.project_id, c.name, c.slug, c.description, 
            c.parent_id, c.image_url, c.icon, c.sort_order, c.is_active,
            c.created_at, c.updated_at,
            ct.level + 1,
            ct.path || ' > ' || c.name
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
        WHERE p_include_children = true
        AND ct.level < 10 -- Evitar bucles infinitos
        AND (p_is_active IS NULL OR c.is_active = p_is_active)
        AND (search_term IS NULL OR 
             lower(c.name) LIKE search_term OR 
             lower(c.description) LIKE search_term OR
             lower(c.slug) LIKE search_term)
    ),
    enriched_categories AS (
        SELECT 
            ct.*,
            parent_cat.name as parent_name,
            COALESCE(pc.product_count, 0) as product_count,
            COALESCE(cc.children_count, 0) as children_count
        FROM category_tree ct
        LEFT JOIN categories parent_cat ON ct.parent_id = parent_cat.id
        LEFT JOIN (
            SELECT category_id, COUNT(*) as product_count 
            FROM products 
            WHERE project_id = p_project_id AND is_active = true 
            GROUP BY category_id
        ) pc ON ct.id = pc.category_id
        LEFT JOIN (
            SELECT parent_id, COUNT(*) as children_count 
            FROM categories 
            WHERE project_id = p_project_id AND is_active = true 
            GROUP BY parent_id
        ) cc ON ct.id = cc.parent_id
        ORDER BY ct.level, ct.sort_order, ct.name
    ),
    counted_categories AS (
        SELECT *, COUNT(*) OVER() as total_count
        FROM enriched_categories
    )
    SELECT 
        cc.id, cc.project_id, cc.name, cc.slug, cc.description, 
        cc.parent_id, cc.parent_name, cc.image_url, cc.icon, 
        cc.sort_order, cc.is_active, cc.product_count, cc.children_count,
        cc.level, cc.path, cc.created_at, cc.updated_at, cc.total_count
    FROM counted_categories cc
    LIMIT p_limit OFFSET p_offset;
    
END;
$$;

-- ================================================
-- 🔄 6. REORDER CATEGORIES
-- ================================================

CREATE OR REPLACE FUNCTION reorder_categories(
    p_project_id UUID,
    p_category_orders JSONB -- [{"id": "uuid", "sort_order": 1}, ...]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    category_record JSONB;
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
    
    IF p_category_orders IS NULL THEN
        RAISE EXCEPTION 'category_orders es requerido';
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
        RAISE EXCEPTION 'No tienes permisos para gestionar categorías';
    END IF;
    
    -- Actualizar el orden de cada categoría
    FOR category_record IN SELECT * FROM jsonb_array_elements(p_category_orders)
    LOOP
        UPDATE categories 
        SET 
            sort_order = (category_record->>'sort_order')::INTEGER,
            updated_by = current_user_id,
            updated_at = NOW()
        WHERE id = (category_record->>'id')::UUID 
        AND project_id = p_project_id;
    END LOOP;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_category IS 'Crea una nueva categoría con validaciones de slug y jerarquía';
COMMENT ON FUNCTION get_category IS 'Obtiene una categoría por ID o slug con información adicional';
COMMENT ON FUNCTION update_category IS 'Actualiza una categoría existente con validaciones de jerarquía';
COMMENT ON FUNCTION delete_category IS 'Elimina una categoría y opcionalmente maneja dependencias';
COMMENT ON FUNCTION list_categories IS 'Lista categorías con estructura jerárquica y filtros';
COMMENT ON FUNCTION reorder_categories IS 'Actualiza el orden de múltiples categorías';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_category TO authenticated;
GRANT EXECUTE ON FUNCTION update_category TO authenticated;
GRANT EXECUTE ON FUNCTION delete_category TO authenticated;
GRANT EXECUTE ON FUNCTION list_categories TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_categories TO authenticated;

-- ================================================
-- ✅ FUNCIONES CATEGORIES COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_category() - Crear categoría nueva con jerarquía
-- ✅ get_category() - Obtener categoría por ID/slug con conteos
-- ✅ update_category() - Actualizar categoría con validaciones circulares
-- ✅ delete_category() - Eliminar categoría (con/sin dependencias)
-- ✅ list_categories() - Listar categorías con estructura jerárquica
-- ✅ reorder_categories() - Reordenar múltiples categorías

/*
EJEMPLOS DE USO:

-- Crear categoría raíz
SELECT * FROM create_category(
    'uuid-proyecto',
    'Rashguards', 
    'rashguards', 
    'Camisetas de lycra para combat sports'
);

-- Crear subcategoría
SELECT * FROM create_category(
    'uuid-proyecto',
    'Rashguards Manga Larga', 
    'rashguards-manga-larga',
    'Rashguards de manga larga',
    'uuid-categoria-padre'
);

-- Obtener categoría
SELECT * FROM get_category(
    'uuid-proyecto',
    p_slug := 'rashguards'
);

-- Listar todas las categorías con jerarquía
SELECT * FROM list_categories(
    'uuid-proyecto',
    p_include_children := true
);

-- Reordenar categorías
SELECT * FROM reorder_categories(
    'uuid-proyecto',
    '[{"id": "uuid1", "sort_order": 1}, {"id": "uuid2", "sort_order": 2}]'::jsonb
);
*/