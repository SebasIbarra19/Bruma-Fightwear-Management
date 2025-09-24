# BRUMA Fightwear - Sistema Multi-Proyecto

Una plataforma web moderna desarrollada con Next.js, React, TypeScript y Supabase que permite gestionar múltiples proyectos empresariales desde una misma interfaz. Especializada para BRUMA Fightwear con funcionalidades de e-commerce.

## 🎯 Características Principales

### ✅ **Sistema Multi-Proyecto**
- **Gestión de múltiples negocios** desde una misma plataforma
- **Dashboard específico** para cada proyecto asignado al usuario
- **Control de acceso por usuario** con Row Level Security (RLS)
- **Configuraciones independientes** por proyecto

### ✅ **BRUMA Fightwear Especializado**
- **Dashboard dedicado** para ropa deportiva y equipamiento de combate
- **Módulos de e-commerce**: Productos, Pedidos, Clientes, Inventario
- **Estadísticas en tiempo real** del proyecto
- **Configuración especializada** para fightwear

### ✅ **Tecnología Moderna**
- **Next.js 14** con App Router y TypeScript
- **Supabase** para base de datos y autenticación
- **Tailwind CSS** para diseño responsive
- **Row Level Security** para seguridad de datos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Estilos**: Tailwind CSS + shadcn/ui components
- **Base de Datos**: PostgreSQL con funciones específicas
- **Deployment**: Vercel

## 🗄️ Arquitectura de Base de Datos

### Tablas Principales
- **`projects`**: Proyectos con configuraciones específicas
- **`user_projects`**: Asignaciones de usuarios a proyectos con roles
- **`ecommerce_config`**: Configuraciones específicas para e-commerce

### Funciones PostgreSQL
- **`get_user_projects(UUID)`**: Obtiene proyectos asignados a un usuario
- **`assign_user_to_project(UUID, VARCHAR, VARCHAR)`**: Asigna usuarios a proyectos

### Seguridad
- **Row Level Security (RLS)** en todas las tablas
- **Políticas de acceso** basadas en asignaciones de usuario
- **Autenticación JWT** con Supabase Auth

## 🚀 Configuración del Proyecto

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Configuración de Variables de Entorno
Crear archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 3. Configuración de Base de Datos
Ejecutar en Supabase SQL Editor:
```bash
# Para base de datos nueva
1. Ejecutar: database-setup.sql

# Para actualizar base de datos existente
2. Ejecutar: database-update.sql

# Para asignar usuario a BRUMA
3. Ejecutar: assign-user.sql
```

### 4. Desarrollo Local
```bash
npm run dev
```

### 5. Compilación para Producción
```bash
npm run build
npm start
```

## 📱 Estructura del Proyecto

```
src/
├── app/
│   ├── dashboard/           # Dashboard principal del usuario
│   ├── auth/               # Autenticación (login/register)
│   ├── projects/[projectId]/
│   │   └── dashboard/      # Dashboard específico por proyecto
│   └── globals.css         # Estilos globales
├── components/ui/          # Componentes reutilizables
├── lib/                   # Configuraciones (Supabase)
├── types/                 # Definiciones TypeScript
└── utils/                 # Utilidades y helpers
```

## � Sistema de Usuarios y Proyectos

### Roles de Usuario
- **`owner`**: Control total del proyecto
- **`admin`**: Administración del proyecto
- **`user`**: Acceso básico al proyecto
- **`viewer`**: Solo lectura

### Acceso a BRUMA Fightwear
El usuario `ibarraherrerasebastian@gmail.com` tiene acceso como **owner** del proyecto BRUMA Fightwear, permitiendo acceso completo a:
- Dashboard especializado para fightwear
- Gestión de productos de combate
- Control de pedidos e inventario
- Configuraciones específicas de la tienda

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio de GitHub a Vercel
2. Configurar variables de entorno en Vercel
3. Deploy automático en cada push

