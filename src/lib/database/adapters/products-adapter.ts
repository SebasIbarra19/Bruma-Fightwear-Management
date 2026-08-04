// ================================================
// 📦 PRODUCTS ADAPTER
// Adaptador centralizado para acceso a datos de productos
// Con fallback automático SP → Query
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client'
import { DatabaseError, StoredProcedureError } from '@/lib/api/error-handler'

export interface Product {
  id_producto: number
  codigo: string
  nombre: string
  descripcion: string | null
  id_categoria: number | null
  categoria_nombre: string | null
  activo: boolean
  variante_count: number
  stock_total: number
  fecha_creacion: string
}

export interface ProductWithVariants extends Product {
  variantes: ProductVariant[]
}

export interface ProductVariant {
  id_variante: number
  id_color: number | null
  codigo_variante: string | null
  nombre_variante: string | null
  precio_variante: number | null
  activo: boolean
  stock_tallas: any[] // Simplificado por ahora
}

export class ProductsAdapter {
  private client: SupabaseServiceClient

  constructor() {
    this.client = SupabaseServiceClient.getInstance()
  }

  async getProducts(params: {
    limit?: number
    offset?: number
    categoryFilter?: number | null
    search?: string | null
    includeInactive?: boolean
  }): Promise<Product[]> {
    try {
      const supabase = this.client.getClient()
      const { data, error } = await (supabase as any).rpc('list_products', {
        p_id_categoria: params.categoryFilter || null,
        p_limit: params.limit || 50,
        p_offset: params.offset || 0,
        p_activo: params.includeInactive ? null : true,
        p_search: params.search || null
      })

      if (error) throw error
      return data as Product[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch products', { originalError: error, params })
    }
  }

  async getProductById(params: {
    productId: number
  }): Promise<ProductWithVariants | null> {
    try {
      const supabase = this.client.getClient()
      const { data, error } = await (supabase as any).rpc('get_product', {
        p_id_producto: params.productId
      })

      if (error) throw error
      if (!data || (data as any).length === 0) return null
      return data[0] as ProductWithVariants
    } catch (error) {
      throw new DatabaseError('Failed to fetch product details', { originalError: error, params })
    }
  }

  async createProduct(params: any): Promise<Product | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_product', {
      p_nombre: params.nombre,
      p_codigo: params.codigo,
      p_descripcion: params.descripcion,
      p_id_proveedor: params.id_proveedor,
      p_id_categoria: params.id_categoria,
      p_id_coleccion: params.id_coleccion
    });
    if (error) throw new DatabaseError('Failed to create product', { originalError: error });
    return data?.[0] || null;
  }

  async updateProduct(id: number, params: any): Promise<Product | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('update_product', {
      p_id_producto: id,
      p_nombre: params.nombre,
      p_codigo: params.codigo,
      p_descripcion: params.descripcion,
      p_id_proveedor: params.id_proveedor,
      p_id_categoria: params.id_categoria,
      p_id_coleccion: params.id_coleccion,
      p_activo: params.activo
    });
    if (error) throw new DatabaseError('Failed to update product', { originalError: error });
    return data?.[0] || null;
  }

  async deleteProduct(id: number): Promise<{ success: boolean }> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('delete_product', { p_id_producto: id });
    if (error) throw new DatabaseError('Failed to delete product', { originalError: error });
    return { success: (data as any)?.success || false };
  }
}
