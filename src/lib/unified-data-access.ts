// ================================================
// 🎯 UNIFIED DATA ACCESS LAYER
// Capa unificada para acceso a datos usando Supabase + Stored Procedures
// ================================================

import type {
  ApiResponse,
  PaginatedResponse,
  Project,
  Product,
  ProductVariant,
  Category,
  Supplier,
  Customer,
  Order,
  OrderItem,
  Inventory,
  CreateProductParams,
  CreateSupplierParams,
  CreateOrderParams,
  ProductFilters,
  SupplierFilters,
  OrderFilters,
  PaginationParams
} from '@/types/data-access'

import {
  executeStoredProcedure,
  executeStoredProcedureWithCount,
  handleDatabaseError,
  ensureAuthenticated,
  validateUUID,
  validateRequired,
  cleanString,
  transformDatabaseRecord,
  buildSearchQuery,
  calculatePagination,
  logDataAccessOperation
} from './data-access-utils'

// ================================================
// 🎯 CLASE PRINCIPAL DATA ACCESS
// ================================================

export class SupabaseDataAccess {
  
  // ================================================
  // 🏢 PROJECTS - Gestión de Proyectos
  // ================================================

  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const data = await executeStoredProcedure<Project>(
        'get_user_projects',
        {},
        'getProjects'
      )
      
