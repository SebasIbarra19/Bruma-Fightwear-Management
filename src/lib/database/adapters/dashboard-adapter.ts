import { SupabaseServiceClient } from '@/lib/api/client';

export interface DashboardStats {
  pedidos: number;
  productos_bajo_stock: number;
  clientes: number;
  proveedores: number;
}

export class DashboardAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_dashboard_stats');

    if (error) {
      console.error('[DashboardAdapter] Error getting stats:', error);
      throw error;
    }

    return {
      pedidos: Number(data?.pedidos || 0),
      productos_bajo_stock: Number(data?.productos_bajo_stock || 0),
      clientes: Number(data?.clientes || 0),
      proveedores: Number(data?.proveedores || 0),
    };
  }
}
