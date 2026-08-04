// ================================================
// 🏭 SUPPLIERS ADAPTER
// Acceso a datos de proveedores con contacto y dirección principal
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError } from '@/lib/api/error-handler';

// Tipos basados en el nuevo schema.sql y el SP list_suppliers
export interface Supplier {
  id_proveedor: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

export interface ListSuppliersParams {
  search?: string | null;
  limit?: number;
  offset?: number;
}

export class SuppliersAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async listSuppliers(params: ListSuppliersParams): Promise<Supplier[]> {
    try {
      const supabase = this.client.getClient();
      const { data, error } = await (supabase as any).rpc('list_suppliers', {
        p_search: params.search,
        p_limit: params.limit,
        p_offset: params.offset
      });

      if (error) {
        throw new DatabaseError('Failed to fetch suppliers from SP', { originalError: error, params });
      }

      return data as Supplier[];
    } catch (err) {
      console.error('[SuppliersAdapter] Fatal error:', err);
      throw err;
    }
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_supplier', { p_id_proveedor: id });
    if (error) throw new DatabaseError('Failed to get supplier', { originalError: error });
    return data?.[0] || null;
  }

  async createSupplier(params: { nombre: string; contacto?: string; telefono?: string; email?: string }): Promise<Supplier | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_supplier', {
      p_nombre: params.nombre,
      p_contacto: params.contacto,
      p_telefono: params.telefono,
      p_email: params.email
    });
    if (error) throw new DatabaseError('Failed to create supplier', { originalError: error });
    return data?.[0] || null;
  }

  async updateSupplier(id: number, params: { nombre?: string; contacto?: string; telefono?: string; email?: string }): Promise<Supplier | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('update_supplier', {
      p_id_proveedor: id,
      p_nombre: params.nombre,
      p_contacto: params.contacto,
      p_telefono: params.telefono,
      p_email: params.email
    });
    if (error) throw new DatabaseError('Failed to update supplier', { originalError: error });
    return data?.[0] || null;
  }

  async deleteSupplier(id: number): Promise<{ success: boolean }> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('delete_supplier', { p_id_proveedor: id });
    if (error) throw new DatabaseError('Failed to delete supplier', { originalError: error });
    return { success: (data as any)?.success || false };
  }
}
