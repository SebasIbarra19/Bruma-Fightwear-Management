import { SupabaseServiceClient } from '@/lib/api/client';
import { InventoryAdapter } from './inventory-adapter';

export interface DashboardStats {
  pedidos: number;
  productos_bajo_stock: number;
  clientes: number;
  proveedores: number;
}

/** Agregados de `get_order_analytics`. Sin rango = histórico completo. */
export interface OrderAnalytics {
  total_pedidos: number;
  total_ingresos: number;
  promedio_pedido: number;
}

/** Foto del inventario que devuelve `get_inventory_valuation`. */
export interface InventoryValuation {
  total_productos: number;
  total_items: number;
  valor_total: number;
  items_bajo_stock: number;
  items_sin_stock: number;
}

/**
 * Lo que consume la pantalla de Statistics.
 *
 * Se diferencia del dashboard en que la parte de ventas está acotada a un
 * RANGO: `get_order_analytics` siempre aceptó `p_start_date`/`p_end_date` y
 * nadie los usaba. La valuación, en cambio, es una foto del inventario hoy —
 * no tiene sentido pedirle un rango.
 */
export interface StatisticsPayload {
  analytics: OrderAnalytics;
  valuation: InventoryValuation;
  range: { start: string | null; end: string | null };
}

/** Una fila del panel de stock bajo. */
export interface LowStockItem {
  sku: string;
  product_name: string;
  size: string | null;
  current_stock: number;
  status: 'critical' | 'warning' | 'normal';
}

/**
 * Todo lo que el dashboard necesita, en una sola llamada.
 *
 * Se compone de tres fuentes que YA existían y que nadie invocaba:
 * `get_dashboard_stats`, `get_order_analytics` y `list_inventory_items`.
 */
export interface DashboardPayload {
  stats: DashboardStats;
  analytics: OrderAnalytics;
  lowStock: LowStockItem[];
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

  /**
   * Agregados de pedidos. Sin fechas devuelve el histórico completo, que es lo
   * que el dashboard muestra hoy; el SP ya acepta rango para cuando se filtre.
   */
  async getOrderAnalytics(startDate?: string, endDate?: string): Promise<OrderAnalytics> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_order_analytics', {
      p_start_date: startDate ?? null,
      p_end_date: endDate ?? null,
    });

    if (error) {
      console.error('[DashboardAdapter] Error getting order analytics:', error);
      throw error;
    }

    return {
      total_pedidos: Number(data?.total_pedidos || 0),
      total_ingresos: Number(data?.total_ingresos || 0),
      promedio_pedido: Number(data?.promedio_pedido || 0),
    };
  }

  /**
   * Filas que necesitan reposición, más críticas primero.
   *
   * Reutiliza `InventoryAdapter`, que ya arma el SKU y clasifica el estado
   * (`critical` <= 0, `warning` <= 5), en vez de duplicar esa lógica acá.
   * `includeZeroStock` es imprescindible: sin él el SP filtra `stock > 0` y se
   * perderían justamente las filas agotadas, que son las que más urgen.
   */
  async getLowStockItems(limit = 6): Promise<LowStockItem[]> {
    const items = await new InventoryAdapter().getInventoryItems(undefined, {
      includeZeroStock: true,
      limit: 200,
    });

    const rank = { critical: 0, warning: 1, normal: 2 } as const;

    return items
      .filter((i) => i.status === 'critical' || i.status === 'warning')
      .sort((a, b) => rank[a.status] - rank[b.status] || a.current_stock - b.current_stock)
      .slice(0, limit)
      .map((i) => ({
        sku: i.sku,
        product_name: i.product_name,
        size: i.size,
        current_stock: i.current_stock,
        status: i.status,
      }));
  }

  /** Valor y composición del inventario a hoy. */
  async getInventoryValuation(): Promise<InventoryValuation> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_inventory_valuation');

    if (error) {
      console.error('[DashboardAdapter] Error getting inventory valuation:', error);
      throw error;
    }

    return {
      total_productos: Number(data?.total_productos || 0),
      total_items: Number(data?.total_items || 0),
      valor_total: Number(data?.valor_total || 0),
      items_bajo_stock: Number(data?.items_bajo_stock || 0),
      items_sin_stock: Number(data?.items_sin_stock || 0),
    };
  }

  /**
   * Payload de Statistics. Las fechas se pasan tal cual al SP: `null` significa
   * "sin límite por ese lado", que es como el propio SP lo interpreta.
   */
  async getStatisticsPayload(
    startDate?: string,
    endDate?: string
  ): Promise<StatisticsPayload> {
    const [analytics, valuation] = await Promise.all([
      this.getOrderAnalytics(startDate, endDate),
      this.getInventoryValuation(),
    ]);

    return {
      analytics,
      valuation,
      range: { start: startDate ?? null, end: endDate ?? null },
    };
  }

  /** Las tres fuentes en paralelo: el dashboard hace un solo viaje. */
  async getDashboardPayload(): Promise<DashboardPayload> {
    const [stats, analytics, lowStock] = await Promise.all([
      this.getDashboardStats(),
      this.getOrderAnalytics(),
      this.getLowStockItems(),
    ]);

    return { stats, analytics, lowStock };
  }
}
