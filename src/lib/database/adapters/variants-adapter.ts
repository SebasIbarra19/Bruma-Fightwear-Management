// ================================================
// 🎨 VARIANTS ADAPTER
// Acceso a datos de variantes con producto y categoría
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';

export type VariantWithProduct = {
  id: number;
  product_id: number;
  variant_name: string | null;
  sku: string | null;
  price: number;
  is_active: boolean;
  product_name: string | null;
  product_sku: string | null;
  category_name: string | null;
};

export type ProductForFilter = {
  id: number;
  name: string;
};

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function listVariants(_projectId?: string): Promise<VariantWithProduct[]> {
  const { data, error } = await (db() as any).rpc('list_product_variants', {
    p_limit: 100
  });

  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id_variante,
    product_id: v.id_producto,
    variant_name: v.nombre_variante,
    sku: v.codigo_variante,
    price: Number(v.precio_variante || 0),
    is_active: v.activo,
    product_name: v.producto_nombre,
    product_sku: v.producto_codigo,
    category_name: v.categoria_nombre
  }));
}

export async function listProductsForFilter(_projectId?: string): Promise<ProductForFilter[]> {
  const { data, error } = await (db() as any).rpc('list_products', {
    p_limit: 1000
  });

  if (error) throw error;
  
  return (data ?? []).map((p: any) => ({
    id: p.id_producto,
    name: p.nombre
  }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleVariantStatus(id: number, isActive: boolean): Promise<void> {
  const { error } = await (db() as any)
    .from('productovariante')
    .update({ activo: isActive })
    .eq('id_variante', id);
  if (error) throw error;
}

export async function deleteVariant(id: number): Promise<void> {
  const { error } = await (db() as any).rpc('delete_product_variant', {
    p_id_variante: id
  });
  if (error) throw error;
}

export interface CreateVariantInput {
  id_producto: number;
  id_color?: number | null;
  codigo_variante?: string | null;
  nombre_variante?: string | null;
  precio_variante?: number | null;
  activo?: boolean;
}

export async function createVariant(input: CreateVariantInput): Promise<VariantWithProduct> {
  const { data, error } = await (db() as any).rpc('create_product_variant', {
    p_id_producto: input.id_producto,
    p_id_color: input.id_color,
    p_codigo_variante: input.codigo_variante,
    p_nombre_variante: input.nombre_variante,
    p_precio_variante: input.precio_variante
  });
  
  if (error) throw error;
  const v = data?.[0];
  if (!v) throw new Error('Failed to create variant');

  return {
    id: v.id_variante,
    product_id: v.id_producto,
    variant_name: v.nombre_variante,
    sku: v.codigo_variante,
    price: Number(v.precio_variante || 0),
    is_active: v.activo,
    product_name: null,
    product_sku: null,
    category_name: null
  };
}
