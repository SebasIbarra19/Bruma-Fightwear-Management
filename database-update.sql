-- Script simplificado para actualizar estructura existente
-- Ejecutar este script si ya tienes una tabla projects básica

-- ==========================================
-- 1. CREAR TABLA PROJECTS SI NO EXISTE
-- ==========================================

-- Crear la tabla projects completa si no existe
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. AGREGAR COLUMNAS FALTANTES A PROJECTS
-- ==========================================

-- Agregar columnas faltantes a la tabla projects existente
DO $$
BEGIN
    -- project_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE public.projects ADD COLUMN project_type VARCHAR(50) NOT NULL DEFAULT 'generic';
    END IF;
    
    -- is_public
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_public') THEN
        ALTER TABLE public.projects ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    -- config
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'config') THEN
        ALTER TABLE public.projects ADD COLUMN config JSONB DEFAULT '{}';
    END IF;
    
    -- logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'logo_url') THEN
        ALTER TABLE public.projects ADD COLUMN logo_url TEXT;
    END IF;
    
    -- color_scheme
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'color_scheme') THEN
        ALTER TABLE public.projects ADD COLUMN color_scheme JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#8b5cf6"}';
    END IF;
    
    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'is_active') THEN
        ALTER TABLE public.projects ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    RAISE NOTICE 'Columnas agregadas exitosamente a la tabla projects';
END $$;

-- ==========================================
-- 3. CREAR NUEVAS TABLAS
-- ==========================================

-- Tabla de asignaciones de usuarios a proyectos
CREATE TABLE IF NOT EXISTS public.user_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_by UUID,
    is_active BOOLEAN DEFAULT true,
    user_config JSONB DEFAULT '{}',
    
    UNIQUE(user_id, project_id)
);

-- Tabla para datos específicos de e-commerce
CREATE TABLE IF NOT EXISTS public.ecommerce_config (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    store_name VARCHAR(255),
    store_description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    manage_inventory BOOLEAN DEFAULT true,
    allow_backorders BOOLEAN DEFAULT false,
    track_quantity BOOLEAN DEFAULT true,
    shipping_enabled BOOLEAN DEFAULT true,
    shipping_config JSONB DEFAULT '{}',
    payment_config JSONB DEFAULT '{}',
    additional_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. INSERTAR PROYECTOS
-- ==========================================

-- BRUMA Fightwear
INSERT INTO public.projects (name, slug, description, project_type, is_public, config, color_scheme)
VALUES (
    'BRUMA Fightwear',
    'bruma-fightwear',
    'Tienda especializada en ropa deportiva y equipamiento de combate',
    'ecommerce',
    false,
    '{"features": ["products", "inventory", "orders", "customers", "analytics"], "specialized": true}',
    '{"primary": "#dc2626", "secondary": "#b91c1c"}'
) ON CONFLICT (slug) DO UPDATE SET
    project_type = EXCLUDED.project_type,
    is_public = EXCLUDED.is_public,
    config = EXCLUDED.config,
    color_scheme = EXCLUDED.color_scheme;

-- E-commerce genérico
INSERT INTO public.projects (name, slug, description, project_type, is_public, config, color_scheme)
VALUES (
    'E-commerce',
    'ecommerce-generic',
    'Plataforma completa para tiendas online',
    'ecommerce',
    true,
    '{"features": ["products", "inventory", "orders", "customers", "analytics"], "demo_mode": true}',
    '{"primary": "#10b981", "secondary": "#059669"}'
) ON CONFLICT (slug) DO UPDATE SET
    project_type = EXCLUDED.project_type,
    is_public = EXCLUDED.is_public,
    config = EXCLUDED.config,
    color_scheme = EXCLUDED.color_scheme;

-- ==========================================
-- 5. CONFIGURACIÓN BRUMA
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
    0.0825,
    true,
    false,
    true,
    true,
    '{"methods": ["standard", "express"], "zones": ["national", "international"]}'::jsonb,
    '{"providers": ["stripe", "paypal"]}'::jsonb,
    '{"categories": ["boxing", "mma", "muay_thai", "accessories"]}'::jsonb
FROM public.projects p
WHERE p.slug = 'bruma-fightwear'
ON CONFLICT (project_id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    store_description = EXCLUDED.store_description,
    currency = EXCLUDED.currency,
    tax_rate = EXCLUDED.tax_rate,
    additional_config = EXCLUDED.additional_config;

-- ==========================================
-- 6. ROW LEVEL SECURITY
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_config ENABLE ROW LEVEL SECURITY;

-- Políticas para projects
DROP POLICY IF EXISTS "Users can view public projects or assigned projects" ON public.projects;
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

-- Políticas para user_projects
DROP POLICY IF EXISTS "Users can view their own project assignments" ON public.user_projects;
CREATE POLICY "Users can view their own project assignments" ON public.user_projects
    FOR SELECT USING (user_id = auth.uid());

-- Políticas para ecommerce_config
DROP POLICY IF EXISTS "Users can view ecommerce config for assigned projects" ON public.ecommerce_config;
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
-- 7. FUNCIONES
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
    SELECT id INTO project_uuid 
    FROM public.projects 
    WHERE slug = project_slug_param AND is_active = true;
    
    IF project_uuid IS NULL THEN
        RETURN false;
    END IF;
    
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
-- 8. TRIGGERS
-- ==========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para ecommerce_config
DROP TRIGGER IF EXISTS update_ecommerce_config_updated_at ON public.ecommerce_config;
CREATE TRIGGER update_ecommerce_config_updated_at 
    BEFORE UPDATE ON public.ecommerce_config 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- FINALIZACIÓN
-- ==========================================

SELECT 'Script de actualización completado exitosamente!' as result;