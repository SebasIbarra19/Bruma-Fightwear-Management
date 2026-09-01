// ================================================
// 🛍️ CATALOG ADAPTER
// Productos con categoría y línea, más filtros
// ================================================

import { SupabaseServiceClient } from '@/lib/api/client';
import { ValidationError } from '@/lib/api/error-handler';

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
  collection_name: string | null;
  variante_count: number;
  stock_total: number;
  /** URL pública de la imagen principal, o null si el producto no tiene ninguna. */
  image_url: string | null;
};

export type CategoryForFilter = { id: number; name: string };
export type ProductLineForFilter = { id: number; name: string };

const db = () => SupabaseServiceClient.getInstance().getClient();

// ── Read ───────────────────────────────────────────────────────────────────────

export async function listCatalogProducts(): Promise<CatalogProduct[]> {
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
    collection_name: p.coleccion_nombre,
    variante_count: Number(p.variante_count || 0),
    stock_total: Number(p.stock_total || 0),
    image_url: p.imagen_url ?? null,
  }));
}

export async function listCategoriesForFilter(): Promise<CategoryForFilter[]> {
  const { data, error } = await (db() as any).rpc('list_categories');

  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id_tipo,
    name: c.nombre
  }));
}

export async function listProductLinesForFilter(): Promise<ProductLineForFilter[]> {
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

export async function createCatalogProduct(input: CreateCatalogProductInput): Promise<CatalogProduct> {
  const { data, error } = await (db() as any).rpc('create_product', {
    p_nombre: input.nombre,
    p_codigo: input.codigo || null as any,
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
    collection_name: null, // Debería obtenerse si es necesario
    variante_count: 0,
    stock_total: 0,
    image_url: null, // Recién creado: todavía no puede tener imágenes.
  };
}

export type CollectionForFilter = { id: number; name: string };

export async function listCollectionsForFilter(): Promise<CollectionForFilter[]> {
  const { data, error } = await (db() as any)
    .from('coleccion')
    .select('id_coleccion, nombre')
    .order('nombre');
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ id: c.id_coleccion, name: c.nombre }));
}

/**
 * `prefijo` es opcional: gobierna el código autogenerado de los productos de
 * esta categoría (<prefijo>-BRU-###, ver `next_product_code`). Si no se pasa,
 * la base lo deriva del nombre — ver `category_prefix`, migración
 * 20260822010000.
 */
export async function createCatalogCategory(
  nombre: string,
  prefijo?: string
): Promise<{ id: number; name: string; prefix: string | null }> {
  const { data, error } = await (db() as any).rpc('create_category', {
    p_nombre: nombre,
    p_prefijo: prefijo?.trim() || null,
  });
  if (error) throw error;
  const c = data?.[0];
  if (!c) throw new Error('Failed to create category');
  return { id: c.id_tipo, name: c.nombre, prefix: c.prefijo ?? null };
}

export async function createCatalogCollection(nombre: string): Promise<CollectionForFilter> {
  const { data, error } = await (db() as any).rpc('create_collection', { p_nombre: nombre });
  if (error) throw error;
  const c = data?.[0];
  if (!c) throw new Error('Failed to create collection');
  return { id: c.id_coleccion, name: c.nombre };
}

const DEFAULT_PROVIDER_NAME = 'BRUMA Fightwear';

export async function resolveDefaultProviderId(): Promise<number> {
  const client = db();
  const { data: existing, error: findErr } = await (client as any)
    .from('proveedor')
    .select('id_proveedor')
    .eq('nombre', DEFAULT_PROVIDER_NAME)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id_proveedor;

  const { data: created, error: createErr } = await (client as any)
    .from('proveedor')
    .insert({ nombre: DEFAULT_PROVIDER_NAME })
    .select('id_proveedor')
    .single();
  if (createErr) throw createErr;
  return created.id_proveedor;
}

export async function resolveTallaProveedorId(providerId: number, sizeCode: string): Promise<number> {
  const client = db();

  let talla = (
    await (client as any)
      .from('tallabase')
      .select('id_talla')
      .eq('codigo', sizeCode)
      .maybeSingle()
  ).data;

  if (!talla) {
    const { data: createdTalla, error: createTallaErr } = await (client as any)
      .from('tallabase')
      .insert({ codigo: sizeCode, descripcion: sizeCode })
      .select('id_talla')
      .single();
    if (createTallaErr) throw createTallaErr;
    talla = createdTalla;
  }

  const { data: tallaProveedor, error: tpErr } = await (client as any)
    .from('tallaproveedor')
    .select('id_talla_proveedor')
    .eq('id_proveedor', providerId)
    .eq('id_talla', talla.id_talla)
    .maybeSingle();
  if (tpErr) throw tpErr;
  if (tallaProveedor) return tallaProveedor.id_talla_proveedor;

  const { data: createdTp, error: createTpErr } = await (client as any)
    .from('tallaproveedor')
    .insert({ id_proveedor: providerId, id_talla: talla.id_talla })
    .select('id_talla_proveedor')
    .single();
  if (createTpErr) throw createTpErr;
  return createdTp.id_talla_proveedor;
}

