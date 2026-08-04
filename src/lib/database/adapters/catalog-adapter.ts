// ================================================
// 🛍️ CATALOG ADAPTER
// Productos con categoría y línea, más filtros
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';

export type CatalogProduct = {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  // Del join/stats
  category_name: string | null;
  variante_count: number;
  stock_total: number;
};

export type CategoryForFilter = { id: number; name: string };
export type ProductLineForFilter = { id: number; name: string };

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function listCatalogProducts(_projectId?: string): Promise<CatalogProduct[]> {
  const { data, error } = await (db() as any).rpc('list_products', {
    p_limit: 100
  });

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    id: p.id_producto,
    category_id: p.id_categoria,
    name: p.nombre,
    description: p.descripcion,
    sku: p.codigo,
    is_active: p.activo,
    created_at: p.fecha_creacion,
    category_name: p.categoria_nombre,
    variante_count: Number(p.variante_count || 0),
    stock_total: Number(p.stock_total || 0),
  }));
}

export async function listCategoriesForFilter(_projectId?: string): Promise<CategoryForFilter[]> {
  const { data, error } = await (db() as any).rpc('list_categories');

  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id_tipo,
    name: c.nombre
  }));
}

export async function listProductLinesForFilter(_projectId?: string): Promise<ProductLineForFilter[]> {
  // En el nuevo esquema parece que no hay "product_lines" sino "colecciones"
  // Por ahora devolvemos vacío o consultamos colecciones si fuera necesario
  return [];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleCatalogProductStatus(id: number, isActive: boolean): Promise<void> {
  const { error } = await (db() as any)
    .from('producto')
    .update({ activo: isActive })
    .eq('id_producto', id);
  if (error) throw error;
}

export async function deleteCatalogProduct(id: number): Promise<void> {
  const { error } = await (db() as any).rpc('delete_product', {
    p_id_producto: id
  });
  if (error) throw error;
}

export interface CreateCatalogProductInput {
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  id_proveedor?: number | null;
  id_categoria?: number | null;
  id_coleccion?: number | null;
  activo?: boolean;
}

export async function createCatalogProduct(_projectId: string, input: CreateCatalogProductInput): Promise<CatalogProduct> {
  const { data, error } = await (db() as any).rpc('create_product', {
    p_nombre: input.nombre,
    p_codigo: input.codigo,
    p_descripcion: input.descripcion,
    p_id_proveedor: input.id_proveedor,
    p_id_categoria: input.id_categoria,
    p_id_coleccion: input.id_coleccion
  });
  
  if (error) throw error;
  const p = data?.[0];
  if (!p) throw new Error('Failed to create product');

  return {
    id: p.id_producto,
    category_id: p.id_categoria,
    name: p.nombre,
    description: p.descripcion,
    sku: p.codigo,
    is_active: p.activo,
    created_at: p.fecha_creacion,
    category_name: null, // Debería obtenerse si es necesario
    variante_count: 0,
    stock_total: 0,
  };
}
