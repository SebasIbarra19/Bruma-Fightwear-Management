import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError } from '@/lib/api/error-handler';

export interface Order {
  id_pedido: number;
  fecha: string;
  id_estado: number;
  estado_nombre: string;
  id_cliente: number | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  total: number;
  id_metodo_pago: number | null;
  metodo_pago_nombre: string | null;
  items_count: number;
}

export interface ListOrdersParams {
  id_cliente?: number | null;
  id_estado?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

export class OrdersAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async listOrders(params: ListOrdersParams): Promise<Order[]> {
    try {
      const supabase = this.client.getClient();
      const { data, error } = await (supabase as any).rpc('list_orders', {
        p_id_cliente: params.id_cliente,
        p_id_estado: params.id_estado,
        p_start_date: params.start_date,
        p_end_date: params.end_date,
        p_min_amount: params.min_amount,
        p_max_amount: params.max_amount,
        p_search: params.search,
        p_limit: params.limit,
        p_offset: params.offset
      });

      if (error) {
        throw new DatabaseError('Failed to fetch orders from SP', { originalError: error, params });
      }

      return data as Order[];
    } catch (err) {
      console.error('[OrdersAdapter] Fatal error:', err);
      throw err;
    }
  }

  async getOrderDetails(id: number): Promise<any> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_order_details', { p_id_pedido: id });
    if (error) throw new DatabaseError('Failed to get order details', { originalError: error });
    return data;
  }

  async createOrder(params: any): Promise<any> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_order', {
      p_id_cliente: params.id_cliente,
      p_cliente_nombre: params.cliente_nombre,
      p_cliente_email: params.cliente_email,
      p_id_estado: params.id_estado || 1, // Default estado
      p_total: params.total,
      p_notas: params.notas,
      p_id_metodo_pago: params.id_metodo_pago
    });
    if (error) throw new DatabaseError('Failed to create order', { originalError: error });
    return data?.[0] || null;
  }

  async updateOrderStatus(id: number, statusId: number): Promise<void> {
    const supabase = this.client.getClient();
    const { error } = await (supabase as any).rpc('update_order_status', {
      p_id_pedido: id,
      p_id_estado: statusId
    });
    if (error) throw new DatabaseError('Failed to update order status', { originalError: error });
  }
}
