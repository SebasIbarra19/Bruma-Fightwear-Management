// ================================================
// 📋 PRODUCT LINES ADAPTER
// Acceso a datos de líneas de productos
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';
import type { ProductLine } from '@/types/database';

export interface ProductLine {
  id_coleccion: number;
  nombre: string;
  descripcion: string | null;
}

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function listProductLines(_projectId?: string): Promise<ProductLine[]> {
  const { data, error } = await (db() as any)
    .from('coleccion')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductLine[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleProductLineStatus(id: number, _isActive: boolean): Promise<void> {
  // Nota: coleccion no tiene columna 'activo' en schema.sql, por ahora no hace nada
  console.warn('Coleccion does not have active status');
}

export async function deleteProductLine(id: number): Promise<void> {
  const { error } = await (db() as any)
    .from('coleccion')
    .delete()
    .eq('id_coleccion', id);
  if (error) throw error;
}

export interface CreateProductLineInput {
  nombre: string;
  descripcion?: string | null;
}

export async function createProductLine(_projectId: string, input: CreateProductLineInput): Promise<ProductLine> {
  const { data, error } = await (db() as any)
    .from('coleccion')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as ProductLine;
}
