// ================================================
// 📁 CATEGORIES ADAPTER
// Adaptador centralizado para acceso a datos de categorías
// Con fallback automático SP → Query
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError } from '@/lib/api/error-handler';

export interface Category {
  id_tipo: number;
  nombre: string;
  codigo: string;
  product_count: number;
}

export interface CreateCategoryParams {
  nombre: string;
  codigo?: string | null;
}

export interface UpdateCategoryParams {
  nombre?: string;
  codigo?: string | null;
}

export class CategoriesAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async listCategories(params: { search?: string | null; limit?: number; offset?: number }): Promise<Category[]> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('list_categories', {
      p_search: params.search,
      p_limit: params.limit,
      p_offset: params.offset
    });
    if (error) throw new DatabaseError('Failed to list categories', { originalError: error });
    return data as Category[];
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_category', { p_id_tipo: id });
    if (error) throw new DatabaseError('Failed to get category', { originalError: error });
    return data?.[0] || null;
  }

  async createCategory(params: CreateCategoryParams): Promise<Category | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_category', {
      p_nombre: params.nombre,
      p_codigo: params.codigo
    });
    if (error) throw new DatabaseError('Failed to create category', { originalError: error });
    return data?.[0] || null;
  }

  async updateCategory(id: number, params: UpdateCategoryParams): Promise<Category | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('update_category', {
      p_id_tipo: id,
      p_nombre: params.nombre,
      p_codigo: params.codigo
    });
    if (error) throw new DatabaseError('Failed to update category', { originalError: error });
    return data?.[0] || null;
  }

  async deleteCategory(id: number): Promise<{ success: boolean }> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('delete_category', { p_id_tipo: id });
    if (error) throw new DatabaseError('Failed to delete category', { originalError: error });
    return { success: (data as any)?.success || false };
  }
}