export interface CreateFullCatalogProductInput {
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  id_categoria?: number | null;
  id_coleccion?: number | null;
  activo?: boolean;
  precio: number;
  stockQty: number;
  sizes: string[];
}

export async function createCatalogProductWithStock(
  input: CreateFullCatalogProductInput
): Promise<CatalogProduct> {
  const providerId = await resolveDefaultProviderId();

  const product = await createCatalogProduct({
    nombre: input.nombre,
    codigo: input.codigo || null as any,
    descripcion: input.descripcion,
    id_categoria: input.id_categoria,
    id_coleccion: input.id_coleccion,
    id_proveedor: providerId,
    activo: input.activo,
  });

  const client = db();
  const { data: variantRows, error: variantErr } = await (client as any).rpc('create_product_variant', {
    p_id_producto: product.id,
    p_precio_variante: input.precio,
  });
  if (variantErr) throw variantErr;
  const variant = variantRows?.[0];
  if (!variant) throw new Error('Failed to create product variant');

  if (input.sizes.length > 0) {
    const stockRows = [];
    for (const sizeCode of input.sizes) {
      const tallaProveedorId = await resolveTallaProveedorId(providerId, sizeCode);
      stockRows.push({
        id_variante: variant.id_variante,
        id_talla_proveedor: tallaProveedorId,
        stock: input.stockQty,
        precio: input.precio,
      });
    }
    const { data: insertedStock, error: stockErr } = await (client as any)
      .from('productotallastock')
      .insert(stockRows)
      .select('id_producto_talla');
    if (stockErr) throw stockErr;

    if (input.stockQty > 0 && insertedStock) {
      const movementRows = insertedStock.map((row: any) => ({
        id_producto_talla: row.id_producto_talla,
        tipo_movimiento: 'entrada',
        cantidad: input.stockQty,
        motivo: `Producto creado en Catálogo — ${input.nombre}`,
      }));
      const { error: movementErr } = await (client as any).from('inventario_movimiento').insert(movementRows);
      if (movementErr) throw movementErr;
    }
  }

  return product;
}

export type CatalogProductDetail = {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string | null;
  id_categoria: number | null;
  categoria_nombre: string | null;
  id_coleccion: number | null;
  coleccion_nombre: string | null;
  activo: boolean;
  variante_count: number;
  stock_total: number;
  variantes: {
    id_variante: number;
    id_color: number | null;
    codigo_variante: string | null;
    nombre_variante: string | null;
    precio_variante: number | null;
    activo: boolean;
    stock_tallas: {
      id_producto_talla: number;
      id_talla_proveedor: number;
      talla_codigo: string | null;
      stock: number;
      precio: number;
    }[];
  }[];
};

export async function getCatalogProductDetail(id: number): Promise<CatalogProductDetail | null> {
  const { data, error } = await (db() as any).rpc('get_product', { p_id_producto: id });
  if (error) throw error;
  const p = data?.[0];
  if (!p) return null;
  return {
    id: p.id_producto,
    nombre: p.nombre,
    descripcion: p.descripcion,
    codigo: p.codigo,
    id_categoria: p.id_categoria,
    categoria_nombre: p.categoria_nombre,
    id_coleccion: p.id_coleccion,
    coleccion_nombre: p.coleccion_nombre,
    activo: p.activo,
    variante_count: Number(p.variante_count || 0),
    stock_total: Number(p.stock_total || 0),
    variantes: p.variantes || [],
  };
}

export interface UpdateCatalogProductInput {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  id_categoria?: number | null;
  id_coleccion?: number | null;
  activo?: boolean;
  variant?: {
    id_variante: number;
    id_color?: number | null;
    precio_variante?: number;
  };
  addSizes?: { codigo: string; stock: number; precio: number }[];
  removeSizeIds?: number[];
}

