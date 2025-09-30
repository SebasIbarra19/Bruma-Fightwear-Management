-- ================================================
-- 🏢 STORED PROCEDURES - SUPPLIERS
-- Funciones para gestión completa de proveedores
-- ================================================

-- ⚠️ IMPORTANTE: Ejecutar DESPUÉS del script 01_create_schema_complete.sql
-- Este script contiene todos los CRUD básicos para la tabla suppliers

-- ================================================
-- 📝 1. CREATE SUPPLIER
-- ================================================

CREATE OR REPLACE FUNCTION create_supplier(
    p_project_id UUID,
    p_name TEXT,
    p_company_name TEXT,
    p_tax_id TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_payment_terms TEXT DEFAULT 'net_30',
    p_credit_limit DECIMAL(12,2) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    company_name TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
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
    
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'El nombre del proveedor es requerido';
    END IF;
    
    IF p_company_name IS NULL OR trim(p_company_name) = '' THEN
        RAISE EXCEPTION 'El nombre de la empresa es requerido';
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
    
    -- Verificar permisos de gestión de proveedores
    IF NOT (user_permissions_json->>'can_manage_suppliers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar proveedores';
    END IF;
    
    -- Validar que no exista otro proveedor con el mismo tax_id en el proyecto
    IF p_tax_id IS NOT NULL AND trim(p_tax_id) != '' THEN
        IF EXISTS (
            SELECT 1 FROM suppliers 
            WHERE project_id = p_project_id 
            AND tax_id = upper(trim(p_tax_id))
            AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Ya existe un proveedor activo con el Tax ID "%"', p_tax_id;
        END IF;
    END IF;
    
    -- Validar email si se proporciona
    IF p_email IS NOT NULL AND trim(p_email) != '' THEN
        IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Formato de email inválido';
        END IF;
    END IF;
    
    -- Validar términos de pago
    IF p_payment_terms NOT IN ('net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'due_on_receipt', 'cash_on_delivery') THEN
        RAISE EXCEPTION 'Términos de pago inválidos. Use: net_15, net_30, net_45, net_60, net_90, due_on_receipt, cash_on_delivery';
    END IF;
    
    -- Insertar el nuevo proveedor
    INSERT INTO suppliers (
        project_id, name, company_name, tax_id, email, phone, website,
        contact_person, address, city, state, country, postal_code,
        payment_terms, credit_limit, notes, is_active, created_by, updated_by
    ) VALUES (
        p_project_id, trim(p_name), trim(p_company_name), 
        CASE WHEN p_tax_id IS NOT NULL THEN upper(trim(p_tax_id)) ELSE NULL END,
        CASE WHEN p_email IS NOT NULL THEN lower(trim(p_email)) ELSE NULL END,
        trim(p_phone), trim(p_website), trim(p_contact_person),
        trim(p_address), trim(p_city), trim(p_state), trim(p_country), trim(p_postal_code),
        p_payment_terms, p_credit_limit, trim(p_notes), p_is_active,
        current_user_id, current_user_id
    );
    
    -- Retornar el proveedor creado
    RETURN QUERY
    SELECT 
        s.id, s.project_id, s.name, s.company_name, s.tax_id, s.email, s.phone,
        s.website, s.contact_person, s.address, s.city, s.state, s.country,
        s.postal_code, s.payment_terms, s.credit_limit, s.notes, s.is_active,
        s.created_at, s.updated_at
    FROM suppliers s
    WHERE s.project_id = p_project_id 
    AND s.company_name = trim(p_company_name)
    AND s.created_by = current_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
    
END;
$$;

-- ================================================
-- 🔍 2. GET SUPPLIER
-- ================================================

CREATE OR REPLACE FUNCTION get_supplier(
    p_project_id UUID,
    p_supplier_id UUID DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL,
    p_include_purchase_stats BOOLEAN DEFAULT false
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    company_name TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
    notes TEXT,
    is_active BOOLEAN,
    total_purchase_orders BIGINT,
    total_amount_purchased DECIMAL(12,2),
    last_purchase_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    target_supplier_id UUID;
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
    IF p_supplier_id IS NULL AND (p_tax_id IS NULL OR trim(p_tax_id) = '') THEN
        RAISE EXCEPTION 'Debe proporcionar supplier_id o tax_id';
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
    
    -- Obtener el ID del proveedor
    IF p_supplier_id IS NOT NULL THEN
        target_supplier_id := p_supplier_id;
    ELSIF p_tax_id IS NOT NULL AND trim(p_tax_id) != '' THEN
        SELECT suppliers.id INTO target_supplier_id 
        FROM suppliers 
        WHERE suppliers.project_id = p_project_id 
        AND suppliers.tax_id = upper(trim(p_tax_id));
    END IF;
    
    IF target_supplier_id IS NULL THEN
        RAISE EXCEPTION 'Proveedor no encontrado';
    END IF;
    
    -- Retornar el proveedor con información adicional
    RETURN QUERY
    SELECT 
        s.id, s.project_id, s.name, s.company_name, s.tax_id, s.email, s.phone,
        s.website, s.contact_person, s.address, s.city, s.state, s.country,
        s.postal_code, s.payment_terms, s.credit_limit, s.notes, s.is_active,
        CASE WHEN p_include_purchase_stats THEN COALESCE(po_stats.total_orders, 0) ELSE 0 END as total_purchase_orders,
        CASE WHEN p_include_purchase_stats THEN COALESCE(po_stats.total_amount, 0) ELSE 0 END as total_amount_purchased,
        CASE WHEN p_include_purchase_stats THEN po_stats.last_order_date ELSE NULL END as last_purchase_date,
        s.created_at, s.updated_at
    FROM suppliers s
    LEFT JOIN (
        SELECT 
            supplier_id,
            COUNT(*) as total_orders,
            SUM(total_amount) as total_amount,
            MAX(order_date) as last_order_date
        FROM purchase_orders 
        WHERE project_id = p_project_id AND p_include_purchase_stats = true
        GROUP BY supplier_id
    ) po_stats ON s.id = po_stats.supplier_id
    WHERE s.id = target_supplier_id;
    
END;
$$;

-- ================================================
-- ✏️ 3. UPDATE SUPPLIER
-- ================================================

CREATE OR REPLACE FUNCTION update_supplier(
    p_project_id UUID,
    p_supplier_id UUID,
    p_name TEXT DEFAULT NULL,
    p_company_name TEXT DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_payment_terms TEXT DEFAULT NULL,
    p_credit_limit DECIMAL(12,2) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    company_name TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
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
    
    IF p_supplier_id IS NULL THEN
        RAISE EXCEPTION 'supplier_id es requerido';
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
    
    -- Verificar permisos de gestión de proveedores
    IF NOT (user_permissions_json->>'can_manage_suppliers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar proveedores';
    END IF;
    
    -- Validar que el proveedor pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM suppliers 
        WHERE id = p_supplier_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Proveedor no encontrado en este proyecto';
    END IF;
    
    -- Validar tax_id único si se proporciona
    IF p_tax_id IS NOT NULL AND trim(p_tax_id) != '' THEN
        IF EXISTS (
            SELECT 1 FROM suppliers 
            WHERE project_id = p_project_id 
            AND tax_id = upper(trim(p_tax_id))
            AND id != p_supplier_id
            AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Ya existe otro proveedor activo con el Tax ID "%"', p_tax_id;
        END IF;
    END IF;
    
    -- Validar email si se proporciona
    IF p_email IS NOT NULL AND trim(p_email) != '' THEN
        IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Formato de email inválido';
        END IF;
    END IF;
    
    -- Validar términos de pago si se proporcionan
    IF p_payment_terms IS NOT NULL THEN
        IF p_payment_terms NOT IN ('net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'due_on_receipt', 'cash_on_delivery') THEN
            RAISE EXCEPTION 'Términos de pago inválidos. Use: net_15, net_30, net_45, net_60, net_90, due_on_receipt, cash_on_delivery';
        END IF;
    END IF;
    
    -- Actualizar solo los campos proporcionados
    UPDATE suppliers SET
        name = COALESCE(trim(p_name), name),
        company_name = COALESCE(trim(p_company_name), company_name),
        tax_id = CASE 
            WHEN p_tax_id IS NOT NULL THEN 
                CASE WHEN trim(p_tax_id) = '' THEN NULL ELSE upper(trim(p_tax_id)) END
            ELSE tax_id 
        END,
        email = CASE 
            WHEN p_email IS NOT NULL THEN 
                CASE WHEN trim(p_email) = '' THEN NULL ELSE lower(trim(p_email)) END
            ELSE email 
        END,
        phone = COALESCE(trim(p_phone), phone),
        website = COALESCE(trim(p_website), website),
        contact_person = COALESCE(trim(p_contact_person), contact_person),
        address = COALESCE(trim(p_address), address),
        city = COALESCE(trim(p_city), city),
        state = COALESCE(trim(p_state), state),
        country = COALESCE(trim(p_country), country),
        postal_code = COALESCE(trim(p_postal_code), postal_code),
        payment_terms = COALESCE(p_payment_terms, payment_terms),
        credit_limit = COALESCE(p_credit_limit, credit_limit),
        notes = COALESCE(trim(p_notes), notes),
        is_active = COALESCE(p_is_active, is_active),
        updated_by = current_user_id,
        updated_at = NOW()
    WHERE id = p_supplier_id AND project_id = p_project_id;
    
    -- Verificar que se actualizó algo
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proveedor con ID "%" no encontrado en este proyecto', p_supplier_id;
    END IF;
    
    -- Retornar el proveedor actualizado
    RETURN QUERY
    SELECT 
        s.id, s.project_id, s.name, s.company_name, s.tax_id, s.email, s.phone,
        s.website, s.contact_person, s.address, s.city, s.state, s.country,
        s.postal_code, s.payment_terms, s.credit_limit, s.notes, s.is_active,
        s.created_at, s.updated_at
    FROM suppliers s
    WHERE s.id = p_supplier_id;
    
END;
$$;

-- ================================================
-- 🗑️ 4. DELETE SUPPLIER
-- ================================================

CREATE OR REPLACE FUNCTION delete_supplier(
    p_project_id UUID,
    p_supplier_id UUID,
    p_force_delete BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    purchase_order_count INTEGER;
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
    
    IF p_supplier_id IS NULL THEN
        RAISE EXCEPTION 'supplier_id es requerido';
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
    
    -- Verificar permisos de gestión de proveedores
    IF NOT (user_permissions_json->>'can_manage_suppliers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar proveedores';
    END IF;
    
    -- Validar que el proveedor pertenezca al proyecto
    IF NOT EXISTS (
        SELECT 1 FROM suppliers 
        WHERE id = p_supplier_id AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Proveedor no encontrado en este proyecto';
    END IF;
    
    -- Verificar dependencias si no es eliminación forzada
    IF NOT p_force_delete THEN
        -- Contar órdenes de compra
        SELECT COUNT(*) INTO purchase_order_count
        FROM purchase_orders 
        WHERE supplier_id = p_supplier_id;
        
        IF purchase_order_count > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el proveedor porque tiene % órdenes de compra. Use force_delete=true para desactivar.', purchase_order_count;
        END IF;
    END IF;
    
    -- Si es eliminación forzada y hay órdenes, solo desactivar
    IF p_force_delete AND purchase_order_count > 0 THEN
        UPDATE suppliers SET 
            is_active = false,
            updated_by = current_user_id,
            updated_at = NOW()
        WHERE id = p_supplier_id AND project_id = p_project_id;
        
        RETURN true;
    END IF;
    
    -- Eliminar el proveedor
    DELETE FROM suppliers 
    WHERE id = p_supplier_id AND project_id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proveedor con ID "%" no encontrado en este proyecto', p_supplier_id;
    END IF;
    
    RETURN true;
    
END;
$$;

-- ================================================
-- 📋 5. LIST SUPPLIERS
-- ================================================

CREATE OR REPLACE FUNCTION list_suppliers(
    p_project_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_is_active BOOLEAN DEFAULT NULL,
    p_payment_terms TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'company_name',
    p_sort_order TEXT DEFAULT 'asc'
)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    name TEXT,
    company_name TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
    notes TEXT,
    is_active BOOLEAN,
    total_purchase_orders BIGINT,
    total_amount_purchased DECIMAL(12,2),
    last_purchase_date TIMESTAMPTZ,
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
        WHEN p_sort_by IN ('name', 'company_name', 'tax_id', 'payment_terms', 'created_at', 'updated_at') 
        THEN p_sort_by 
        ELSE 'company_name' 
    END;
    
    sort_direction := CASE 
        WHEN lower(p_sort_order) IN ('asc', 'desc') 
        THEN lower(p_sort_order) 
        ELSE 'asc' 
    END;
    
    -- Retornar proveedores con filtros aplicados
    RETURN QUERY EXECUTE format('
        WITH filtered_suppliers AS (
            SELECT 
                s.id, s.project_id, s.name, s.company_name, s.tax_id, s.email, s.phone,
                s.website, s.contact_person, s.address, s.city, s.state, s.country,
                s.postal_code, s.payment_terms, s.credit_limit, s.notes, s.is_active,
                COALESCE(po_stats.total_orders, 0) as total_purchase_orders,
                COALESCE(po_stats.total_amount, 0) as total_amount_purchased,
                po_stats.last_order_date as last_purchase_date,
                s.created_at, s.updated_at
            FROM suppliers s
            LEFT JOIN (
                SELECT 
                    supplier_id,
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_amount,
                    MAX(order_date) as last_order_date
                FROM purchase_orders 
                WHERE project_id = $1
                GROUP BY supplier_id
            ) po_stats ON s.id = po_stats.supplier_id
            WHERE s.project_id = $1
            AND ($2 IS NULL OR s.is_active = $2)
            AND ($3 IS NULL OR s.payment_terms = $3)
            AND ($4 IS NULL OR 
                 lower(s.name) LIKE $4 OR 
                 lower(s.company_name) LIKE $4 OR
                 lower(s.tax_id) LIKE $4 OR
                 lower(s.contact_person) LIKE $4 OR
                 lower(s.email) LIKE $4)
            ORDER BY %I %s, s.company_name ASC
        ),
        counted_suppliers AS (
            SELECT *, COUNT(*) OVER() as total_count
            FROM filtered_suppliers
        )
        SELECT * FROM counted_suppliers
        LIMIT $5 OFFSET $6', 
        sort_column, sort_direction
    ) USING p_project_id, p_is_active, p_payment_terms, search_term, p_limit, p_offset;
    
END;
$$;

-- ================================================
-- 🔄 6. DUPLICATE SUPPLIER
-- ================================================

CREATE OR REPLACE FUNCTION duplicate_supplier(
    p_project_id UUID,
    p_supplier_id UUID,
    p_new_name TEXT DEFAULT NULL,
    p_new_company_name TEXT DEFAULT NULL,
    p_new_tax_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    company_name TEXT,
    tax_id TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_permissions_json JSONB;
    source_supplier RECORD;
    new_supplier_id UUID;
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
    
    IF p_supplier_id IS NULL THEN
        RAISE EXCEPTION 'supplier_id es requerido';
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
    
    -- Verificar permisos de gestión de proveedores
    IF NOT (user_permissions_json->>'can_manage_suppliers')::boolean THEN
        RAISE EXCEPTION 'No tienes permisos para gestionar proveedores';
    END IF;
    
    -- Obtener proveedor fuente
    SELECT * INTO source_supplier
    FROM suppliers 
    WHERE id = p_supplier_id AND project_id = p_project_id;
    
    IF source_supplier IS NULL THEN
        RAISE EXCEPTION 'Proveedor fuente no encontrado';
    END IF;
    
    -- Preparar nombres únicos
    p_new_name := COALESCE(p_new_name, source_supplier.name || ' (Copia)');
    p_new_company_name := COALESCE(p_new_company_name, source_supplier.company_name || ' (Copia)');
    p_new_tax_id := COALESCE(p_new_tax_id, source_supplier.tax_id || '-COPY');
    
    -- Verificar unicidad de tax_id
    IF p_new_tax_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM suppliers WHERE project_id = p_project_id AND tax_id = p_new_tax_id) THEN
            p_new_tax_id := p_new_tax_id || '-' || extract(epoch from now())::text;
        END IF;
    END IF;
    
    -- Crear proveedor duplicado
    INSERT INTO suppliers (
        project_id, name, company_name, tax_id, email, phone, website,
        contact_person, address, city, state, country, postal_code,
        payment_terms, credit_limit, notes, is_active, created_by, updated_by
    ) VALUES (
        source_supplier.project_id, p_new_name, p_new_company_name, p_new_tax_id,
        source_supplier.email, source_supplier.phone, source_supplier.website,
        source_supplier.contact_person, source_supplier.address, source_supplier.city,
        source_supplier.state, source_supplier.country, source_supplier.postal_code,
        source_supplier.payment_terms, source_supplier.credit_limit, source_supplier.notes,
        source_supplier.is_active, current_user_id, current_user_id
    )
    RETURNING id INTO new_supplier_id;
    
    -- Retornar información del proveedor duplicado
    RETURN QUERY
    SELECT 
        new_supplier_id,
        p_new_name,
        p_new_company_name,
        p_new_tax_id;
    
END;
$$;

-- ================================================
-- 🔧 PERMISOS Y COMENTARIOS
-- ================================================

-- Comentarios en las funciones
COMMENT ON FUNCTION create_supplier IS 'Crea un nuevo proveedor con validaciones completas';
COMMENT ON FUNCTION get_supplier IS 'Obtiene un proveedor por ID/Tax ID con estadísticas de compras';
COMMENT ON FUNCTION update_supplier IS 'Actualiza un proveedor existente con validaciones';
COMMENT ON FUNCTION delete_supplier IS 'Elimina un proveedor y maneja dependencias';
COMMENT ON FUNCTION list_suppliers IS 'Lista proveedores con filtros avanzados y estadísticas';
COMMENT ON FUNCTION duplicate_supplier IS 'Duplica un proveedor con nuevos identificadores únicos';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION get_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION update_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION delete_supplier TO authenticated;  
GRANT EXECUTE ON FUNCTION list_suppliers TO authenticated;
GRANT EXECUTE ON FUNCTION duplicate_supplier TO authenticated;

-- ================================================
-- ✅ FUNCIONES SUPPLIERS COMPLETADAS
-- ================================================

-- Las siguientes funciones están listas para usar:
-- ✅ create_supplier() - Crear proveedor nuevo con validaciones completas
-- ✅ get_supplier() - Obtener proveedor por ID/Tax ID con estadísticas de compras
-- ✅ update_supplier() - Actualizar proveedor con validaciones de unicidad
-- ✅ delete_supplier() - Eliminar proveedor (soft delete si tiene órdenes)
-- ✅ list_suppliers() - Listar proveedores con filtros y estadísticas
-- ✅ duplicate_supplier() - Duplicar proveedor con identificadores únicos

/*
EJEMPLOS DE USO:

-- Crear proveedor
SELECT * FROM create_supplier(
    'uuid-proyecto',
    'Juan Pérez',
    'Textiles Premium S.A.',
    'RFC12345678',
    'contacto@textilespremium.com',
    '+52-555-123-4567',
    'https://textilespremium.com',
    'Juan Pérez',
    'Av. Revolución 123',
    'CDMX',
    'Ciudad de México',
    'México',
    '01000',
    'net_30',
    100000.00,
    'Proveedor principal de telas'
);

-- Obtener proveedor con estadísticas
SELECT * FROM get_supplier(
    'uuid-proyecto',
    p_supplier_id := 'uuid-proveedor',
    p_include_purchase_stats := true
);

-- Listar proveedores activos
SELECT * FROM list_suppliers(
    'uuid-proyecto',
    p_is_active := true,
    p_search := 'textiles'
);

-- Duplicar proveedor
SELECT * FROM duplicate_supplier(
    'uuid-proyecto',
    'uuid-proveedor-original',
    'Juan Pérez Sucursal',
    'Textiles Premium Sucursal S.A.',
    'RFC87654321'
);
*/