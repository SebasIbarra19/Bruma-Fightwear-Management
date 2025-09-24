-- SmartAdmin Multi-Project Database Setup
-- Este script configura la base de datos para manejar múltiples proyectos por usuario

-- ==========================================
-- 1. VERIFICAR Y ACTUALIZAR ESTRUCTURA EXISTENTE
-- ==========================================

-- Primero verificamos si la tabla existe y agregamos columnas faltantes
DO $$
BEGIN
    -- Verificar si la tabla projects existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        -- Si no existe, crear la tabla completa
        CREATE TABLE public.projects (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            project_type VARCHAR(50) NOT NULL DEFAULT 'generic',
            is_public BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            config JSONB DEFAULT '{}',
            logo_url TEXT,
            color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#8b5cf6"}',
            is_active BOOLEAN DEFAULT true
        );
    ELSE
        -- Si existe, agregar columnas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'project_type') THEN
            ALTER TABLE public.projects ADD COLUMN project_type VARCHAR(50) NOT NULL DEFAULT 'generic';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_public') THEN
            ALTER TABLE public.projects ADD COLUMN is_public BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'config') THEN
            ALTER TABLE public.projects ADD COLUMN config JSONB DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'logo_url') THEN
            ALTER TABLE public.projects ADD COLUMN logo_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'color_scheme') THEN
            ALTER TABLE public.projects ADD COLUMN color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#8b5cf6"}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_active') THEN
            ALTER TABLE public.projects ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- Tabla de asignaciones de usuarios a proyectos
CREATE TABLE IF NOT EXISTS public.user_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'owner', 'admin', 'user', 'viewer'
    permissions JSONB DEFAULT '{}', -- Permisos específicos del usuario en el proyecto
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_by UUID, -- Quién asignó al usuario
    is_active BOOLEAN DEFAULT true,
    
    -- Configuración personal del usuario para este proyecto
    user_config JSONB DEFAULT '{}',
    
    UNIQUE(user_id, project_id)
);

