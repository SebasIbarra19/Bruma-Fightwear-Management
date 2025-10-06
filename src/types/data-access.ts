// ================================================
// 🎯 TIPOS PARA DATA ACCESS LAYER
// Interfaces adicionales para la capa de datos
// ================================================

// Tipos base para respuestas de API
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ================================================
// 📊 INTERFACES DE ENTIDADES PRINCIPALES
// ================================================

export interface Project {
  id: string
  name: string
  slug: string
  description?: string | null
  project_type: string
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  config?: Record<string, any> | null
  logo_url?: string | null
  color_scheme?: Record<string, any> | null
}

export interface UserProject {
  id: string
  user_id: string
  project_id: string
  role: string
  permissions?: Record<string, any> | null
  assigned_at: string
  assigned_by?: string | null
  is_active: boolean
  user_config?: Record<string, any> | null
}

export interface Product {
  id: string
  project_id: string
  category_id?: string | null
  product_line_id?: string | null
  name: string
  slug: string
  description?: string | null
  short_description?: string | null
  sku: string
  base_price: number
  base_cost: number
  weight?: number | null
  materials?: any[] | null
  care_instructions?: string | null
  tags?: string[] | null
  track_inventory: boolean
  continue_selling_when_out_of_stock: boolean
  is_active: boolean
  sort_order?: number | null
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  project_id: string
  product_id: string
  name: string
  sku: string
  price: number
  cost: number
  weight?: number | null
  attributes: Record<string, any>
  track_inventory: boolean
  is_active: boolean
  sort_order?: number | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  project_id: string
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  is_active: boolean
  sort_order?: number | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  project_id: string
  name: string
  company_name: string
  tax_id: string
  email?: string | null
  phone?: string | null
  website?: string | null
  contact_person?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  payment_terms: string
  credit_limit?: number | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  project_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  customer_group?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  project_id: string
  customer_id?: string | null
  order_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  currency: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  notes?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string | null
  product_variant_id?: string | null
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  project_id: string
  product_id?: string | null
  product_variant_id?: string | null
  location_id?: string | null
  quantity_available: number
  quantity_reserved: number
  quantity_on_order: number
  reorder_point?: number | null
  reorder_quantity?: number | null
  cost_per_unit?: number | null
  last_updated: string
}

// ================================================
// 🔧 TIPOS PARA PARÁMETROS DE FUNCIONES
// ================================================

export interface CreateProductParams {
  project_id: string
  name: string
  slug: string
  sku: string
  category_id?: string | null
  product_line_id?: string | null
  description?: string | null
  short_description?: string | null
  base_price?: number
  base_cost?: number
  weight?: number | null
  materials?: any[]
  care_instructions?: string | null
  tags?: string[]
  track_inventory?: boolean
  continue_selling_when_out_of_stock?: boolean
  is_active?: boolean
  sort_order?: number | null
}

export interface CreateSupplierParams {
  project_id: string
  name: string
  company_name: string
  tax_id: string
  email?: string | null
  phone?: string | null
  website?: string | null
  contact_person?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postal_code?: string | null
  payment_terms?: string
  credit_limit?: number | null
  notes?: string | null
  is_active?: boolean
}

export interface CreateOrderParams {
  project_id: string
  customer_id?: string | null
  order_number: string
  status?: string
  currency?: string
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string | null
}

// ================================================
// 🔍 TIPOS PARA FILTROS Y BÚSQUEDAS
// ================================================

export interface ProductFilters {
  project_id: string
  category_id?: string
  product_line_id?: string
  is_active?: boolean
  search?: string
  tags?: string[]
  min_price?: number
  max_price?: number
  track_inventory?: boolean
}

export interface SupplierFilters {
  project_id: string
  is_active?: boolean
  country?: string
  search?: string
}

export interface OrderFilters {
  project_id: string
  customer_id?: string
  status?: string[]
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}