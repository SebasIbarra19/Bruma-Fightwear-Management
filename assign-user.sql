-- Asignación específica para el usuario de BRUMA Fightwear
-- Este script debe ejecutarse después de que el usuario se registre

-- ==========================================
-- ASIGNAR BRUMA FIGHTWEAR AL USUARIO ESPECÍFICO
-- ==========================================

DO $$
DECLARE
    bruma_project_id UUID;
    target_user_id UUID;
    user_email TEXT := 'ibarraherrerasebastian@gmail.com';
BEGIN
    -- Buscar el usuario por email (se ejecutará cuando exista en auth.users)
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Obtener el ID del proyecto BRUMA
    SELECT id INTO bruma_project_id 
    FROM public.projects 
    WHERE slug = 'bruma-fightwear';
    
    -- Si ambos existen, crear la asignación
    IF target_user_id IS NOT NULL AND bruma_project_id IS NOT NULL THEN
        INSERT INTO public.user_projects (user_id, project_id, role)
        VALUES (target_user_id, bruma_project_id, 'owner')
        ON CONFLICT (user_id, project_id) 
        DO UPDATE SET 
            role = 'owner',
            is_active = true;
        
        RAISE NOTICE 'Usuario % asignado exitosamente al proyecto BRUMA Fightwear como owner', user_email;
    ELSE
        IF target_user_id IS NULL THEN
            RAISE NOTICE 'Usuario % no encontrado. Asegúrate de que se haya registrado primero.', user_email;
        END IF;
        IF bruma_project_id IS NULL THEN
            RAISE NOTICE 'Proyecto BRUMA Fightwear no encontrado. Ejecuta primero database-setup.sql';
        END IF;
    END IF;
END $$;

-- ==========================================
-- VERIFICAR ASIGNACIONES
-- ==========================================

-- Consulta para verificar las asignaciones
SELECT 
    u.email,
    p.name as project_name,
    up.role,
    up.assigned_at,
    up.is_active
FROM auth.users u
JOIN public.user_projects up ON u.id = up.user_id
JOIN public.projects p ON up.project_id = p.id
WHERE u.email = 'ibarraherrerasebastian@gmail.com'
ORDER BY up.assigned_at DESC;