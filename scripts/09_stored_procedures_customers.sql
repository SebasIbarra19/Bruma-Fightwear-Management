-- ================================================
-- 👥 STORED PROCEDURES - CUSTOMERS
-- Funciones para gestión completa de clientes
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene todos los CRUD básicos para la tabla customers

-- ================================================
-- 📝 1. CREATE CUSTOMER
-- ================================================

CREATE OR REPLACE FUNCTION create_customer(
    p_project_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_date_of_birth DATE DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_preferred_language TEXT DEFAULT 'es',
    p_marketing_consent BOOLEAN DEFAULT false,
    p_notes TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    preferred_language TEXT,
    marketing_consent BOOLEAN,
    notes TEXT,
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
    
    IF p_first_name IS NULL OR trim(p_first_name) = '' THEN
        RAISE EXCEPTION 'El nombre es requerido';
    END IF;
    
    IF p_last_name IS NULL OR trim(p_last_name) = '' THEN
        RAISE EXCEPTION 'El apellido es requerido';
    END IF;
    
    IF p_email IS NULL OR trim(p_email) = '' THEN
        RAISE EXCEPTION 'El email es requerido';
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
    
    -- Verificar permisos de gestión de clientes
    IF NOT (user_permissions_json->>'can_manage_customers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar clientes';
    END IF;
    
    -- Validar formato del email
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Formato de email inválido';
    END IF;
    
    -- Verificar que el email sea único en el proyecto
    IF EXISTS (
        SELECT 1 FROM customers 
        WHERE project_id = p_project_id AND email = lower(trim(p_email))
    ) THEN
        RAISE EXCEPTION 'Ya existe un cliente con el email "%"', p_email;
    END IF;
    
    -- Validar género si se proporciona
    IF p_gender IS NOT NULL AND p_gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say') THEN
        RAISE EXCEPTION 'Género inválido. Use: male, female, other, prefer_not_to_say';
    END IF;
    
    -- Validar idioma preferido
    IF p_preferred_language NOT IN ('es', 'en', 'fr', 'pt') THEN
        RAISE EXCEPTION 'Idioma inválido. Use: es, en, fr, pt';
    END IF;
    
    -- Insertar el nuevo cliente
    INSERT INTO customers (
        project_id, first_name, last_name, email, phone, date_of_birth,
        gender, preferred_language, marketing_consent, notes, is_active,
        created_by, updated_by
    ) VALUES (
        p_project_id, trim(p_first_name), trim(p_last_name), 
        lower(trim(p_email)), trim(p_phone), p_date_of_birth,
        p_gender, p_preferred_language, p_marketing_consent, 
        trim(p_notes), p_is_active, current_user_id, current_user_id
    );
    
    -- Retornar el cliente creado
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.first_name, c.last_name,
        (c.first_name || ' ' || c.last_name) as full_name,
        c.email, c.phone, c.date_of_birth, c.gender,
        c.preferred_language, c.marketing_consent, c.notes, c.is_active,
        c.created_at, c.updated_at
    FROM customers c
    WHERE c.project_id = p_project_id 
    AND c.email = lower(trim(p_email))
    AND c.created_by = current_user_id
    ORDER BY c.created_at DESC
    LIMIT 1;
    
END;
$$;

-- ================================================
-- 🔍 2. GET CUSTOMER
-- ================================================

CREATE OR REPLACE FUNCTION get_customer(
    p_project_id UUID,
    p_customer_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_include_order_stats BOOLEAN DEFAULT false,
    p_include_addresses BOOLEAN DEFAULT false
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    preferred_language TEXT,
    marketing_consent BOOLEAN,
    notes TEXT,
    is_active BOOLEAN,
    total_orders BIGINT,
    total_spent DECIMAL(12,2),
    average_order_value DECIMAL(12,2),
    last_order_date TIMESTAMPTZ,
    addresses JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_customer_id UUID;
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
    IF p_customer_id IS NULL AND (p_email IS NULL OR trim(p_email) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar customer_id o email';
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
    
    -- Obtener el ID del cliente
    IF p_customer_id IS NOT NULL THEN
        target_customer_id := p_customer_id;
    ELSIF p_email IS NOT NULL AND trim(p_email) != '' THEN
        SELECT customers.id INTO target_customer_id 
        FROM customers 
        WHERE customers.project_id = p_project_id 
        AND customers.email = lower(trim(p_email));
    END IF;
    
    IF target_customer_id IS NULL THEN
        RAISE EXCEPTION 'Cliente no encontrado';
    END IF;
    
    -- Retornar el cliente con información adicional
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.first_name, c.last_name,
        (c.first_name || ' ' || c.last_name) as full_name,
        c.email, c.phone, c.date_of_birth, c.gender,
        c.preferred_language, c.marketing_consent, c.notes, c.is_active,
        CASE WHEN p_include_order_stats THEN COALESCE(order_stats.total_orders, 0) ELSE 0 END as total_orders,
        CASE WHEN p_include_order_stats THEN COALESCE(order_stats.total_spent, 0) ELSE 0 END as total_spent,
        CASE WHEN p_include_order_stats THEN COALESCE(order_stats.average_order_value, 0) ELSE 0 END as average_order_value,
        CASE WHEN p_include_order_stats THEN order_stats.last_order_date ELSE NULL END as last_order_date,
        CASE WHEN p_include_addresses THEN COALESCE(addresses_json.addresses, '[]'::jsonb) ELSE '[]'::jsonb END as addresses,
        c.created_at, c.updated_at
    FROM customers c
    LEFT JOIN (
        SELECT 
            customer_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_spent,
            AVG(total_amount) as average_order_value,
            MAX(order_date) as last_order_date
        FROM orders 
        WHERE project_id = p_project_id AND p_include_order_stats = true
        GROUP BY customer_id
    ) order_stats ON c.id = order_stats.customer_id
    LEFT JOIN (
        SELECT 
            customer_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'type', address_type,
                    'address_line_1', address_line_1,
                    'address_line_2', address_line_2,
                    'city', city,
                    'state', state,
                    'country', country,
                    'postal_code', postal_code,
                    'is_default', is_default
                ) ORDER BY is_default DESC, created_at
            ) as addresses
        FROM customer_addresses 
        WHERE p_include_addresses = true
        GROUP BY customer_id
    ) addresses_json ON c.id = addresses_json.customer_id
    WHERE c.id = target_customer_id;
    
END;
$$;

-- ================================================
-- ✏️ 3. UPDATE CUSTOMER
-- ================================================

CREATE OR REPLACE FUNCTION update_customer(
    p_project_id UUID,
    p_customer_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_date_of_birth DATE DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_preferred_language TEXT DEFAULT NULL,
    p_marketing_consent BOOLEAN DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    preferred_language TEXT,
    marketing_consent BOOLEAN,
    notes TEXT,
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
    
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'customer_id es requerido';
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
    
    -- Verificar permisos de gestión de clientes
    IF NOT (user_permissions_json->>'can_manage_customers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar clientes';
    END IF;
    
    -- Validar que el cliente pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Cliente no encontrado en este proyecto';
    END IF;
    
    -- Validar email único si se proporciona
    IF p_email IS NOT NULL AND trim(p_email) != '' THEN
        IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Formato de email inválido';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM customers 
            WHERE project_id = p_project_id 
            AND email = lower(trim(p_email))
            AND id != p_customer_id
        ) THEN
            RAISE EXCEPTION 'Ya existe otro cliente con el email "%"', p_email;
        END IF;
    END IF;
    
    -- Validar género si se proporciona
    IF p_gender IS NOT NULL AND p_gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say') THEN
        RAISE EXCEPTION 'Género inválido. Use: male, female, other, prefer_not_to_say';
    END IF;
    
    -- Validar idioma preferido si se proporciona
    IF p_preferred_language IS NOT NULL AND p_preferred_language NOT IN ('es', 'en', 'fr', 'pt') THEN
        RAISE EXCEPTION 'Idioma inválido. Use: es, en, fr, pt';
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE customers SET
        first_name = COALESCE(trim(p_first_name), first_name),
        last_name = COALESCE(trim(p_last_name), last_name),
        email = CASE 
            WHEN p_email IS NOT NULL THEN lower(trim(p_email))
            ELSE email 
        END,
        phone = COALESCE(trim(p_phone), phone),
        date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
        gender = COALESCE(p_gender, gender),
        preferred_language = COALESCE(p_preferred_language, preferred_language),
        marketing_consent = COALESCE(p_marketing_consent, marketing_consent),
        notes = COALESCE(trim(p_notes), notes),
        is_active = COALESCE(p_is_active, is_active),
        updated_by = current_user_id,
        updated_at = NOW()
    WHERE id = p_customer_id AND project_id = p_project_id;
    
    -- Verificar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con ID "%" no encontrado en este proyecto', p_customer_id;
    END IF;
    
    -- Retornar el cliente actualizado
    RETURN QUERY
    SELECT 
        c.id, c.project_id, c.first_name, c.last_name,
        (c.first_name || ' ' || c.last_name) as full_name,
        c.email, c.phone, c.date_of_birth, c.gender,
        c.preferred_language, c.marketing_consent, c.notes, c.is_active,
        c.created_at, c.updated_at
    FROM customers c
    WHERE c.id = p_customer_id;
    
END;
$$;

-- ================================================
-- 🗑️ 4. DELETE CUSTOMER
-- ================================================

CREATE OR REPLACE FUNCTION delete_customer(
    p_project_id UUID,
    p_customer_id UUID,
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
    
    -- Verificar permisos de gestión de clientes
    IF NOT (user_permissions_json->>'can_manage_customers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar clientes';
    END IF;
    
    -- Validar que el cliente pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Cliente no encontrado en este proyecto';
    END IF;
    
    -- Verificar dependencias si no es eliminación forzada
    IF NOT p_force_delete THEN
        -- Contar órdenes
        SELECT COUNT(*) INTO order_count
        FROM orders 
        WHERE customer_id = p_customer_id;
        
        IF order_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el cliente porque tiene % órdenes. Use force_delete=true para desactivar.', order_count;
        END IF;
    END IF;
    
    -- Si es eliminación forzada y hay órdenes, solo desactivar
    IF p_force_delete AND order_count > 0 THEN
        UPDATE customers SET 
            is_active = false,
            updated_by = current_user_id,
            updated_at = NOW()
        WHERE id = p_customer_id AND project_id = p_project_id;
        
        RETURN true;
    END IF;
    
    -- Eliminar direcciones del cliente primero
    DELETE FROM customer_addresses WHERE customer_id = p_customer_id;
    
    -- Eliminar el cliente
    DELETE FROM customers 
    WHERE id = p_customer_id AND project_id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con ID "%" no encontrado en este proyecto', p_customer_id;
    END IF;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 📋 5. LIST CUSTOMERS
-- ================================================

CREATE OR REPLACE FUNCTION list_customers(
    p_project_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_is_active BOOLEAN DEFAULT NULL,
    p_marketing_consent BOOLEAN DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_preferred_language TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'first_name',
    p_sort_order TEXT DEFAULT 'asc'
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    preferred_language TEXT,
    marketing_consent BOOLEAN,
    notes TEXT,
    is_active BOOLEAN,
    total_orders BIGINT,
    total_spent DECIMAL(12,2),
    last_order_date TIMESTAMPTZ,
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
        WHEN p_sort_by IN ('first_name', 'last_name', 'email', 'created_at', 'updated_at', 'total_spent') 
        THEN p_sort_by 
        ELSE 'first_name' 
    END;
    
    sort_direction := CASE 
        WHEN lower(p_sort_order) IN ('asc', 'desc') 
        THEN lower(p_sort_order) 
        ELSE 'asc' 
    END;
    
    -- Retornar clientes con filtros aplicados
    RETURN QUERY EXECUTE format('
        WITH filtered_customers AS (
            SELECT 
                c.id, c.project_id, c.first_name, c.last_name,
                (c.first_name || '' '' || c.last_name) as full_name,
                c.email, c.phone, c.date_of_birth, c.gender,
                c.preferred_language, c.marketing_consent, c.notes, c.is_active,
                COALESCE(order_stats.total_orders, 0) as total_orders,
                COALESCE(order_stats.total_spent, 0) as total_spent,
                order_stats.last_order_date,
                c.created_at, c.updated_at
            FROM customers c
            LEFT JOIN (
                SELECT 
                    customer_id,
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_spent,
                    MAX(order_date) as last_order_date
                FROM orders 
                WHERE project_id = $1
                GROUP BY customer_id
            ) order_stats ON c.id = order_stats.customer_id
            WHERE c.project_id = $1
            AND ($2 IS NULL OR c.is_active = $2)
            AND ($3 IS NULL OR c.marketing_consent = $3)
            AND ($4 IS NULL OR c.gender = $4)
            AND ($5 IS NULL OR c.preferred_language = $5)
            AND ($6 IS NULL OR 
                 lower(c.first_name) LIKE $6 OR 
                 lower(c.last_name) LIKE $6 OR
                 lower(c.email) LIKE $6 OR
                 lower(c.phone) LIKE $6)
            ORDER BY %I %s, c.first_name ASC
        ),
        counted_customers AS (
            SELECT *, COUNT(*) OVER() as total_count
            FROM filtered_customers
        )
        SELECT * FROM counted_customers
        LIMIT $7 OFFSET $8', 
        sort_column, sort_direction
    ) USING p_project_id, p_is_active, p_marketing_consent, p_gender, 
            p_preferred_language, search_term, p_limit, p_offset;
    
END;
$$;

-- ================================================
-- 🏠 6. MANAGE CUSTOMER ADDRESS
-- ================================================

CREATE OR REPLACE FUNCTION manage_customer_address(
    p_project_id UUID,
    p_customer_id UUID,
    p_action TEXT, -- 'create', 'update', 'delete', 'set_default'
    p_address_id UUID DEFAULT NULL,
    p_address_type TEXT DEFAULT 'shipping',
    p_address_line_1 TEXT DEFAULT NULL,
    p_address_line_2 TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_is_default BOOLEAN DEFAULT false
)
RETURNS TABLE(
    id UUID,
    customer_id UUID,
    address_type TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    is_default BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    new_address_id UUID;
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
    
    IF p_action NOT IN ('create', 'update', 'delete', 'set_default') THEN
        RAISE EXCEPTION 'Acción inválida. Use: create, update, delete, set_default';
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
    
    -- Verificar permisos de gestión de clientes
    IF NOT (user_permissions_json->>'can_manage_customers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar clientes';
    END IF;
    
    -- Validar que el cliente exista
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Cliente no encontrado en este proyecto';
    END IF;
    
    -- Procesar según la acción
    CASE p_action
        WHEN 'create' THEN
            -- Validar campos requeridos para crear
            IF p_address_type NOT IN ('shipping', 'billing') THEN
                RAISE EXCEPTION 'Tipo de dirección inválido. Use: shipping, billing';
            END IF;
            
            IF p_address_line_1 IS NULL OR trim(p_address_line_1) = '' THEN
                RAISE EXCEPTION 'address_line_1 es requerido';
            END IF;
            
            IF p_city IS NULL OR trim(p_city) = '' THEN
                RAISE EXCEPTION 'city es requerido';
            END IF;
            
            IF p_country IS NULL OR trim(p_country) = '' THEN
                RAISE EXCEPTION 'country es requerido';
            END IF;
            
            -- Si es la primera dirección o se marca como default, desmarcar otras
            IF p_is_default OR NOT EXISTS (SELECT 1 FROM customer_addresses WHERE customer_id = p_customer_id) THEN
                UPDATE customer_addresses SET is_default = false WHERE customer_id = p_customer_id;
                p_is_default := true;
            END IF;
            
            -- Crear nueva dirección
            INSERT INTO customer_addresses (
                customer_id, address_type, address_line_1, address_line_2,
                city, state, country, postal_code, is_default
            ) VALUES (
                p_customer_id, p_address_type, trim(p_address_line_1), trim(p_address_line_2),
                trim(p_city), trim(p_state), trim(p_country), trim(p_postal_code), p_is_default
            )
            RETURNING id INTO new_address_id;
            
        WHEN 'update' THEN
            IF p_address_id IS NULL THEN
                RAISE EXCEPTION 'address_id es requerido para actualizar';
            END IF;
            
            -- Si se marca como default, desmarcar otras
            IF p_is_default THEN
                UPDATE customer_addresses SET is_default = false 
                WHERE customer_id = p_customer_id AND id != p_address_id;
            END IF;
            
            -- Actualizar dirección
            UPDATE customer_addresses SET
                address_type = COALESCE(p_address_type, address_type),
                address_line_1 = COALESCE(trim(p_address_line_1), address_line_1),
                address_line_2 = COALESCE(trim(p_address_line_2), address_line_2),
                city = COALESCE(trim(p_city), city),
                state = COALESCE(trim(p_state), state),
                country = COALESCE(trim(p_country), country),
                postal_code = COALESCE(trim(p_postal_code), postal_code),
                is_default = COALESCE(p_is_default, is_default),
                updated_at = NOW()
            WHERE id = p_address_id AND customer_id = p_customer_id;
            
            new_address_id := p_address_id;
            
        WHEN 'delete' THEN
            IF p_address_id IS NULL THEN
                RAISE EXCEPTION 'address_id es requerido para eliminar';
            END IF;
            
            DELETE FROM customer_addresses 
            WHERE id = p_address_id AND customer_id = p_customer_id;
            
            RETURN;
            
        WHEN 'set_default' THEN
            IF p_address_id IS NULL THEN
                RAISE EXCEPTION 'address_id es requerido para establecer como default';
            END IF;
            
            -- Desmarcar todas las direcciones como default
            UPDATE customer_addresses SET is_default = false WHERE customer_id = p_customer_id;
            
            -- Marcar la seleccionada como default
            UPDATE customer_addresses SET is_default = true, updated_at = NOW()
            WHERE id = p_address_id AND customer_id = p_customer_id;
            
            new_address_id := p_address_id;
    END CASE;
    
    -- Retornar la dirección afectada
    RETURN QUERY
    SELECT 
        ca.id, ca.customer_id, ca.address_type, ca.address_line_1, ca.address_line_2,
        ca.city, ca.state, ca.country, ca.postal_code, ca.is_default,
        ca.created_at, ca.updated_at
    FROM customer_addresses ca
    WHERE ca.id = new_address_id;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_customer IS 'Crea un nuevo cliente con validaciones completas';
COMMENT ON FUNCTION get_customer IS 'Obtiene un cliente por ID/email con estadísticas de órdenes y direcciones';
COMMENT ON FUNCTION update_customer IS 'Actualiza un cliente existente con validaciones';
COMMENT ON FUNCTION delete_customer IS 'Elimina un cliente y maneja dependencias';
COMMENT ON FUNCTION list_customers IS 'Lista clientes con filtros avanzados y estadísticas';
COMMENT ON FUNCTION manage_customer_address IS 'Gestiona direcciones de cliente (CRUD completo)';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_customer TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer TO authenticated;
GRANT EXECUTE ON FUNCTION delete_customer TO authenticated;
GRANT EXECUTE ON FUNCTION list_customers TO authenticated;
GRANT EXECUTE ON FUNCTION manage_customer_address TO authenticated;

-- ================================================
-- ✅ FUNCIONES CUSTOMERS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_customer() - Crear cliente nuevo con validaciones completas
-- ✅ get_customer() - Obtener cliente por ID/email con estadísticas y direcciones
-- ✅ update_customer() - Actualizar cliente con validaciones de unicidad
-- ✅ delete_customer() - Eliminar cliente (soft delete si tiene órdenes)
-- ✅ list_customers() - Listar clientes con filtros avanzados y estadísticas
-- ✅ manage_customer_address() - Gestión completa de direcciones de cliente

/*
EJEMPLOS DE USO:

-- Crear cliente
SELECT * FROM create_customer(
    'uuid-proyecto',
    'María',
    'González',
    'maria.gonzalez@email.com',
    '+52-555-987-6543',
    '1990-05-15',
    'female',
    'es',
    true,
    'Cliente frecuente, prefiere envíos express'
);

-- Obtener cliente con estadísticas y direcciones
SELECT * FROM get_customer(
    'uuid-proyecto',
    p_customer_id := 'uuid-cliente',
    p_include_order_stats := true,
    p_include_addresses := true
);

-- Listar clientes activos con consentimiento de marketing
SELECT * FROM list_customers(
    'uuid-proyecto',
    p_is_active := true,
    p_marketing_consent := true,
    p_search := 'maría'
);

-- Crear dirección de envío
SELECT * FROM manage_customer_address(
    'uuid-proyecto',
    'uuid-cliente',
    'create',
    p_address_type := 'shipping',
    p_address_line_1 := 'Av. Reforma 456',
    p_city := 'CDMX',
    p_country := 'México',
    p_postal_code := '06600',
    p_is_default := true
);
*/