      return {
        data: data.map(transformDatabaseRecord<Project>),
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getProjects', {}, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    try {
      validateUUID(projectId, 'Project ID')
      
      const data = await executeStoredProcedure<Project>(
        'get_project_by_id',
        { p_project_id: projectId },
        'getProject'
      )
      
      return {
        data: data[0] ? transformDatabaseRecord<Project>(data[0]) : null,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getProject', { projectId }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  // ================================================
  // 🎽 PRODUCTS - Gestión de Productos
  // ================================================

  async getProducts(
    filters: ProductFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    try {
      validateUUID(filters.project_id, 'Project ID')
      validateRequired(filters.project_id, 'Project ID')
      
      const paginationParams = calculatePagination(pagination?.page, pagination?.limit)
      const searchQuery = buildSearchQuery(filters.search)
      
      const params = {
        p_project_id: filters.project_id,
        p_category_id: filters.category_id || null,
        p_is_active: filters.is_active ?? null,
        p_search: searchQuery,
        p_limit: paginationParams.limit,
        p_offset: paginationParams.offset
      }
      
      const countParams = {
        p_project_id: filters.project_id,
        p_category_id: filters.category_id || null,
        p_is_active: filters.is_active ?? null,
        p_search: searchQuery
      }
      
      const { data, count } = await executeStoredProcedureWithCount<Product>(
        'get_products',
        'count_products',
        params,
        countParams,
        'getProducts'
      )
      
      return {
        data: {
          data: data.map(transformDatabaseRecord<Product>),
          total: count,
          page: paginationParams.page,
          limit: paginationParams.limit,
          totalPages: paginationParams.totalPages(count)
        },
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getProducts', { filters, pagination }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      validateUUID(productId, 'Product ID')
      
      const data = await executeStoredProcedure<Product>(
        'get_product_by_id',
        { p_product_id: productId },
        'getProduct'
      )
      
      return {
        data: data[0] ? transformDatabaseRecord<Product>(data[0]) : null,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getProduct', { productId }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async createProduct(params: CreateProductParams): Promise<ApiResponse<Product>> {
    try {
      validateUUID(params.project_id, 'Project ID')
      validateRequired(params.name, 'Product name')
      validateRequired(params.slug, 'Product slug')
      validateRequired(params.sku, 'Product SKU')
      
      const cleanParams = {
        p_project_id: params.project_id,
        p_name: cleanString(params.name)!,
        p_slug: cleanString(params.slug)!,
        p_sku: cleanString(params.sku)!,
        p_category_id: params.category_id || null,
        p_product_line_id: params.product_line_id || null,
        p_description: cleanString(params.description),
        p_short_description: cleanString(params.short_description),
        p_base_price: params.base_price || 0,
        p_base_cost: params.base_cost || 0,
        p_weight: params.weight || null,
        p_materials: params.materials || [],
        p_care_instructions: cleanString(params.care_instructions),
        p_tags: params.tags || [],
        p_track_inventory: params.track_inventory ?? true,
        p_continue_selling_when_out_of_stock: params.continue_selling_when_out_of_stock ?? false,
        p_is_active: params.is_active ?? true,
        p_sort_order: params.sort_order || null
      }
      
      const data = await executeStoredProcedure<Product>(
        'create_product',
        cleanParams,
        'createProduct'
      )
      
      logDataAccessOperation('createProduct', cleanParams, true)
      
      return {
        data: data[0] ? transformDatabaseRecord<Product>(data[0]) : null,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('createProduct', params, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async updateProduct(
    productId: string, 
    updates: Partial<CreateProductParams>
  ): Promise<ApiResponse<Product>> {
    try {
      validateUUID(productId, 'Product ID')
      
      const cleanUpdates = {
        p_product_id: productId,
        p_name: updates.name ? cleanString(updates.name) : null,
        p_slug: updates.slug ? cleanString(updates.slug) : null,
        p_sku: updates.sku ? cleanString(updates.sku) : null,
        p_category_id: updates.category_id || null,
        p_description: cleanString(updates.description),
        p_short_description: cleanString(updates.short_description),
        p_base_price: updates.base_price || null,
        p_base_cost: updates.base_cost || null,
        p_weight: updates.weight || null,
        p_materials: updates.materials || null,
        p_care_instructions: cleanString(updates.care_instructions),
        p_tags: updates.tags || null,
        p_track_inventory: updates.track_inventory ?? null,
        p_continue_selling_when_out_of_stock: updates.continue_selling_when_out_of_stock ?? null,
        p_is_active: updates.is_active ?? null,
        p_sort_order: updates.sort_order || null
      }
      
      const data = await executeStoredProcedure<Product>(
        'update_product',
        cleanUpdates,
        'updateProduct'
      )
      
      logDataAccessOperation('updateProduct', { productId, updates }, true)
      
      return {
        data: data[0] ? transformDatabaseRecord<Product>(data[0]) : null,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('updateProduct', { productId, updates }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse<boolean>> {
    try {
      validateUUID(productId, 'Product ID')
      
      await executeStoredProcedure(
        'delete_product',
        { p_product_id: productId },
        'deleteProduct'
      )
      
      logDataAccessOperation('deleteProduct', { productId }, true)
      
      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('deleteProduct', { productId }, false, error)
      return {
        data: false,
        error: (error as Error).message,
        success: false
      }
    }
  }

  // ================================================
  // 🏷️ CATEGORIES - Gestión de Categorías
  // ================================================

  async getCategories(projectId: string): Promise<ApiResponse<Category[]>> {
    try {
      validateUUID(projectId, 'Project ID')
      
      const data = await executeStoredProcedure<Category>(
        'get_categories',
        { p_project_id: projectId },
        'getCategories'
      )
      
      return {
        data: data.map(transformDatabaseRecord<Category>),
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getCategories', { projectId }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  // ================================================
  // 🏢 SUPPLIERS - Gestión de Proveedores
  // ================================================

  async getSuppliers(
    filters: SupplierFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    try {
      validateUUID(filters.project_id, 'Project ID')
      
      const paginationParams = calculatePagination(pagination?.page, pagination?.limit)
      const searchQuery = buildSearchQuery(filters.search)
      
      const params = {
        p_project_id: filters.project_id,
        p_is_active: filters.is_active ?? null,
        p_search: searchQuery,
        p_limit: paginationParams.limit,
        p_offset: paginationParams.offset
      }
      
      const countParams = {
        p_project_id: filters.project_id,
        p_is_active: filters.is_active ?? null,
        p_search: searchQuery
      }
      
      const { data, count } = await executeStoredProcedureWithCount<Supplier>(
        'get_suppliers',
        'count_suppliers',
        params,
        countParams,
        'getSuppliers'
      )
      
      return {
        data: {
          data: data.map(transformDatabaseRecord<Supplier>),
          total: count,
          page: paginationParams.page,
          limit: paginationParams.limit,
          totalPages: paginationParams.totalPages(count)
        },
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getSuppliers', { filters, pagination }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  async createSupplier(params: CreateSupplierParams): Promise<ApiResponse<Supplier>> {
    try {
      validateUUID(params.project_id, 'Project ID')
      validateRequired(params.name, 'Supplier name')
      validateRequired(params.company_name, 'Company name')
      validateRequired(params.tax_id, 'Tax ID')
      
      const cleanParams = {
        p_project_id: params.project_id,
        p_name: cleanString(params.name)!,
        p_company_name: cleanString(params.company_name)!,
        p_tax_id: cleanString(params.tax_id)!,
        p_email: cleanString(params.email),
        p_phone: cleanString(params.phone),
        p_website: cleanString(params.website),
        p_contact_person: cleanString(params.contact_person),
        p_address: cleanString(params.address),
        p_city: cleanString(params.city),
        p_state: cleanString(params.state),
        p_country: cleanString(params.country),
        p_postal_code: cleanString(params.postal_code),
        p_payment_terms: params.payment_terms || 'net_30',
        p_credit_limit: params.credit_limit || null,
        p_notes: cleanString(params.notes),
        p_is_active: params.is_active ?? true
      }
      
      const data = await executeStoredProcedure<Supplier>(
        'create_supplier',
        cleanParams,
        'createSupplier'
      )
      
      logDataAccessOperation('createSupplier', cleanParams, true)
      
      return {
        data: data[0] ? transformDatabaseRecord<Supplier>(data[0]) : null,
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('createSupplier', params, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  // ================================================
  // 📦 ORDERS - Gestión de Pedidos
  // ================================================

  async getOrders(
    filters: OrderFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      validateUUID(filters.project_id, 'Project ID')
      
      const paginationParams = calculatePagination(pagination?.page, pagination?.limit)
      
      const params = {
        p_project_id: filters.project_id,
        p_customer_id: filters.customer_id || null,
        p_status: filters.status || null,
        p_start_date: filters.start_date || null,
        p_end_date: filters.end_date || null,
        p_limit: paginationParams.limit,
        p_offset: paginationParams.offset
      }
      
      const countParams = {
        p_project_id: filters.project_id,
        p_customer_id: filters.customer_id || null,
        p_status: filters.status || null,
        p_start_date: filters.start_date || null,
        p_end_date: filters.end_date || null
      }
      
      const { data, count } = await executeStoredProcedureWithCount<Order>(
        'get_orders',
        'count_orders',
        params,
        countParams,
        'getOrders'
      )
      
      return {
        data: {
          data: data.map(transformDatabaseRecord<Order>),
          total: count,
          page: paginationParams.page,
          limit: paginationParams.limit,
          totalPages: paginationParams.totalPages(count)
        },
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getOrders', { filters, pagination }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }

  // ================================================
  // 📊 INVENTORY - Gestión de Inventario
  // ================================================

  async getInventory(projectId: string): Promise<ApiResponse<Inventory[]>> {
    try {
      validateUUID(projectId, 'Project ID')
      
      const data = await executeStoredProcedure<Inventory>(
        'get_inventory',
        { p_project_id: projectId },
        'getInventory'
      )
      
      return {
        data: data.map(transformDatabaseRecord<Inventory>),
        error: null,
        success: true
      }
    } catch (error) {
      logDataAccessOperation('getInventory', { projectId }, false, error)
      return {
        data: null,
        error: (error as Error).message,
        success: false
      }
    }
  }
}

// ================================================
// 🎯 INSTANCIA SINGLETON EXPORTADA
// ================================================

export const dataAccess = new SupabaseDataAccess()