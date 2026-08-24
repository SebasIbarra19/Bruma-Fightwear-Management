// ================================================
// INVENTORY ADAPTER V2.0
// Basado en schema real verificado - Oct 2025
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client'
import { ValidationError } from '@/lib/api/error-handler'
import { resolveDefaultProviderId, resolveTallaProveedorId } from './catalog-adapter'

// ================================================
// INTERFACES
// ================================================

export interface InventoryItemExtended {
  inventory_id: number;
  product_id: number;
  variant_id: number | null;
  sku: string;
  product_name: string;
  product_sku: string;
  category_name: string | null;
  variant_name: string | null;
  variant_sku: string | null;
  size: string | null;
  collection: string | null;
  current_stock: number;
  price: number;
  status: 'critical' | 'warning' | 'normal';
}

export interface InventoryStats {
  total_products: number;
  total_items: number;
  total_value: number;
  low_stock_items: number;
}

export interface InventoryMovement {
  id_movimiento: number;
  id_producto_talla: number;
  tipo_movimiento: string;
  cantidad: number;
  motivo: string | null;
  fecha: string;
}

export interface AdjustmentResult {
  id_producto_talla: number;
  stock_anterior: number;
  cambio: number;
  stock_nuevo: number;
  tipo_movimiento: string;
  success: boolean;
}

export interface InventoryAlert {
  inventory_id: number;
  product_name: string;
  variant_name: string | null;
  sku: string;
  current_stock: number;
  status: 'critical' | 'warning';
}

// ================================================
// ADAPTER CLASS
// ================================================

export class InventoryAdapter {
  private client: SupabaseServiceClient

  constructor() {
    this.client = SupabaseServiceClient.getInstance()
  }

  async getInventoryItems(
    _projectId?: string,
    options: {
      includeZeroStock?: boolean;
      includeUnstocked?: boolean;
      categoryFilter?: number | null;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InventoryItemExtended[]> {
    const {
      includeZeroStock = false,
      includeUnstocked = false,
      categoryFilter = null,
      limit = 100,
      offset = 0
    } = options;

    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('list_inventory_items', {
      p_incluir_stock_cero: includeZeroStock,
      p_id_categoria: categoryFilter,
      p_limit: limit,
      p_offset: offset,
      p_incluir_sin_stock_row: includeUnstocked
    });

    if (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      inventory_id: item.id_producto_talla,
      product_id: item.id_producto,
      variant_id: item.id_variante,
      sku: item.id_producto_talla
        ? (item.variante_codigo || item.producto_codigo) + (item.talla_codigo ? `-${item.talla_codigo}` : '')
        : `${item.producto_codigo} — No size set`,
      product_name: item.producto_nombre,
      product_sku: item.producto_codigo,
      category_name: item.categoria_nombre,
      variant_name: item.variante_nombre,
      variant_sku: item.variante_codigo,
      size: item.talla_codigo || null,
      collection: item.coleccion_nombre || null,
      current_stock: item.stock,
      price: Number(item.precio),
      status: item.status as any
    }));
  }

  async getInventoryItemById(
    projectId: string,
    inventoryId: number
  ): Promise<InventoryItemExtended | null> {
    const items = await this.getInventoryItems(projectId, { limit: 1000, includeZeroStock: true });
    return items.find(item => item.inventory_id === inventoryId) || null;
  }

  async getInventoryByVariantId(
    _projectId: string,
    variantId: number
  ): Promise<any[]> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any)
      .from('productotallastock')
      .select('*')
      .eq('id_variante', variantId);

    if (error) {
      console.error('Error getting inventory by variant:', error);
      throw error;
    }

    return data || [];
  }

  async getInventoryMovements(
    _projectId?: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InventoryMovement[]> {
    const {
      limit = 100,
      offset = 0
    } = options;

    const supabase = this.client.getClient();

    const { data, error } = await (supabase as any).rpc('get_inventory_movements', {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('Error getting movements:', error);
      throw error;
    }

    return data || [];
  }

  async adjustInventory(
    inventoryId: number,
    quantityChange: number,
    reason: string = 'ajuste manual',
    tipoMovimiento?: string | null,
    forzar: boolean = false
  ): Promise<AdjustmentResult> {
    const supabase = this.client.getClient();

    const { data, error } = await (supabase as any).rpc('adjust_inventory', {
      p_id_producto_talla: inventoryId,
      p_cantidad_cambio: quantityChange,
      p_motivo: reason,
      p_tipo_movimiento: tipoMovimiento || null,
      p_forzar: forzar
    });

    if (error) {
      console.error('Error adjusting inventory:', error);
      throw new ValidationError(error.message);
    }

    return data;
  }

  async createStockAndAdjust(idVariante: number, initialQuantity: number, motivo: string): Promise<AdjustmentResult> {
    const providerId = await resolveDefaultProviderId();
    const tallaProveedorId = await resolveTallaProveedorId(providerId, 'OS');

    const supabase = this.client.getClient();
    const { data: variantRow, error: variantErr } = await (supabase as any)
      .from('productovariante')
      .select('precio_variante')
      .eq('id_variante', idVariante)
      .maybeSingle();
    if (variantErr) throw new ValidationError(variantErr.message);

    const { data: stockRow, error: stockErr } = await (supabase as any)
      .from('productotallastock')
      .insert({
        id_variante: idVariante,
        id_talla_proveedor: tallaProveedorId,
        stock: 0,
        precio: variantRow?.precio_variante || 0,
      })
      .select('id_producto_talla')
      .single();
    if (stockErr) throw new ValidationError(stockErr.message);

    return this.adjustInventory(stockRow.id_producto_talla, initialQuantity, motivo, 'entrada', false);
  }

  async getInventoryValuation(_projectId?: string): Promise<InventoryStats> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_inventory_valuation');

    if (error) {
      console.error('Error getting valuation:', error);
      throw error;
    }

    return data;
  }

  async getMovementStats(_projectId?: string): Promise<any> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_inventory_movement_stats');

    if (error) {
      console.error('Error getting movement stats:', error);
      throw error;
    }

    return data;
  }

  async getInventoryAlerts(
    projectId: string,
    onlyCritical: boolean = false
  ): Promise<InventoryAlert[]> {
    const items = await this.getInventoryItems(projectId, { 
      includeZeroStock: true,
      limit: 1000 
    });

    return items
      .filter(item => {
        if (onlyCritical) return item.status === 'critical';
        return item.status === 'critical' || item.status === 'warning';
      })
      .map(item => ({
        inventory_id: item.inventory_id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        current_stock: item.current_stock,
        status: item.status as 'critical' | 'warning'
      }));
  }

  async generateInventoryReport(
    _projectId?: string,
    options: {
      categoryId?: number | null;
      lowStockOnly?: boolean;
      includeMovements?: boolean;
    } = {}
  ): Promise<any> {
    const {
      categoryId = null,
      lowStockOnly = false,
      includeMovements = true
    } = options;

    const supabase = this.client.getClient();

    const { data, error } = await (supabase as any).rpc('generate_inventory_report', {
      p_category_id: categoryId,
      p_low_stock_only: lowStockOnly,
      p_include_movements: includeMovements
    });

    if (error) {
      console.error('Error generating report:', error);
      throw error;
    }

    return data;
  }
}

export const inventoryAdapter = new InventoryAdapter();
