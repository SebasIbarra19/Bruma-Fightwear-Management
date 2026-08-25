// ================================================
// 📦 INVENTORY MOVEMENTS ADAPTER
// Acceso a movimientos con datos de inventario incluidos
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';

export type MovementWithInventory = {
  id: number;
  inventory_id: number;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  // Del join/extra
  sku: string | null;
  size: string | null;
  product_name: string | null;
};

export type InventoryItemForFilter = {
  id: number;
  sku: string;
  product_name: string | null;
};

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function listInventoryMovements(): Promise<MovementWithInventory[]> {
  const { data, error } = await (db() as any).rpc('get_inventory_movements', {
    p_limit: 100
  });

  if (error) throw error;
  
  return (data ?? []).map((m: any) => ({
    id: m.id_movimiento,
    inventory_id: m.id_producto_talla,
    movement_type: m.tipo_movimiento,
    quantity: m.cantidad,
    notes: m.motivo,
    created_at: m.fecha,
    // Ver `build_sku` (migración 20260822000000). Antes se armaba acá SIN la
    // talla, así que el mismo ítem se mostraba distinto en Movements que en
    // Inventory. `size` se sigue exponiendo aparte para quien lo necesite.
    sku: m.sku,
    size: m.talla_codigo || null,
    product_name: m.producto_nombre
  }));
}

export async function listInventoryItems(): Promise<InventoryItemForFilter[]> {
  const { data, error } = await (db() as any).rpc('list_inventory_items', {
    p_limit: 1000
  });

  if (error) throw error;
  
  return (data ?? []).map((i: any) => ({
    id: i.id_producto_talla,
    sku: i.sku,
    product_name: i.producto_nombre
  }));
}