export async function updateCatalogProductFull(
  id: number,
  input: UpdateCatalogProductInput
): Promise<CatalogProductDetail> {
  const client = db();

  const { error: prodErr } = await (client as any).rpc('update_product', {
    p_id_producto: id,
    p_nombre: input.nombre,
    p_codigo: input.codigo,
    p_descripcion: input.descripcion,
    p_id_categoria: input.id_categoria,
    p_id_coleccion: input.id_coleccion,
    p_activo: input.activo,
  });
  if (prodErr) throw prodErr;

  if (input.variant) {
    const { error: varErr } = await (client as any).rpc('update_product_variant', {
      p_id_variante: input.variant.id_variante,
      p_id_color: input.variant.id_color,
      p_precio_variante: input.variant.precio_variante,
    });
    if (varErr) throw varErr;

    // El precio tambien vive en cada fila de talla, y es ESE el que manda: el
    // total de un pedido se deriva de `productotallastock.precio` (ver
    // `add_order_item`), no del de la variante. Sin propagarlo, editar el
    // precio dejaba las tallas existentes en el valor viejo --normalmente 0--
    // y los pedidos salian en cero aunque el catalogo mostrara otra cosa.
    //
    // Se pisan todas las tallas de la variante a proposito: la UI tiene UN
    // solo campo de precio por producto, asi que no hay precio por talla que
    // preservar.
    if (input.variant.precio_variante != null) {
      const { error: precioErr } = await (client as any)
        .from('productotallastock')
        .update({ precio: input.variant.precio_variante })
        .eq('id_variante', input.variant.id_variante);
      if (precioErr) throw precioErr;
    }
  }

  if (input.removeSizeIds && input.removeSizeIds.length > 0) {
    const { data: existing, error: findErr } = await (client as any)
      .from('productotallastock')
      .select('id_producto_talla, stock')
      .in('id_producto_talla', input.removeSizeIds);
    if (findErr) throw findErr;
    const blockedByStock = (existing ?? []).filter((r: any) => r.stock > 0);
    if (blockedByStock.length > 0) {
      throw new ValidationError(
        `No se puede quitar una talla con stock disponible. Ajusta el stock a 0 desde Inventory primero (${blockedByStock.length} talla(s) bloqueada(s)).`
      );
    }

    const { data: movementRows, error: movErr } = await (client as any)
      .from('inventario_movimiento')
      .select('id_producto_talla')
      .in('id_producto_talla', input.removeSizeIds)
      .limit(1);
    if (movErr) throw movErr;
    const { data: orderRows, error: ordErr } = await (client as any)
      .from('pedidodetalle')
      .select('id_producto_talla')
      .in('id_producto_talla', input.removeSizeIds)
      .limit(1);
    if (ordErr) throw ordErr;
    if ((movementRows && movementRows.length > 0) || (orderRows && orderRows.length > 0)) {
      throw new ValidationError(
        'No se puede quitar una talla con historial de movimientos u órdenes. Este registro debe conservarse para la auditoría.'
      );
    }

    const { error: delErr } = await (client as any)
      .from('productotallastock')
      .delete()
      .in('id_producto_talla', input.removeSizeIds);
    if (delErr) throw delErr;
  }

  if (input.addSizes && input.addSizes.length > 0 && input.variant) {
    const providerId = await resolveDefaultProviderId();
    const stockRows = [];
    for (const size of input.addSizes) {
      const tallaProveedorId = await resolveTallaProveedorId(providerId, size.codigo);
      stockRows.push({
        id_variante: input.variant.id_variante,
        id_talla_proveedor: tallaProveedorId,
        stock: size.stock,
        precio: size.precio,
      });
    }
    const { error: addErr } = await (client as any).from('productotallastock').insert(stockRows);
    if (addErr) throw addErr;
  }

  const detail = await getCatalogProductDetail(id);
  if (!detail) throw new Error('Product not found after update');
  return detail;
}

// ── Imágenes de producto ──────────────────────────────────────────────────────

/** Bucket público creado para esto. Las imágenes de producto no son sensibles y
 *  una URL directa se cachea en el CDN sin firmar nada. */
const IMAGE_BUCKET = 'product-images';

export type ProductImage = {
  id: number;
  url: string;
  is_primary: boolean;
  order: number;
};

export async function listProductImages(productId: number): Promise<ProductImage[]> {
  const { data, error } = await (db() as any).rpc('get_product_images', {
    p_id_producto: productId,
  });
  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    id: i.id_imagen,
    url: i.url,
    is_primary: i.es_principal,
    order: i.orden,
  }));
}

/**
 * Sube el archivo al bucket y registra la fila. El orden importa: si el insert
 * fallara después de subir quedaría un archivo huérfano, así que se borra el
 * objeto antes de propagar el error.
 *
 * La subida va por el servidor con service_role a propósito — el bucket no
 * acepta escrituras con la anon key, así que un tercero no puede llenarlo.
 */
export async function uploadProductImage(
  productId: number,
  file: File,
  isPrimary: boolean
): Promise<ProductImage> {
  const supabase = db();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  // El nombre lo genera el servidor: el del archivo original puede traer rutas,
  // acentos o colisionar entre productos.
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  const { data, error } = await (db() as any).rpc('add_product_image', {
    p_id_producto: productId,
    p_url: pub.publicUrl,
    p_es_principal: isPrimary,
    p_orden: 0,
  });

  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    throw error;
  }

  return { id: data as number, url: pub.publicUrl, is_primary: isPrimary, order: 0 };
}

/** Borra la fila y además el objeto del bucket, para no dejar basura pagando espacio. */
export async function deleteProductImage(imageId: number): Promise<void> {
  const { data: url, error } = await (db() as any).rpc('delete_product_image', {
    p_id_imagen: imageId,
  });
  if (error) throw error;

  const marker = `/${IMAGE_BUCKET}/`;
  const idx = String(url).indexOf(marker);
  if (idx !== -1) {
    const path = String(url).slice(idx + marker.length);
    // Si esto falla el registro ya se borró: la imagen desaparece de la UI y solo
    // queda un archivo suelto. No se propaga para no fallar la acción del usuario.
    await db().storage.from(IMAGE_BUCKET).remove([path]);
  }
}

export async function setPrimaryProductImage(imageId: number): Promise<void> {
  const { error } = await (db() as any).rpc('set_primary_product_image', {
    p_id_imagen: imageId,
  });
  if (error) throw error;
}
