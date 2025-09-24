// Tipos de base de datos para SmartAdmin Multi-Proyecto
export interface Database {
  public: {
    Tables: {
      // Tabla principal de proyectos
      projects: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          project_type: string
          is_public: boolean
          created_at: string
          updated_at: string
          config: Record<string, any> | null
          logo_url: string | null
          color_scheme: Record<string, any> | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          project_type?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
          config?: Record<string, any> | null
          logo_url?: string | null
          color_scheme?: Record<string, any> | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          project_type?: string
          is_public?: boolean
          updated_at?: string
          config?: Record<string, any> | null
          logo_url?: string | null
          color_scheme?: Record<string, any> | null
          is_active?: boolean
        }
      }
      // Tabla de asignaciones usuario-proyecto
      user_projects: {
        Row: {
          id: string
          user_id: string
          project_id: string
          role: string
          permissions: Record<string, any> | null
          assigned_at: string
          assigned_by: string | null
          is_active: boolean
          user_config: Record<string, any> | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          role?: string
          permissions?: Record<string, any> | null
          assigned_at?: string
          assigned_by?: string | null
          is_active?: boolean
          user_config?: Record<string, any> | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          role?: string
          permissions?: Record<string, any> | null
          assigned_by?: string | null
          is_active?: boolean
          user_config?: Record<string, any> | null
        }
      }
      // Tabla de configuración e-commerce
      ecommerce_config: {
        Row: {
          project_id: string
          store_name: string | null
          store_description: string | null
          currency: string
          tax_rate: number
          manage_inventory: boolean
          allow_backorders: boolean
          track_quantity: boolean
          shipping_enabled: boolean
          shipping_config: Record<string, any> | null
          payment_config: Record<string, any> | null
          additional_config: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          store_name?: string | null
          store_description?: string | null
          currency?: string
          tax_rate?: number
          manage_inventory?: boolean
          allow_backorders?: boolean
          track_quantity?: boolean
          shipping_enabled?: boolean
          shipping_config?: Record<string, any> | null
          payment_config?: Record<string, any> | null
          additional_config?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_id?: string
          store_name?: string | null
          store_description?: string | null
          currency?: string
          tax_rate?: number
          manage_inventory?: boolean
          allow_backorders?: boolean
          track_quantity?: boolean
          shipping_enabled?: boolean
          shipping_config?: Record<string, any> | null
          payment_config?: Record<string, any> | null
          additional_config?: Record<string, any> | null
          updated_at?: string
        }
      }
      // Tabla de líneas de productos
      product_lines: {
        Row: {
          id: string
          project_id: string
          name: string
          slug: string
          description: string | null
          season: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          slug: string
          description?: string | null
          season?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          slug?: string
          description?: string | null
          season?: string | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      // Tabla de categorías
      categories: {
        Row: {
          id: string
          project_id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      // Tabla de productos
      products: {
        Row: {
          id: string
          project_id: string
          category_id: string
          product_line_id: string | null
          name: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string | null
          price: number
          compare_price: number | null
          cost: number | null
          track_inventory: boolean
          continue_selling_when_out_of_stock: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          category_id: string
          product_line_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          price: number
          compare_price?: number | null
          cost?: number | null
          track_inventory?: boolean
          continue_selling_when_out_of_stock?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          category_id?: string
          product_line_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string | null
          price?: number
          compare_price?: number | null
          cost?: number | null
          track_inventory?: boolean
          continue_selling_when_out_of_stock?: boolean
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      // Tabla de variantes de productos
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          variant_type: string
          variant_value: string
          price_adjustment: number
          cost_adjustment: number
          inventory_quantity: number
          inventory_policy: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          variant_type: string
          variant_value: string
          price_adjustment?: number
          cost_adjustment?: number
          inventory_quantity?: number
          inventory_policy?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          variant_type?: string
          variant_value?: string
          price_adjustment?: number
          cost_adjustment?: number
          inventory_quantity?: number
          inventory_policy?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_projects: {
        Args: {
          user_uuid: string
        }
        Returns: {
          project_id: string
          project_name: string
          project_slug: string
          project_description: string | null
          project_type: string
          user_role: string
          color_scheme: Record<string, any> | null
          config: Record<string, any> | null
          assigned_at: string
        }[]
      }
      assign_user_to_project: {
        Args: {
          user_uuid: string
          project_slug_param: string
          user_role_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      project_type: 'ecommerce' | 'saas' | 'custom' | 'generic'
      user_role: 'owner' | 'admin' | 'user' | 'viewer'
    }
  }
}

// ==========================================
// TIPOS DERIVADOS PARA LA APLICACIÓN
// ==========================================

// Tipo para proyecto con información del usuario
export interface UserProject {
  project_id: string
  project_name: string
  project_slug: string
  project_description: string | null
  project_type: string
  user_role: string
  color_scheme: Record<string, any> | null
  config: Record<string, any> | null
  assigned_at: string
}

// Tipo simplificado para mostrar en las cards
export interface ProjectCard {
  id: string
  name: string
  slug: string
  description: string
  type: string
  role?: string
  colors: {
    primary: string
    secondary: string
  }
  features: string[]
  isPublic: boolean
  isAssigned?: boolean
}

// Tipo para configuración de e-commerce
export interface EcommerceSettings {
  project_id: string
  store_name: string
  store_description: string
  currency: string
  tax_rate: number
  manage_inventory: boolean
  allow_backorders: boolean
  track_quantity: boolean
  shipping_enabled: boolean
  shipping_config: Record<string, any>
  payment_config: Record<string, any>
  additional_config: Record<string, any>
}

// Tipo para autenticación de usuario
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

// Tipo para el contexto de proyecto actual
export interface ProjectContext {
  project: UserProject
  ecommerceConfig?: EcommerceSettings
  permissions: string[]
  isOwner: boolean
  canEdit: boolean
  canView: boolean
}

// ==========================================
// CONSTANTES Y ENUMS
// ==========================================

export const PROJECT_TYPES = {
  ECOMMERCE: 'ecommerce',
  SAAS: 'saas',
  CUSTOM: 'custom',
  GENERIC: 'generic'
} as const

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
} as const

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  COMING_SOON: 'coming_soon'
} as const

// Mapeo de tipos de proyecto a colores por defecto
export const PROJECT_TYPE_COLORS = {
  [PROJECT_TYPES.ECOMMERCE]: {
    primary: '#10b981',
    secondary: '#059669'
  },
  [PROJECT_TYPES.SAAS]: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },
  [PROJECT_TYPES.CUSTOM]: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },
  [PROJECT_TYPES.GENERIC]: {
    primary: '#6b7280',
    secondary: '#4b5563'
  }
} as const

// Permisos por rol
export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: ['read', 'write', 'delete', 'admin', 'invite', 'configure'],
  [USER_ROLES.ADMIN]: ['read', 'write', 'delete', 'invite', 'configure'],
  [USER_ROLES.USER]: ['read', 'write'],
  [USER_ROLES.VIEWER]: ['read']
} as const

// ==========================================
// TIPOS PARA COMPONENTES ESPECÍFICOS
// ==========================================

// Para el dashboard principal
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  recentActivity: number
  userRole: string
}

