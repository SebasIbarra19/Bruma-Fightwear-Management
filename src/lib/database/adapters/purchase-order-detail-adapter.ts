// ================================================
// 🧾 PURCHASE ORDER DETAIL ADAPTER
// Orden de compra individual con items y proveedor
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';

export type PurchaseOrderItem = {
  id: string;
  purchase_order_id: string;
  sku: string;
  description: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderDetail = {
  id: string;
  project_id: string;
  supplier_id: string;
  po_number: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  order_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Del join con suppliers
  supplier_name: string | null;
  supplier_contact_name: string | null;
  supplier_email: string | null;
  // Items de la orden
  items: PurchaseOrderItem[];
};

export type AddItemInput = {
  purchase_order_id: string;
  sku: string;
  description?: string | null;
  quantity_ordered: number;
  unit_cost: number;
};

export type UpdateItemInput = {
  sku?: string;
  description?: string | null;
  quantity_ordered?: number;
  unit_cost?: number;
};

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getPurchaseOrderDetail(
  orderId: string,
  projectId: string
): Promise<PurchaseOrderDetail | null> {
  const { data: orderData, error: orderError } = await db()
    .from('purchase_orders')
    .select(`
      *,
      suppliers (
        id, name,
        supplier_contacts ( name, email, is_primary )
      )
    `)
    .eq('id', orderId)
    .eq('project_id', projectId)
    .single();

  if (orderError || !orderData) return null;

  const { data: itemsData } = await db()
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', orderId)
    .order('created_at');

  const contacts = (orderData as any).suppliers?.supplier_contacts ?? [];
  const primary = contacts.find((c: any) => c.is_primary) ?? contacts[0] ?? null;

  return {
    ...(orderData as any),
    supplier_name: (orderData as any).suppliers?.name ?? null,
    supplier_contact_name: primary?.name ?? null,
    supplier_email: primary?.email ?? null,
    suppliers: undefined,
    items: (itemsData ?? []) as PurchaseOrderItem[],
  } as PurchaseOrderDetail;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function addPurchaseOrderItem(input: AddItemInput): Promise<PurchaseOrderItem> {
  const total_cost = input.quantity_ordered * input.unit_cost;
  // @ts-ignore - Supabase generated types issue with purchase_order_items table
  const { data, error } = await (db() as any)
    .from('purchase_order_items')
    .insert({ ...input, total_cost })
    .select('*')
    .single();
  if (error) throw error;
  return data as PurchaseOrderItem;
}

export async function updatePurchaseOrderItem(
  itemId: string,
  updates: UpdateItemInput
): Promise<void> {
  const patch: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.quantity_ordered !== undefined && updates.unit_cost !== undefined) {
    patch.total_cost = updates.quantity_ordered * updates.unit_cost;
  }
  const { error } = await (db() as any)
    .from('purchase_order_items')
    // @ts-ignore - Supabase generated types issue with purchase_order_items table
    .update(patch)
    .eq('id', itemId);
  if (error) throw error;
}

export async function deletePurchaseOrderItem(itemId: string): Promise<void> {
  const { error } = await db()
    .from('purchase_order_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}
