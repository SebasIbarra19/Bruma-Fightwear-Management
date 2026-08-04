import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ success: false, error: 'Missing projectId' }, { status: 400 })
  }

  // Llamar al SP agrupado
  const { data, error } = await supabase.rpc('list_inventory_grouped_by_product', {
    p_project_id: projectId
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 })
  }

  // Agrupar por producto (tipado explícito)
  type GroupedProduct = {
    product_id: string;
    product_name: string;
    product_sku: string;
    category_name: string;
    variantes: Array<{
      variante_id: string;
      name: string;
      sku: string;
      size: string | null;
      color: string | null;
      barcode: string | null;
      stock_quantity: number;
      reorder_level?: number;
      is_active: boolean;
      sort_order: number;
      created_at: string;
      updated_at: string;
    }>;
  };
  const grouped: Record<string, GroupedProduct> = {};
  for (const row of data || []) {
    const pid = String(row.product_id);
    if (!grouped[pid]) {
      grouped[pid] = {
        product_id: row.product_id,
        product_name: row.product_name,
        product_sku: row.product_sku,
        category_name: row.category_name,
        variantes: []
      };
    }
    grouped[pid].variantes.push({
      variante_id: row.variante_id,
      name: row.variante_name,
      sku: row.variante_sku,
      size: row.size,
      color: row.color,
      barcode: row.barcode,
      stock_quantity: typeof row.stock_quantity !== 'undefined' ? Number(row.stock_quantity) : 0,
      reorder_level: typeof row.reorder_level !== 'undefined' ? Number(row.reorder_level) : undefined,
      is_active: row.is_active,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
    });
  }
  const result = Object.values(grouped);
  return NextResponse.json({ success: true, data: result });
}