// Para cards de proyecto en el dashboard
export interface DashboardProject extends ProjectCard {
  lastAccessed?: string
  notifications?: number
  quickActions: Array<{
    label: string
    href: string
    icon: string
  }>
}

// Para formularios de configuración
export interface ProjectConfigForm {
  name: string
  description: string
  project_type: string
  is_public: boolean
  color_scheme: {
    primary: string
    secondary: string
  }
  config: Record<string, any>
}

// ==========================================
// TIPOS PARA PRODUCTOS - FASE 1
// ==========================================

// Línea o colección de productos
export interface ProductLine {
  id: string
  project_id: string
  name: string
  slug: string
  description?: string
  season?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Categoría de productos
export interface Category {
  id: string
  project_id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Producto
export interface Product {
  id: string
  project_id: string
  category_id: string
  product_line_id?: string
  name: string
  slug: string
  description?: string
  short_description?: string
  sku?: string
  price: number
  compare_price?: number
  cost?: number
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Relaciones populadas
  category?: Category
  product_line?: ProductLine
  variants?: ProductVariant[]
}

// Variante de producto
export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku?: string
  variant_type: string
  variant_value: string
  price_adjustment: number
  cost_adjustment: number
  inventory_quantity: number
  inventory_policy: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Calculados
  final_price?: number
  final_cost?: number
}

// Tipos para formularios
export interface ProductLineFormData {
  name: string
  slug: string
  description?: string
  season?: string
  is_active: boolean
  sort_order: number
}

export interface CategoryFormData {
  name: string
  slug: string
  description?: string
  is_active: boolean
  sort_order: number
}

export interface ProductFormData {
  name: string
  slug: string
  description?: string
  short_description?: string
  sku?: string
  price: number
  compare_price?: number
  cost?: number
  category_id: string
  product_line_id?: string
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  sort_order: number
}

export interface ProductVariantFormData {
  name: string
  sku?: string
  variant_type: string
  variant_value: string
  price_adjustment: number
  cost_adjustment: number
  inventory_quantity: number
  inventory_policy: string
  is_active: boolean
  sort_order: number
}