-- Tabla para datos específicos de e-commerce (para BRUMA y otros)
CREATE TABLE IF NOT EXISTS public.ecommerce_config (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Configuración de la tienda
    store_name VARCHAR(255),
    store_description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Configuración de productos
    manage_inventory BOOLEAN DEFAULT true,
    allow_backorders BOOLEAN DEFAULT false,
    track_quantity BOOLEAN DEFAULT true,
    
    -- Configuración de envíos
    shipping_enabled BOOLEAN DEFAULT true,
    shipping_config JSONB DEFAULT '{}',
    
    -- Configuración de pagos
    payment_config JSONB DEFAULT '{}',
    
    -- Metadatos adicionales
    additional_config JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. INSERTAR PROYECTOS INICIALES
-- ==========================================

-- Proyecto genérico de e-commerce (público)
INSERT INTO public.projects (name, slug, description, project_type, is_public, config, color_scheme)
VALUES (
    'E-commerce',
    'ecommerce-generic',
    'Plataforma completa para tiendas online. Gestión de productos, inventario, ventas, clientes y análisis de rendimiento.',
    'ecommerce',
    true,
    '{"features": ["products", "inventory", "orders", "customers", "analytics"], "demo_mode": true}',
    '{"primary": "#10b981", "secondary": "#059669"}'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto BRUMA Fightwear (privado)
INSERT INTO public.projects (name, slug, description, project_type, is_public, config, color_scheme)
VALUES (
    'BRUMA Fightwear',
    'bruma-fightwear',
    'Tienda especializada en ropa deportiva y equipamiento de combate. Gestión completa con funcionalidades personalizadas.',
    'ecommerce',
    false,
    '{"features": ["products", "inventory", "orders", "customers", "analytics", "custom_categories"], "specialized": true, "niche": "fightwear"}',
    '{"primary": "#dc2626", "secondary": "#b91c1c"}'
) ON CONFLICT (slug) DO NOTHING;

-- Proyecto SaaS (próximamente)
INSERT INTO public.projects (name, slug, description, project_type, is_public, config, color_scheme)
VALUES (
    'Gestión SaaS',
    'saas-management',
    'Plataforma completa para gestionar servicios SaaS con facturación, suscripciones, métricas y soporte al cliente integrado.',
    'saas',
    true,
    '{"features": ["subscriptions", "billing", "analytics", "support"], "status": "coming_soon"}',
    '{"primary": "#3b82f6", "secondary": "#1d4ed8"}'
) ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- 3. ASIGNAR USUARIO ESPECÍFICO A BRUMA
-- ==========================================

-- Asignar BRUMA Fightwear al usuario específico
-- Nota: Este INSERT se ejecutará cuando el usuario se registre o ya exista
DO $$
DECLARE
    bruma_project_id UUID;
    user_email TEXT := 'ibarraherrerasebastian@gmail.com';
BEGIN
    -- Obtener el ID del proyecto BRUMA
    SELECT id INTO bruma_project_id 
    FROM public.projects 
    WHERE slug = 'bruma-fightwear';
    
    -- Si el proyecto existe, crear la asignación (se ejecutará cuando el usuario exista)
    IF bruma_project_id IS NOT NULL THEN
        -- Esta parte se ejecutará más tarde cuando tengamos el user_id real
        RAISE NOTICE 'Proyecto BRUMA Fightwear preparado para asignación al usuario: %', user_email;
    END IF;
END $$;

-- ==========================================
-- 4. CONFIGURACIÓN ESPECÍFICA PARA BRUMA
-- ==========================================

-- Configurar BRUMA como tienda de fightwear
INSERT INTO public.ecommerce_config (
    project_id,
    store_name,
    store_description,
    currency,
    tax_rate,
    manage_inventory,
    allow_backorders,
    track_quantity,
    shipping_enabled,
    shipping_config,
    payment_config,
    additional_config
)
SELECT 
    p.id,
    'BRUMA Fightwear',
    'Tienda especializada en ropa deportiva y equipamiento de combate de alta calidad',
    'USD',
    0.0825, -- 8.25% tax
    true,
    false,
    true,
    true,
    '{"methods": ["standard", "express", "pickup"], "zones": ["national", "international"]}'::jsonb,
    '{"providers": ["stripe", "paypal"], "currencies": ["USD", "EUR"]}'::jsonb,
    '{"categories": ["boxing", "mma", "muay_thai", "kickboxing", "accessories"], "size_charts": true, "custom_sizing": true}'::jsonb
FROM public.projects p
WHERE p.slug = 'bruma-fightwear'
ON CONFLICT (project_id) DO NOTHING;

-- ==========================================
-- 5. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en las tablas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_config ENABLE ROW LEVEL SECURITY;

-- Política para projects: ver proyectos públicos o asignados al usuario
CREATE POLICY "Users can view public projects or assigned projects" ON public.projects
    FOR SELECT USING (
        is_public = true 
        OR id IN (
            SELECT project_id 
            FROM public.user_projects 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Política para user_projects: solo ver sus propias asignaciones
CREATE POLICY "Users can view their own project assignments" ON public.user_projects
    FOR SELECT USING (user_id = auth.uid());

-- Política para ecommerce_config: solo ver configuración de proyectos asignados
CREATE POLICY "Users can view ecommerce config for assigned projects" ON public.ecommerce_config
    FOR SELECT USING (
        project_id IN (
            SELECT project_id 
            FROM public.user_projects 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
        OR project_id IN (
            SELECT id 
            FROM public.projects 
            WHERE is_public = true
        )
    );

-- ==========================================
-- 6. CREAR FUNCIONES ÚTILES
-- ==========================================

-- Función para obtener proyectos de un usuario
CREATE OR REPLACE FUNCTION get_user_projects(user_uuid UUID)
RETURNS TABLE (
    project_id UUID,
    project_name VARCHAR(255),
    project_slug VARCHAR(100),
    project_description TEXT,
    project_type VARCHAR(50),
    user_role VARCHAR(50),
    color_scheme JSONB,
    config JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        p.id as project_id,
        p.name as project_name,
        p.slug as project_slug,
        p.description as project_description,
        p.project_type,
        up.role as user_role,
        p.color_scheme,
        p.config,
        up.assigned_at
    FROM public.projects p
    INNER JOIN public.user_projects up ON p.id = up.project_id
    WHERE up.user_id = user_uuid 
    AND up.is_active = true 
    AND p.is_active = true
    ORDER BY up.assigned_at DESC;
$$;

-- Función para asignar un usuario a un proyecto
CREATE OR REPLACE FUNCTION assign_user_to_project(
    user_uuid UUID,
    project_slug_param VARCHAR(100),
    user_role_param VARCHAR(50) DEFAULT 'user'
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    project_uuid UUID;
BEGIN
    -- Obtener el ID del proyecto
    SELECT id INTO project_uuid 
    FROM public.projects 
    WHERE slug = project_slug_param AND is_active = true;
    
    -- Si el proyecto no existe, retornar false
    IF project_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Insertar la asignación (o actualizarla si ya existe)
    INSERT INTO public.user_projects (user_id, project_id, role)
    VALUES (user_uuid, project_uuid, user_role_param)
    ON CONFLICT (user_id, project_id) 
    DO UPDATE SET 
        role = user_role_param,
        is_active = true;
    
    RETURN true;
END;
$$;

-- ==========================================
-- 7. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ==========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ecommerce_config_updated_at 
    BEFORE UPDATE ON public.ecommerce_config 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON TABLE public.projects IS 'Tabla principal de proyectos disponibles en SmartAdmin';
COMMENT ON TABLE public.user_projects IS 'Asignaciones de usuarios a proyectos específicos';
COMMENT ON TABLE public.ecommerce_config IS 'Configuración específica para proyectos de tipo e-commerce';

COMMENT ON FUNCTION get_user_projects(UUID) IS 'Obtiene todos los proyectos asignados a un usuario específico';
COMMENT ON FUNCTION assign_user_to_project(UUID, VARCHAR, VARCHAR) IS 'Asigna un usuario a un proyecto específico';

-- ==========================================
-- FINALIZACIÓN
-- ==========================================

-- Script completado exitosamente
SELECT 'SmartAdmin multi-project database setup completed successfully!' as result;