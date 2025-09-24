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
      // ==========================================
      // FASE 2 - INVENTARIO Y PROVEEDORES
      // ==========================================
      
      // Tabla de proveedores
      suppliers: {
        Row: {
          id: string
          project_id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          tax_id: string | null
          payment_terms: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          notes?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      
      // Tabla de inventario
      inventory: {
        Row: {
          id: string
          project_id: string
          product_id: string | null
          product_variant_id: string | null
          supplier_id: string | null
          sku: string
          quantity_available: number
          quantity_reserved: number
          quantity_on_order: number
          reorder_level: number | null
          reorder_quantity: number | null
          unit_cost: number | null
          last_cost: number | null
          average_cost: number | null
          location: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          product_id?: string | null
          product_variant_id?: string | null
          supplier_id?: string | null
          sku: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_on_order?: number
          reorder_level?: number | null
          reorder_quantity?: number | null
          unit_cost?: number | null
          last_cost?: number | null
          average_cost?: number | null
          location?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          product_id?: string | null
          product_variant_id?: string | null
          supplier_id?: string | null
          sku?: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_on_order?: number
          reorder_level?: number | null
          reorder_quantity?: number | null
          unit_cost?: number | null
          last_cost?: number | null
          average_cost?: number | null
          location?: string | null
          notes?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      
      // Tabla de órdenes de compra
      purchase_orders: {
        Row: {
          id: string
          project_id: string
          supplier_id: string
          order_number: string
          status: string
          order_date: string
          expected_date: string | null
          received_date: string | null
          subtotal: number
          tax_amount: number
          shipping_cost: number
          total_amount: number
          currency: string
          payment_terms: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          supplier_id: string
          order_number?: string
          status?: string
          order_date?: string
          expected_date?: string | null
          received_date?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_cost?: number
          total_amount?: number
          currency?: string
          payment_terms?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          supplier_id?: string
          order_number?: string
          status?: string
          order_date?: string
          expected_date?: string | null
          received_date?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_cost?: number
          total_amount?: number
          currency?: string
          payment_terms?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      
      // Tabla de items de órdenes de compra
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          product_id: string | null
          product_variant_id: string | null
          sku: string
          description: string
          quantity_ordered: number
          quantity_received: number
          unit_cost: number
          total_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchase_order_id: string
          product_id?: string | null
          product_variant_id?: string | null
          sku: string
          description: string
          quantity_ordered: number
          quantity_received?: number
          unit_cost: number
          total_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchase_order_id?: string
          product_id?: string | null
          product_variant_id?: string | null
          sku?: string
          description?: string
          quantity_ordered?: number
          quantity_received?: number
          unit_cost?: number
          total_cost?: number
          notes?: string | null
          updated_at?: string
        }
      }
      
      // Tabla de movimientos de inventario
      inventory_movements: {
        Row: {
          id: string
          project_id: string
          inventory_id: string
          movement_type: string
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          inventory_id: string
          movement_type: string
          quantity: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          inventory_id?: string
          movement_type?: string
          quantity?: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
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
      // Fase 2 - Enums de Inventario y Proveedores
      purchase_order_status: 'draft' | 'pending' | 'ordered' | 'partial' | 'received' | 'cancelled'
      inventory_movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'purchase' | 'sale' | 'loss'
      inventory_policy: 'track' | 'no_track' | 'continue' | 'deny'
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

// ==========================================
// FASE 2 - TIPOS DERIVADOS INVENTARIO Y PROVEEDORES
// ==========================================

// Tipos base de la Fase 2
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']

export type Inventory = Database['public']['Tables']['inventory']['Row']
export type InventoryInsert = Database['public']['Tables']['inventory']['Insert']
export type InventoryUpdate = Database['public']['Tables']['inventory']['Update']

export type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row']
export type PurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert']
export type PurchaseOrderUpdate = Database['public']['Tables']['purchase_orders']['Update']

export type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row']
export type PurchaseOrderItemInsert = Database['public']['Tables']['purchase_order_items']['Insert']
export type PurchaseOrderItemUpdate = Database['public']['Tables']['purchase_order_items']['Update']

export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row']
export type InventoryMovementInsert = Database['public']['Tables']['inventory_movements']['Insert']
export type InventoryMovementUpdate = Database['public']['Tables']['inventory_movements']['Update']

// Enums de la Fase 2
export type PurchaseOrderStatus = Database['public']['Enums']['purchase_order_status']
export type InventoryMovementType = Database['public']['Enums']['inventory_movement_type']
export type InventoryPolicy = Database['public']['Enums']['inventory_policy']

// Tipos extendidos para la interfaz
export interface SupplierWithStats extends Supplier {
  total_orders?: number
  pending_orders?: number
  total_spent?: number
  last_order_date?: string
}

export interface InventoryWithDetails extends Inventory {
  product_name?: string
  product_sku?: string
  variant_name?: string
  supplier_name?: string
  total_quantity?: number
  available_quantity?: number
  low_stock?: boolean
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier_name?: string
  supplier_email?: string
  items_count?: number
  items?: PurchaseOrderItemWithDetails[]
}

export interface PurchaseOrderItemWithDetails extends PurchaseOrderItem {
  product_name?: string
  variant_name?: string
  remaining_quantity?: number
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  inventory_sku?: string
  product_name?: string
  variant_name?: string
  user_name?: string
}

// Tipos para formularios de la Fase 2
export interface SupplierFormData {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  tax_id?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
}

export interface InventoryFormData {
  product_id?: string
  product_variant_id?: string
  supplier_id?: string
  sku: string
  quantity_available: number
  quantity_reserved: number
  quantity_on_order: number
  reorder_level?: number
  reorder_quantity?: number
  unit_cost?: number
  location?: string
  notes?: string
  is_active: boolean
}

export interface PurchaseOrderFormData {
  supplier_id: string
  order_number?: string
  status: PurchaseOrderStatus
  order_date: string
  expected_date?: string
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  currency: string
  payment_terms?: string
  notes?: string
  items: PurchaseOrderItemFormData[]
}

export interface PurchaseOrderItemFormData {
  product_id?: string
  product_variant_id?: string
  sku: string
  description: string
  quantity_ordered: number
  unit_cost: number
  total_cost: number
  notes?: string
}

export interface InventoryMovementFormData {
  inventory_id: string
  movement_type: InventoryMovementType
  quantity: number
  unit_cost?: number
  total_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
}

// Constantes de la Fase 2
export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft' as const,
  PENDING: 'pending' as const,
  ORDERED: 'ordered' as const,
  PARTIAL: 'partial' as const,
  RECEIVED: 'received' as const,
  CANCELLED: 'cancelled' as const
}

export const INVENTORY_MOVEMENT_TYPES = {
  IN: 'in' as const,
  OUT: 'out' as const,
  ADJUSTMENT: 'adjustment' as const,
  TRANSFER: 'transfer' as const,
  RETURN: 'return' as const,
  PURCHASE: 'purchase' as const,
  SALE: 'sale' as const,
  LOSS: 'loss' as const
}

export const INVENTORY_POLICIES = {
  TRACK: 'track' as const,
  NO_TRACK: 'no_track' as const,
  CONTINUE: 'continue' as const,
  DENY: 'deny' as const
}

// Mapeo de estados de órdenes de compra a colores
export const PURCHASE_ORDER_STATUS_COLORS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  [PURCHASE_ORDER_STATUS.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  [PURCHASE_ORDER_STATUS.ORDERED]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  [PURCHASE_ORDER_STATUS.PARTIAL]: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  [PURCHASE_ORDER_STATUS.RECEIVED]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  [PURCHASE_ORDER_STATUS.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
} as const

// Mapeo de tipos de movimiento a colores y iconos
export const MOVEMENT_TYPE_CONFIG = {
  [INVENTORY_MOVEMENT_TYPES.IN]: { 
    label: 'Entrada', 
    color: 'text-green-600', 
    bg: 'bg-green-100',
    icon: 'ArrowDownIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.OUT]: { 
    label: 'Salida', 
    color: 'text-red-600', 
    bg: 'bg-red-100',
    icon: 'ArrowUpIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.ADJUSTMENT]: { 
    label: 'Ajuste', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-100',
    icon: 'AdjustmentsIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.TRANSFER]: { 
    label: 'Transferencia', 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    icon: 'SwitchHorizontalIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.RETURN]: { 
    label: 'Devolución', 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    icon: 'ReplyIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.PURCHASE]: { 
    label: 'Compra', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-100',
    icon: 'ShoppingCartIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.SALE]: { 
    label: 'Venta', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    icon: 'CashIcon'
  },
  [INVENTORY_MOVEMENT_TYPES.LOSS]: { 
    label: 'Pérdida', 
    color: 'text-red-800', 
    bg: 'bg-red-200',
    icon: 'ExclamationTriangleIcon'
  }
} as const