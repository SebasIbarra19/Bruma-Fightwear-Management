-- Script para configurar correctamente los usuarios en Supabase
-- Este script crea las funciones y triggers necesarios para manejar usuarios

-- 1. Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Crear perfil para el usuario existente (ibarraherrerasebastian@gmail.com)
-- Nota: Reemplazar el ID con el real del usuario cuando lo sepamos

-- 4. Asignar el usuario al proyecto E-commerce
-- INSERT INTO public.user_projects (user_id, project_id, role, is_active)
-- VALUES (
--   'USER_ID_AQUI', 
--   '820c116f-adaf-4609-9b97-c727e687de79',
--   'admin',
--   true
-- );

-- 5. Habilitar RLS (Row Level Security) en las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de seguridad para usuarios
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 7. Políticas para user_projects
CREATE POLICY "Users can view own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir inserción automática por triggers
CREATE POLICY "Enable insert for service role" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);