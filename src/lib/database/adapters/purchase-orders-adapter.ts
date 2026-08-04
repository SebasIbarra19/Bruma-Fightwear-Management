// ================================================
// 📦 PURCHASE ORDERS ADAPTER
// Acceso a datos de órdenes de compra con proveedor incluido
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';

/**
 * Orden de compra aplanada con datos del proveedor
 * Mapea exactamente al schema: purchase_orders + suppliers
 */
export type PurchaseOrderWithSupplier = {
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
  // Del join con supplier_contacts (contacto primario)
  supplier_contact_name: string | null;
  supplier_email: string | null;
};

export interface ListPurchaseOrdersParams {
  status?: string;
  supplierId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listPurchaseOrders(
  projectId: string,
  params: ListPurchaseOrdersParams = {}
): Promise<PurchaseOrderWithSupplier[]> {
  // Validar UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    throw new Error(
      `[PurchaseOrdersAdapter] Invalid projectId, must be UUID. Received: ${projectId}`
    );
  }

  const supabase = SupabaseServiceClient.getInstance().getClient();

  let query = supabase
    .from('purchase_orders')
    .select(`
      id, project_id, supplier_id, po_number, status,
      order_date, expected_delivery_date, actual_delivery_date,
      subtotal, tax_amount, shipping_cost, total_amount, currency,
      payment_terms, notes, created_at, updated_at,
      suppliers (
        id, name,
        supplier_contacts ( name, email, is_primary )
      )
    `)
    .eq('project_id', projectId);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.supplierId) {
    query = query.eq('supplier_id', params.supplierId);
  }

  if (params.startDate) {
    query = query.gte('order_date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('order_date', params.endDate);
  }

  if (params.search) {
    query = query.ilike('po_number', `%${params.search}%`);
  }

  const sortBy = params.sortBy ?? 'created_at';
  const ascending = (params.sortOrder ?? 'desc') === 'asc';
  query = query.order(sortBy as any, { ascending });

  if (params.limit) {
    const from = params.offset ?? 0;
    query = query.range(from, from + params.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[PurchaseOrdersAdapter] Query error:', error);
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const supplier = row.suppliers ?? null;
    const contacts: any[] = supplier?.supplier_contacts ?? [];
    const primaryContact =
      contacts.find((c) => c.is_primary) ?? contacts[0] ?? null;

    return {
      id: row.id,
      project_id: row.project_id,
      supplier_id: row.supplier_id,
      po_number: row.po_number,
      status: row.status,
      order_date: row.order_date ?? null,
      expected_delivery_date: row.expected_delivery_date ?? null,
      actual_delivery_date: row.actual_delivery_date ?? null,
      subtotal: Number(row.subtotal ?? 0),
      tax_amount: Number(row.tax_amount ?? 0),
      shipping_cost: Number(row.shipping_cost ?? 0),
      total_amount: Number(row.total_amount ?? 0),
      currency: row.currency ?? 'USD',
      payment_terms: row.payment_terms ?? null,
      notes: row.notes ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      supplier_name: supplier?.name ?? null,
      supplier_contact_name: primaryContact?.name ?? null,
      supplier_email: primaryContact?.email ?? null,
    } satisfies PurchaseOrderWithSupplier;
  });
}
