import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError } from '@/lib/api/error-handler';

// Tipos basados en el nuevo schema.sql y el SP list_customers
export interface Customer {
  id_cliente: number;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  activo: boolean;
  total_pedidos: number;
  ultima_fecha_pedido: string | null;
}

// Parámetros para la función de listar clientes
export interface ListCustomersParams {
  search?: string | null;
  solo_activos?: boolean;
  limit?: number;
  offset?: number;
}

export class CustomersAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async listCustomers(params: ListCustomersParams): Promise<Customer[]> {
    try {
      const supabase = this.client.getClient();
      const { data, error } = await (supabase as any).rpc('list_customers', {
        p_search: params.search,
        p_solo_activos: params.solo_activos,
        p_limit: params.limit,
        p_offset: params.offset
      });

      if (error) {
        throw new DatabaseError('Failed to fetch customers from SP', { originalError: error, params });
      }

      return data as Customer[];
    } catch (err) {
      console.error('[CustomersAdapter] Fatal error:', err);
      throw err;
    }
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_customer', { p_id_cliente: id });
    if (error) throw new DatabaseError('Failed to get customer', { originalError: error });
    return data?.[0] || null;
  }

  async createCustomer(params: any): Promise<Customer | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_customer', {
      p_nombre: params.nombre,
      p_apellido: params.apellido,
      p_email: params.email,
      p_telefono: params.telefono,
      p_direccion: params.direccion,
      p_ciudad: params.ciudad
    });
    if (error) throw new DatabaseError('Failed to create customer', { originalError: error });
    return data?.[0] || null;
  }

  async updateCustomer(id: number, params: any): Promise<Customer | null> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('update_customer', {
      p_id_cliente: id,
      p_nombre: params.nombre,
      p_apellido: params.apellido,
      p_email: params.email,
      p_telefono: params.telefono,
      p_direccion: params.direccion,
      p_ciudad: params.ciudad,
      p_activo: params.activo
    });
    if (error) throw new DatabaseError('Failed to update customer', { originalError: error });
    return data?.[0] || null;
  }

  async deleteCustomer(id: number): Promise<{ success: boolean }> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('delete_customer', { p_id_cliente: id });
    if (error) throw new DatabaseError('Failed to delete customer', { originalError: error });
    return { success: (data as any)?.success || false };
  }
}