### Variables de Entorno para Producción
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📝 Scripts Disponibles

- **`npm run dev`**: Servidor de desarrollo
- **`npm run build`**: Compilación para producción  
- **`npm run start`**: Servidor de producción
- **`npm run lint`**: Análisis de código con ESLint
- **`npm run type-check`**: Verificación de tipos TypeScript

## � Archivos de Configuración

- **`database-setup.sql`**: Configuración completa de base de datos
- **`database-update.sql`**: Actualización para bases de datos existentes
- **`assign-user.sql`**: Asignación de usuario a BRUMA Fightwear

## 🤝 Desarrollo

### Agregar Nuevo Proyecto
1. Insertar proyecto en tabla `projects`
2. Configurar `ecommerce_config` si es e-commerce
3. Asignar usuarios con `assign_user_to_project()`
4. Configurar políticas RLS específicas

### Agregar Nuevos Módulos
1. Crear componentes en `src/components/`
2. Actualizar tipos en `src/types/database.ts`
3. Implementar en dashboard específico del proyecto

## � Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

---

**Desarrollado especialmente para BRUMA Fightwear** 🥊
Sistema multi-proyecto con arquitectura escalable para diferentes tipos de negocio.

### 1. Clonar el proyecto
```bash
git clone <repository-url>
cd bruma
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo `.env.example` a `.env.local` y configura las variables:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar Supabase

#### Crear tablas necesarias:
```sql
-- Tabla de usuarios extendida
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   │   ├── login/         # Página de login
│   │   └── register/      # Página de registro
│   ├── dashboard/         # Dashboard principal
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Landing page
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes base del sistema de diseño
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/                  # Configuraciones y utilidades
│   └── supabase.ts       # Cliente de Supabase
├── types/                # Definiciones de tipos TypeScript
│   └── database.ts       # Tipos de base de datos
└── utils/                # Funciones de utilidad
    └── index.ts          # Utilidades generales
```

## 🚀 Deployment en Vercel

### 1. Conectar con GitHub
- Sube tu código a un repositorio de GitHub
- Conecta tu cuenta de Vercel con GitHub

### 2. Configurar el proyecto en Vercel
- Importa el proyecto desde GitHub
- Vercel detectará automáticamente que es un proyecto Next.js

### 3. Configurar variables de entorno en Vercel
En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

### 4. Deploy
- Vercel desplegará automáticamente en cada push a la rama principal
- El primer deploy puede tardar unos minutos

## 📱 Funcionalidades Implementadas

### Autenticación
- ✅ Registro de usuarios con validación de email y contraseña
- ✅ Login con email y contraseña
- ✅ Logout
- ✅ Protección de rutas autenticadas
- ✅ Gestión de sesiones con Supabase

### UI/UX
- ✅ Landing page atractiva y responsive
- ✅ Dashboard con métricas y acciones rápidas
- ✅ Sistema de diseño consistente
- ✅ Componentes reutilizables
- ✅ Navegación intuitiva
- ✅ Estados de carga y error

### Desarrollo
- ✅ TypeScript para tipado estático
- ✅ Estructura de proyecto escalable
- ✅ Configuración de ESLint
- ✅ Variables de entorno configuradas
- ✅ Deployment automático

## 🎨 Personalización del Diseño

El proyecto utiliza un sistema de colores personalizado definido en `tailwind.config.js`:

```javascript
colors: {
  bruma: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  }
}
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar en modo producción
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript
```

## 📈 Próximas Mejoras

- [ ] Gestión completa de proyectos
- [ ] Sistema de notificaciones
- [ ] Integración con APIs externas
- [ ] Dashboard avanzado con gráficos
- [ ] Sistema de roles y permisos
- [ ] Chat en tiempo real
- [ ] Reportes y analytics

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo

Desarrollado por el equipo de BRUMA para proporcionar una solución integral de gestión empresarial.

---

¿Necesitas ayuda? Contacta con nuestro equipo de soporte técnico.