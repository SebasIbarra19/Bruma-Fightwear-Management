# Admin Creation Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the three inert "+Add" buttons in the admin panel (Catalog, Inventory, Orders) to real creation forms backed by the actual Supabase schema, fixing two real stored-procedure bugs discovered along the way.

**Architecture:** Fix/extend three stored procedures in a new migration, extend the corresponding adapters/routes/hooks to expose create operations, build one shared BRUMA-styled modal/field kit on top of the existing Radix `Dialog` primitive, then build and wire three page-specific forms on top of that kit.

**Tech Stack:** Next.js 14 (App Router) API routes, Supabase (Postgres + PostgREST RPC), `@supabase/supabase-js` service client, React (client components), Radix UI `Dialog` (already a dependency), Tailwind CSS with the existing BRUMA design tokens (`obsidian`/`ember`/`bone`, `font-geist`/`font-fraunces`).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-07-admin-creation-forms-design.md` — read it before starting, it has the full schema reasoning.
- No `projectId` parameter anywhere in new code — the single-project architecture is canonical (see `FINDINGS.md`).
- Follow the existing BRUMA visual language exactly: `bg-obsidian`, `text-bone`, `text-ember`, `font-geist` for labels/UI text (uppercase, `tracking-[0.15em]`–`[0.25em]`), `font-fraunces` for headings, `rounded-[2px]` for inputs/chips, `rounded-[4px]` for panels/buttons — copy these from `src/components/figma-shared/Common.tsx` and `src/app/(admin)/inventory/page.tsx`'s existing chip filters, don't invent new tokens.
- Movements stays read-only — no create button, no task touches it. Confirmed correct by the user: movement log rows are always a side effect of another action.
- All money values are `numeric` in Postgres — always parse with `parseFloat`/`Number(...)` on the way in and `.toFixed(2)` on the way out, never string concatenation.
- No test framework exists in this repo (`package.json` has no `jest`/`vitest`). Verification steps use `npm run type-check`, direct `curl` against the dev server / Supabase REST endpoint, and manual browser checks — follow each task's verification step exactly, don't invent a test framework.

---

## Task 1: Fix stored procedures (`create_product`, `adjust_inventory`) and add `create_collection`

**Files:**
- Create: `supabase/migrations/20260807120000_fix_product_inventory_sps.sql`

**Interfaces:**
- Produces: `create_product(p_nombre, p_descripcion, p_codigo, p_id_categoria, p_id_coleccion, p_id_proveedor, p_activo)` returning a row including `id_producto, nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo, fecha_creacion`.
- Produces: `create_collection(p_nombre, p_descripcion)` returning `id_coleccion, nombre, descripcion`.
- Produces: `adjust_inventory(p_id_producto_talla, p_cantidad_cambio, p_motivo)` returning the same `jsonb` shape as before (`id_producto_talla, stock_anterior, cambio, stock_nuevo, tipo_movimiento, success`), auto-inserting into `inventario_movimiento`.

Two real bugs are being fixed here (see the design spec for the discovery trail):
1. `create_product` didn't accept `p_id_coleccion`/`p_id_proveedor` even though `producto` has both columns — `createCatalogProduct()` in `catalog-adapter.ts` already calls it with those params, so every product creation attempt fails today.
2. `adjust_inventory`'s deployed signature is `(p_id_variante, p_id_talla_proveedor, p_cantidad_cambio, p_motivo)`, but `InventoryAdapter.adjustInventory()` in `src/lib/database/adapters/inventory-adapter.ts:177` calls it with `p_id_producto_talla` — a parameter name that doesn't exist on the deployed function. This is fixed by changing the SP to take `p_id_producto_talla` directly (the row's own primary key), matching how every other part of the app already references a stock row and requiring zero adapter changes.

- [ ] **Step 1: Write the migration file**

```sql
-- Fix create_product: add id_coleccion/id_proveedor support (producto table
-- already has both columns; the SP just never exposed them).
DROP FUNCTION IF EXISTS public.create_product(character varying, text, character varying, integer, boolean);

CREATE OR REPLACE FUNCTION public.create_product(
  p_nombre character varying,
  p_descripcion text DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_id_coleccion integer DEFAULT NULL,
  p_id_proveedor integer DEFAULT NULL,
  p_activo boolean DEFAULT TRUE
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  id_coleccion integer,
  id_proveedor integer,
  activo boolean,
  fecha_creacion timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.producto (
      nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo
    )
    VALUES (
      p_nombre,
      p_descripcion,
      COALESCE(p_codigo, upper(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '', 'g'))),
      p_id_categoria,
      p_id_coleccion,
      p_id_proveedor,
      COALESCE(p_activo, TRUE)
    )
    RETURNING id_producto, nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo, fecha_creacion
  )
  SELECT id_producto, nombre, descripcion, codigo, id_categoria, id_coleccion, id_proveedor, activo, fecha_creacion
  FROM inserted;
$$;

-- New: create_collection, mirrors the existing create_category shape.
CREATE OR REPLACE FUNCTION public.create_collection(
  p_nombre character varying,
  p_descripcion text DEFAULT NULL
)
RETURNS TABLE (
  id_coleccion integer,
  nombre character varying,
  descripcion text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.coleccion (nombre, descripcion)
    VALUES (p_nombre, p_descripcion)
    RETURNING id_coleccion, nombre, descripcion
  )
  SELECT id_coleccion, nombre, descripcion FROM inserted;
$$;

-- Fix adjust_inventory: key off id_producto_talla directly (the caller,
-- InventoryAdapter.adjustInventory, already only has that id available).
DROP FUNCTION IF EXISTS public.adjust_inventory(integer, integer, integer, text);

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_id_producto_talla integer,
  p_cantidad_cambio integer,
  p_motivo text DEFAULT 'ajuste manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_actual integer;
  v_nuevo_stock integer;
  v_tipo_movimiento text;
BEGIN
  SELECT stock INTO v_stock_actual
  FROM public.productotallastock
  WHERE id_producto_talla = p_id_producto_talla;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION 'Registro de stock no encontrado para id_producto_talla %', p_id_producto_talla;
  END IF;

  v_nuevo_stock := v_stock_actual + p_cantidad_cambio;
  v_tipo_movimiento := CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END;

  UPDATE public.productotallastock
  SET stock = GREATEST(v_nuevo_stock, 0)
  WHERE id_producto_talla = p_id_producto_talla;

  INSERT INTO public.inventario_movimiento (
    id_producto_talla, tipo_movimiento, cantidad, motivo
  ) VALUES (
    p_id_producto_talla, v_tipo_movimiento, ABS(p_cantidad_cambio), p_motivo
  );

  RETURN jsonb_build_object(
    'id_producto_talla', p_id_producto_talla,
    'stock_anterior', v_stock_actual,
    'cambio', p_cantidad_cambio,
    'stock_nuevo', GREATEST(v_nuevo_stock, 0),
    'tipo_movimiento', v_tipo_movimiento,
    'success', TRUE
  );
END;
$$;
```

- [ ] **Step 2: Apply the migration to the live Supabase project**

Run:
```bash
npx supabase db push
```
Expected: output lists `20260807120000_fix_product_inventory_sps.sql` as applied, no errors. If the CLI isn't linked to the right project, check `FINDINGS.md`'s "CRÍTICO: las 50 stored procedures..." entry first — the project ref must be `tlutwoinynuyivxivakt` per that entry, matching the keys in `.env`.

- [ ] **Step 3: Verify each function via curl**

```bash
source .env
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/create_collection" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_nombre": "__plan_verify_collection__"}'
```
Expected: `200 OK` JSON array with one object containing `id_coleccion`.

```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/create_product" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_nombre": "__plan_verify_product__", "p_id_coleccion": null, "p_id_proveedor": null}'
```
Expected: `200 OK` JSON array with one object containing `id_producto`. Note the `id_producto` returned — needed for the next check.

```bash
# Replace <id_producto_talla> with a real row id, e.g. from:
# curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/productotallastock?select=id_producto_talla&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/adjust_inventory" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_id_producto_talla": <id_producto_talla>, "p_cantidad_cambio": 0, "p_motivo": "plan verification, no-op"}'
```
Expected: `200 OK` JSON object with `"success": true` and `"cambio": 0`.

- [ ] **Step 4: Clean up verification rows**

```bash
curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/producto?nombre=eq.__plan_verify_product__" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/coleccion?nombre=eq.__plan_verify_collection__" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260807120000_fix_product_inventory_sps.sql
git commit -m "fix: create_product missing id_coleccion/id_proveedor, adjust_inventory param mismatch; add create_collection"
```

---

## Task 2: Catalog backend — collections, inline category/collection creation, full product creation

**Files:**
- Modify: `src/lib/database/adapters/catalog-adapter.ts`
- Modify: `src/app/api/catalog/route.ts`
- Create: `src/app/api/catalog/categories/route.ts`
- Create: `src/app/api/catalog/collections/route.ts`
- Modify: `src/hooks/useCatalogData.ts`

**Interfaces:**
- Consumes: `create_product`, `create_collection`, `create_category`, `create_product_variant` (Task 1 + existing SPs).
- Produces: `createCatalogProductWithStock(input: CreateFullCatalogProductInput): Promise<CatalogProduct>`, `createCatalogCategory(nombre: string): Promise<{id: number; name: string}>`, `createCatalogCollection(nombre: string): Promise<{id: number; name: string}>`, `listCollectionsForFilter(): Promise<CollectionForFilter[]>` — all in `catalog-adapter.ts`, consumed by Task 6.
- Produces: `useCatalogData()` now also returns `collections`, `createProduct`, `createCategory`, `createCollection` — consumed by Task 6.

- [ ] **Step 1: Add collection listing + inline-create + full product creation to the adapter**

Append to `src/lib/database/adapters/catalog-adapter.ts` (after the existing `createCatalogProduct` function):

```typescript
export type CollectionForFilter = { id: number; name: string };

export async function listCollectionsForFilter(): Promise<CollectionForFilter[]> {
  const { data, error } = await (db() as any)
    .from('coleccion')
    .select('id_coleccion, nombre')
    .order('nombre');
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ id: c.id_coleccion, name: c.nombre }));
}

export async function createCatalogCategory(nombre: string): Promise<{ id: number; name: string }> {
  const { data, error } = await (db() as any).rpc('create_category', { p_nombre: nombre });
  if (error) throw error;
  const c = data?.[0];
  if (!c) throw new Error('Failed to create category');
  return { id: c.id_tipo, name: c.nombre };
}

export async function createCatalogCollection(nombre: string): Promise<CollectionForFilter> {
  const { data, error } = await (db() as any).rpc('create_collection', { p_nombre: nombre });
  if (error) throw error;
  const c = data?.[0];
  if (!c) throw new Error('Failed to create collection');
  return { id: c.id_coleccion, name: c.nombre };
}

const DEFAULT_PROVIDER_NAME = 'BRUMA Fightwear';

async function resolveDefaultProviderId(): Promise<number> {
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

async function resolveTallaProveedorId(providerId: number, sizeCode: string): Promise<number> {
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
  const product = await createCatalogProduct({
    nombre: input.nombre,
    codigo: input.codigo || '',
    descripcion: input.descripcion,
    id_categoria: input.id_categoria,
    id_coleccion: input.id_coleccion,
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
    const providerId = await resolveDefaultProviderId();
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
    const { error: stockErr } = await (client as any).from('productotallastock').insert(stockRows);
    if (stockErr) throw stockErr;
  }

  return product;
}
```

`createCatalogProduct`'s `codigo` field was previously required as a non-optional string in `CreateCatalogProductInput`; leave that type as-is, this new function just always passes a string (possibly empty, which `create_product`'s `COALESCE(p_codigo, ...)` only auto-generates for when `p_codigo` is SQL `NULL` — pass `null` instead of `''` when `input.codigo` is falsy so the auto-generation actually kicks in). Fix this one line inline as part of this step:

```typescript
    codigo: input.codigo || null as any,
```

- [ ] **Step 2: Update the catalog API route to expose collections and use full product creation**

Edit `src/app/api/catalog/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  listCatalogProducts,
  listCategoriesForFilter,
  listProductLinesForFilter,
  listCollectionsForFilter,
  toggleCatalogProductStatus,
  deleteCatalogProduct,
  createCatalogProductWithStock,
} from '@/lib/database/adapters/catalog-adapter';

export async function GET() {
  try {
    const [products, categories, productLines, collections] = await Promise.all([
      listCatalogProducts(),
      listCategoriesForFilter(),
      listProductLinesForFilter(),
      listCollectionsForFilter(),
    ]);
    return NextResponse.json({ data: products, categories, productLines, collections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const data = await createCatalogProductWithStock(input);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json();
    await toggleCatalogProductStatus(id, is_active);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  try {
    await deleteCatalogProduct(Number(id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add the inline category/collection creation routes**

Create `src/app/api/catalog/categories/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCatalogCategory } from '@/lib/database/adapters/catalog-adapter';

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }
    const data = await createCatalogCategory(String(nombre).trim());
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

Create `src/app/api/catalog/collections/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCatalogCollection } from '@/lib/database/adapters/catalog-adapter';

export async function POST(req: NextRequest) {
  try {
    const { nombre } = await req.json();
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 });
    }
    const data = await createCatalogCollection(String(nombre).trim());
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Extend `useCatalogData` with collections + create methods**

Edit `src/hooks/useCatalogData.ts`:

```typescript
import { useEffect, useState } from 'react';
import type {
  CatalogProduct,
  CategoryForFilter,
  ProductLineForFilter,
  CollectionForFilter,
} from '@/lib/database/adapters/catalog-adapter';

interface UseCatalogDataResult {
  products: CatalogProduct[];
  categories: CategoryForFilter[];
  productLines: ProductLineForFilter[];
  collections: CollectionForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  createProduct: (payload: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    id_categoria?: number | null;
    id_coleccion?: number | null;
    precio: number;
    stockQty: number;
    sizes: string[];
  }) => Promise<void>;
  createCategory: (nombre: string) => Promise<{ id: number; name: string }>;
  createCollection: (nombre: string) => Promise<{ id: number; name: string }>;
}

export function useCatalogData(): UseCatalogDataResult {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryForFilter[]>([]);
  const [productLines, setProductLines] = useState<ProductLineForFilter[]>([]);
  const [collections, setCollections] = useState<CollectionForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/catalog`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setProducts(result.data ?? []);
          setCategories(result.categories ?? []);
          setProductLines(result.productLines ?? []);
          setCollections(result.collections ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    await fetch('/api/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentStatus }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
    );
  };

  const deleteProduct = async (id: number) => {
    await fetch(`/api/catalog?id=${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const createProduct: UseCatalogDataResult['createProduct'] = async (payload) => {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    refetch();
  };

  const createCategory: UseCatalogDataResult['createCategory'] = async (nombre) => {
    const res = await fetch('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result.data;
  };

  const createCollection: UseCatalogDataResult['createCollection'] = async (nombre) => {
    const res = await fetch('/api/catalog/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result.data;
  };

  return {
    products,
    categories,
    productLines,
    collections,
    loading,
    error,
    refetch,
    toggleStatus,
    deleteProduct,
    createProduct,
    createCategory,
    createCollection,
  };
}
```

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no new errors from the files touched in this task.

- [ ] **Step 6: Verify end-to-end with curl against the dev server**

```bash
npm run dev &
sleep 3
curl -s -X POST http://localhost:3000/api/catalog/categories -H "Content-Type: application/json" -d '{"nombre":"__plan_verify_cat__"}'
curl -s -X POST http://localhost:3000/api/catalog/collections -H "Content-Type: application/json" -d '{"nombre":"__plan_verify_col__"}'
curl -s -X POST http://localhost:3000/api/catalog -H "Content-Type: application/json" -d '{"nombre":"__plan_verify_product__","precio":29.99,"stockQty":5,"sizes":["S","M"]}'
curl -s http://localhost:3000/api/catalog | head -c 500
```
Expected: each POST returns `{"success":true,"data":{...}}`; the final GET's response includes `collections` with `__plan_verify_col__` in it. Clean up the verification rows the same way as Task 1 Step 4 (plus `DELETE` on `coleccion?nombre=eq.__plan_verify_col__` and `tipoproducto?nombre=eq.__plan_verify_cat__`), then stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/database/adapters/catalog-adapter.ts src/app/api/catalog/route.ts src/app/api/catalog/categories/route.ts src/app/api/catalog/collections/route.ts src/hooks/useCatalogData.ts
git commit -m "feat: full catalog product creation (collections, inline category/collection, variant+stock)"
```

---

## Task 3: Orders backend — create order + line items

**Files:**
- Modify: `src/lib/database/adapters/orders-adapter.ts`
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/hooks/useOrdersData.ts`

**Interfaces:**
- Consumes: `create_order`, `add_order_item` (existing SPs, unchanged).
- Produces: `OrdersAdapter.addOrderItem(params): Promise<number>` — consumed by the new route.
- Produces: `POST /api/orders` accepting `{ cliente_nombre, cliente_email, id_estado, items: [{id_producto_talla, cantidad, precio_unitario}] }`, returning `ApiResponse.success(order)`.
- Produces: `useOrdersData()`'s return value gains `createOrder(payload): Promise<void>` — consumed by Task 8.

- [ ] **Step 1: Add `addOrderItem` to `OrdersAdapter`**

Edit `src/lib/database/adapters/orders-adapter.ts`, add this method inside the `OrdersAdapter` class (after `createOrder`):

```typescript
  async addOrderItem(params: {
    id_pedido: number;
    id_producto_talla: number;
    cantidad: number;
    precio_unitario: number;
  }): Promise<number> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('add_order_item', {
      p_id_pedido: params.id_pedido,
      p_id_producto_talla: params.id_producto_talla,
      p_cantidad: params.cantidad,
      p_precio_unitario: params.precio_unitario,
    });
    if (error) throw new DatabaseError('Failed to add order item', { originalError: error });
    return data;
  }
```

- [ ] **Step 2: Add the POST handler to the orders route**

Edit `src/app/api/orders/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
import { OrdersAdapter, ListOrdersParams } from '@/lib/database/adapters/orders-adapter';

async function getOrdersHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params: ListOrdersParams = {
    id_cliente: searchParams.has('id_cliente') ? parseInt(searchParams.get('id_cliente')!, 10) : undefined,
    id_estado: searchParams.has('id_estado') ? parseInt(searchParams.get('id_estado')!, 10) : undefined,
    start_date: searchParams.get('start_date'),
    end_date: searchParams.get('end_date'),
    min_amount: searchParams.has('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
    max_amount: searchParams.has('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
    search: searchParams.get('search'),
    limit: parseInt(searchParams.get('limit') || '50', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };

  const adapter = new OrdersAdapter();
  const orders = await adapter.listOrders(params);

  return ApiResponse.success(orders);
}

interface CreateOrderItemInput {
  id_producto_talla: number;
  cantidad: number;
  precio_unitario: number;
}

async function postOrdersHandler(request: NextRequest) {
  const body = await request.json();
  const { cliente_nombre, cliente_email, id_estado, items } = body as {
    cliente_nombre?: string;
    cliente_email?: string;
    id_estado?: number;
    items?: CreateOrderItemInput[];
  };

  if (!cliente_nombre || !String(cliente_nombre).trim()) {
    throw new ValidationError('cliente_nombre es requerido');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items debe tener al menos un producto');
  }

  const total = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);

  const adapter = new OrdersAdapter();
  const order = await adapter.createOrder({
    id_estado: id_estado || 1,
    cliente_nombre,
    cliente_email,
    total,
  });

  for (const item of items) {
    await adapter.addOrderItem({
      id_pedido: order.id_pedido,
      id_producto_talla: item.id_producto_talla,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    });
  }

  return ApiResponse.success(order);
}

export const GET = withErrorHandling(getOrdersHandler);
export const POST = withErrorHandling(postOrdersHandler);
```

- [ ] **Step 3: Add `createOrder` to `useOrdersData`**

Edit `src/hooks/useOrdersData.ts`, add inside the return value:

```typescript
  const createOrder = async (payload: {
    cliente_nombre: string;
    cliente_email: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al crear el pedido');
    refetch();
  };

  return { orders, loading, error, refetch, createOrder };
```

(Update the `UseOrdersDataResult` interface at the top of the file to add `createOrder: (payload: { cliente_nombre: string; cliente_email: string; id_estado: number; items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[] }) => Promise<void>;`.)

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: no new errors.

- [ ] **Step 5: Verify with curl against the dev server**

```bash
npm run dev &
sleep 3
# Get a real id_producto_talla + precio first:
curl -s "http://localhost:3000/api/inventory/items?limit=1" | head -c 500
# Then, using that id and precio:
curl -s -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" \
  -d '{"cliente_nombre":"__plan_verify_customer__","cliente_email":"test@example.com","id_estado":1,"items":[{"id_producto_talla":<id>,"cantidad":1,"precio_unitario":<precio>}]}'
```
Expected: `{"success":true,"data":{"id_pedido":...}}`. Confirm the movement log picked it up:
```bash
curl -s "http://localhost:3000/api/inventory-movements" | head -c 800
```
Expected: a new row with `motivo` starting `"Venta - Pedido #"`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/database/adapters/orders-adapter.ts src/app/api/orders/route.ts src/hooks/useOrdersData.ts
git commit -m "feat: add POST /api/orders (create_order + add_order_item)"
```

---

## Task 4: Inventory backend — drop the `projectId` gate on stock adjustment

**Files:**
- Modify: `src/app/api/inventory/adjust/route.ts`
- Create: `src/lib/inventory-movements-client.ts`

**Interfaces:**
- Produces: `logInventoryMovement(payload: { inventoryId: number; quantityChange: number; reason: string }): Promise<AdjustmentResult>` — consumed by Task 7.

`InventoryAdapter.adjustInventory()` itself needs no changes (Task 1 already fixed the SP it calls). The only problem is the route wraps the handler in `withProjectValidation`, which rejects any request without a `projectId` query param — and this new form deliberately never sends one, per the single-project architecture.

- [ ] **Step 1: Remove the `projectId` gate**

Edit `src/app/api/inventory/adjust/route.ts` — replace the final export:

```typescript
export const POST = withErrorHandling(adjustInventoryHandler)
```

Remove the now-unused `withProjectValidation` import from the top of the file.

- [ ] **Step 2: Add a small client-side helper for the new form**

Create `src/lib/inventory-movements-client.ts`:

```typescript
export interface LogMovementPayload {
  inventoryId: number;
  quantityChange: number;
  reason: string;
}

export async function logInventoryMovement(payload: LogMovementPayload) {
  const res = await fetch('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventoryId: payload.inventoryId,
      quantityChange: payload.quantityChange,
      reason: payload.reason,
    }),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Error al registrar el movimiento');
  }
  return result.data;
}
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no new errors, and no leftover reference to `withProjectValidation` in `src/app/api/inventory/adjust/route.ts`.

- [ ] **Step 4: Verify with curl (no `projectId` in the URL)**

```bash
npm run dev &
sleep 3
curl -s "http://localhost:3000/api/inventory/items?limit=1"
# Using the id_producto_talla (called inventory_id in the response) from above:
curl -s -X POST http://localhost:3000/api/inventory/adjust -H "Content-Type: application/json" \
  -d '{"inventoryId": <id>, "quantityChange": 0, "reason": "plan verification, no-op"}'
```
Expected: `{"success":true,"data":{"success":true,"cambio":0,...}}` with **no** `projectId` anywhere in the request.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/inventory/adjust/route.ts src/lib/inventory-movements-client.ts
git commit -m "fix: drop vestigial projectId gate from /api/inventory/adjust"
```

---

## Task 5: Shared BRUMA modal + form-field kit

**Files:**
- Create: `src/components/figma-shared/Modal.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogPortal`, `DialogOverlay` from `src/components/ui/dialog.tsx` (existing Radix wrapper), `cn` from `@/lib/utils`.
- Produces: `FormModal`, `FieldLabel`, `TextInput`, `TextArea`, `NumberStepper`, `ChipPicker`, `InlineAddChip`, `SubmitBar` — consumed by Tasks 6, 7, 8.

- [ ] **Step 1: Write the shared kit**

Create `src/components/figma-shared/Modal.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Plus, Minus } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function FormModal({
  open,
  onOpenChange,
  eyebrow,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-obsidian/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "bg-obsidian border border-bone/20 rounded-[4px] shadow-[0_0_40px_rgba(0,0,0,0.6)]",
            "max-h-[85vh] overflow-y-auto"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-bone/10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-5 h-[1px] bg-ember" />
                <p className="font-geist text-[9px] text-ember uppercase tracking-[0.25em] font-bold">{eyebrow}</p>
              </div>
              <h2 className="font-fraunces font-black text-xl uppercase tracking-tighter text-bone">{title}</h2>
            </div>
            <DialogPrimitive.Close className="text-bone/40 hover:text-bone transition-colors">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold mb-2">
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm font-geist focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all",
        props.className
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm font-geist focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all resize-none",
        props.className
      )}
    />
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center border border-bone/20 rounded-[2px] bg-bone/5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-10 flex items-center justify-center text-bone/60 hover:text-ember transition-colors"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value, 10) || 0))}
        className="w-full text-center bg-transparent text-bone text-sm font-geist font-bold focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-10 flex items-center justify-center text-bone/60 hover:text-ember transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function ChipPicker({
  options,
  selected,
  onToggle,
}: {
  options: { id: string | number; label: string }[];
  selected: Set<string | number>;
  onToggle: (id: string | number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onToggle(opt.id)}
          className={cn(
            "px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border",
            selected.has(opt.id)
              ? "bg-ember text-obsidian border-ember"
              : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function InlineAddChip({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(value.trim());
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-xs font-geist focus:outline-none focus:border-ember"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={submitting}
        className="px-3 py-1.5 bg-ember/10 text-ember border border-ember/30 rounded-[2px] text-[10px] uppercase font-geist font-bold hover:bg-ember/20 transition-colors disabled:opacity-50"
      >
        + Add
      </button>
    </div>
  );
}

export function SubmitBar({
  submitLabel,
  loading,
  error,
}: {
  submitLabel: string;
  loading: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-ember text-obsidian font-geist text-xs font-bold uppercase tracking-[0.15em] rounded-[4px] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] disabled:opacity-50"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/figma-shared/Modal.tsx
git commit -m "feat: add shared BRUMA-styled modal + form-field kit"
```

---

## Task 6: Catalog "Add to Catalog" form

**Files:**
- Create: `src/components/catalog/AddProductModal.tsx`
- Modify: `src/app/(admin)/catalog/page.tsx`

**Interfaces:**
- Consumes: `FormModal, FieldLabel, TextInput, TextArea, NumberStepper, ChipPicker, InlineAddChip, SubmitBar` (Task 5); `useCatalogData()`'s `categories, collections, createProduct, createCategory, createCollection` (Task 2).

- [ ] **Step 1: Write the modal component**

Create `src/components/catalog/AddProductModal.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  FormModal,
  FieldLabel,
  TextInput,
  TextArea,
  NumberStepper,
  ChipPicker,
  InlineAddChip,
  SubmitBar,
} from "@/components/figma-shared/Modal";

const SIZE_OPTIONS = ["OS", "XS", "S", "M", "L", "XL", "XXL"].map((s) => ({ id: s, label: s }));

interface NamedOption {
  id: number;
  name: string;
}

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: NamedOption[];
  collections: NamedOption[];
  onCreateCategory: (name: string) => Promise<NamedOption>;
  onCreateCollection: (name: string) => Promise<NamedOption>;
  onSubmit: (payload: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    id_categoria: number | null;
    id_coleccion: number | null;
    precio: number;
    stockQty: number;
    sizes: string[];
  }) => Promise<void>;
}

export function AddProductModal({
  open,
  onOpenChange,
  categories,
  collections,
  onCreateCategory,
  onCreateCollection,
  onSubmit,
}: AddProductModalProps) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [stockQty, setStockQty] = useState(0);
  const [sizes, setSizes] = useState<Set<string | number>>(new Set());
  const [localCategories, setLocalCategories] = useState(categories);
  const [localCollections, setLocalCollections] = useState(collections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalCollections(collections), [collections]);

  useEffect(() => {
    if (!open) {
      setNombre(""); setCodigo(""); setDescripcion("");
      setCategoryId(null); setCollectionId(null);
      setPrecio(""); setStockQty(0); setSizes(new Set());
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        codigo: codigo.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        id_categoria: categoryId,
        id_coleccion: collectionId,
        precio: parseFloat(precio) || 0,
        stockQty,
        sizes: Array.from(sizes) as string[],
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Join the Lineup" title="Add to Catalog">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <FieldLabel>Product Name</FieldLabel>
          <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="e.g. Bruma Tiger Tee" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Price ($)</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <FieldLabel>Stock Qty</FieldLabel>
            <NumberStepper value={stockQty} onChange={setStockQty} />
          </div>
        </div>

        <div>
          <FieldLabel>Collection</FieldLabel>
          <ChipPicker
            options={localCollections.map((c) => ({ id: c.id, label: c.name }))}
            selected={collectionId !== null ? new Set([collectionId]) : new Set()}
            onToggle={(id) => setCollectionId(id as number)}
          />
          <InlineAddChip
            placeholder="New collection name..."
            onAdd={async (name) => {
              const created = await onCreateCollection(name);
              setLocalCollections((prev) => [...prev, created]);
              setCollectionId(created.id);
            }}
          />
        </div>

        <div>
          <FieldLabel>Category</FieldLabel>
          <ChipPicker
            options={localCategories.map((c) => ({ id: c.id, label: c.name }))}
            selected={categoryId !== null ? new Set([categoryId]) : new Set()}
            onToggle={(id) => setCategoryId(id as number)}
          />
          <InlineAddChip
            placeholder="New category name..."
            onAdd={async (name) => {
              const created = await onCreateCategory(name);
              setLocalCategories((prev) => [...prev, created]);
              setCategoryId(created.id);
            }}
          />
        </div>

        <div>
          <FieldLabel>Available Sizes</FieldLabel>
          <ChipPicker
            options={SIZE_OPTIONS}
            selected={sizes}
            onToggle={(id) =>
              setSizes((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Optional product description" />
        </div>

        <SubmitBar submitLabel="Add to Lineup" loading={loading} error={error} />
      </form>
    </FormModal>
  );
}
```

- [ ] **Step 2: Wire it into the Catalog page**

Edit `src/app/(admin)/catalog/page.tsx`:

Add to the imports:
```typescript
import { AddProductModal } from "@/components/catalog/AddProductModal";
```

Change the destructuring on line 23 to also pull the new fields:
```typescript
  const { products, categories, collections, loading, error, refetch, createProduct, createCategory, createCollection } = useCatalogData();
  const [showAddModal, setShowAddModal] = useState(false);
```

Wire the button (replace the existing `<PageHeader ... />` block):
```tsx
      <PageHeader
        label="Product Line"
        title="Catalog"
        sub="Your full lineup — styled for the street and the mat."
        actionLabel="+ Add Product"
        actionIcon={<Plus size={16} />}
        onAction={() => setShowAddModal(true)}
        bgImage="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=300&fit=crop&auto=format"
      />

      <AddProductModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categories={categories}
        collections={collections}
        onCreateCategory={createCategory}
        onCreateCollection={createCollection}
        onSubmit={createProduct}
      />
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Start the dev server preview, navigate to `/catalog`, click "+ Add Product", fill in name/price/at least one size, click "Add to Lineup". Confirm:
- The modal closes.
- The new product appears in the catalog table without a manual page reload.
- Re-opening the modal and clicking "+ Add" next to Category/Collection with a new name adds it as a selectable chip immediately.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/AddProductModal.tsx "src/app/(admin)/catalog/page.tsx"
git commit -m "feat: wire Add to Catalog form to the Catalog page"
```

---

## Task 7: Inventory "Log Movement" form (replaces the inert "+ Add Product" button)

**Files:**
- Create: `src/components/inventory/StockMovementModal.tsx`
- Modify: `src/app/(admin)/inventory/page.tsx`

**Interfaces:**
- Consumes: `FormModal, FieldLabel, TextInput, NumberStepper, SubmitBar` (Task 5); `logInventoryMovement` (Task 4); the page's already-loaded `inventory` list (from `useInventory()`) as the SKU source — no new fetch needed.

Movement types map to `tipo_movimiento`: **Stock In** → always `+quantity` (entrada), **Stock Out** → always `-quantity` (salida), **Adjustment** → user picks the sign, **Return** → always `+quantity` (entrada, motivo defaults to "Customer return"). **Transfer** from the mockup is intentionally not included: `inventario_movimiento` has no source/destination location concept at all (see the design spec), so a real two-location transfer isn't representable in the current schema — adding it would mean inventing a location model that doesn't exist anywhere else in the app. If it's needed later, it needs its own schema work, not a form field.

- [ ] **Step 1: Write the modal component**

Create `src/components/inventory/StockMovementModal.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, SlidersHorizontal, RotateCcw } from "lucide-react";
import { FormModal, FieldLabel, TextInput, NumberStepper, SubmitBar } from "@/components/figma-shared/Modal";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES = [
  { id: "in", label: "Stock In", description: "Received goods", icon: ArrowDown, color: "text-[#7ddb7d] border-[#7ddb7d]/40 bg-[#7ddb7d]/10" },
  { id: "out", label: "Stock Out", description: "Shipped or sold", icon: ArrowUp, color: "text-ember border-ember/40 bg-ember/10" },
  { id: "adjustment", label: "Adjustment", description: "Manual correction", icon: SlidersHorizontal, color: "text-bone border-bone/40 bg-bone/10" },
  { id: "return", label: "Return", description: "Customer return", icon: RotateCcw, color: "text-[#7ddb7d] border-[#7ddb7d]/40 bg-[#7ddb7d]/10" },
] as const;

type MovementTypeId = (typeof MOVEMENT_TYPES)[number]["id"];

export interface SkuOption {
  id: number;
  sku: string;
  productName: string;
  currentStock: number;
}

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuOptions: SkuOption[];
  onSubmit: (payload: { inventoryId: number; quantityChange: number; reason: string }) => Promise<void>;
}

export function StockMovementModal({ open, onOpenChange, skuOptions, onSubmit }: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<MovementTypeId>("in");
  const [skuId, setSkuId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMovementType("in");
      setSkuId(null);
      setQuantity(1);
      setDirection(1);
      setNote("");
      setError(null);
    }
  }, [open]);

  const activeType = MOVEMENT_TYPES.find((t) => t.id === movementType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuId) {
      setError("Selecciona un SKU");
      return;
    }
    setLoading(true);
    setError(null);
    const sign = movementType === "out" ? -1 : movementType === "adjustment" ? direction : 1;
    try {
      await onSubmit({
        inventoryId: skuId,
        quantityChange: sign * quantity,
        reason: note.trim() || activeType.description,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Inventory Event" title="Log Movement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <FieldLabel>Movement Type</FieldLabel>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {MOVEMENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMovementType(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 rounded-[2px] border text-[10px] font-geist uppercase tracking-widest transition-all",
                  movementType === t.id ? t.color : "text-bone/40 border-bone/15 hover:border-bone/40"
                )}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
          <div className={cn("px-3 py-2 rounded-[2px] border text-xs font-geist", activeType.color)}>
            {activeType.label} — {activeType.description}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <FieldLabel>Product SKU</FieldLabel>
            <select
              value={skuId ?? ""}
              onChange={(e) => setSkuId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-sm font-geist focus:outline-none focus:border-ember"
            >
              <option value="">Select SKU...</option>
              {skuOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.sku} — {opt.productName} ({opt.currentStock} in stock)
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>{movementType === "adjustment" ? "Quantity (+/-)" : "Quantity"}</FieldLabel>
            <div className="flex gap-2">
              {movementType === "adjustment" && (
                <select
                  value={direction}
                  onChange={(e) => setDirection(Number(e.target.value) as 1 | -1)}
                  className="px-2 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-sm font-geist"
                >
                  <option value={1}>+</option>
                  <option value={-1}>−</option>
                </select>
              )}
              <NumberStepper value={quantity} onChange={setQuantity} min={1} />
            </div>
          </div>
        </div>

        <div>
          <FieldLabel>Note</FieldLabel>
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or reference..." />
        </div>

        <SubmitBar submitLabel="Log It" loading={loading} error={error} />
      </form>
    </FormModal>
  );
}
```

- [ ] **Step 2: Wire it into the Inventory page**

Edit `src/app/(admin)/inventory/page.tsx`:

Add to the imports:
```typescript
import { StockMovementModal } from "@/components/inventory/StockMovementModal";
import { logInventoryMovement } from "@/lib/inventory-movements-client";
```

Add state and a derived `skuOptions` list right after the existing `inventory` memo (around line 120, after the `inventory: InventoryItem[] = useMemo(...)` block):
```typescript
  const [showMovementModal, setShowMovementModal] = useState(false);

  const skuOptions = useMemo(
    () => inventory.map((item) => ({
      id: Number(item.id),
      sku: item.sku,
      productName: item.name,
      currentStock: item.stock,
    })),
    [inventory]
  );
```

Update the `PageHeader` (around line 229) to wire the button and rename it — this button was previously inert and mislabeled (it said "Add Product" but this page adjusts stock on existing SKUs, not creates products — see the design spec for why):
```tsx
      <PageHeader
        label="Stock Control"
        title="Inventory"
        sub="Track every SKU across the pack. Filter, sort, and spot low stock before the jungle runs dry."
        actionLabel="+ Log Movement"
        actionIcon={<Plus size={16} />}
        onAction={() => setShowMovementModal(true)}
        bgImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop&auto=format"
      />

      <StockMovementModal
        open={showMovementModal}
        onOpenChange={setShowMovementModal}
        skuOptions={skuOptions}
        onSubmit={async (payload) => {
          await logInventoryMovement(payload);
          await fetchInventory();
        }}
      />
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Navigate to `/inventory`, click "+ Log Movement", pick a SKU with a "Stock In" of quantity 5, submit. Confirm:
- The modal closes and the table's stock count for that SKU increases by 5 without a manual reload.
- Navigate to `/movements` and confirm the new entry appears there (this is the automatic-log behavior the user asked for — no separate action needed on the Movements page).

- [ ] **Step 5: Commit**

```bash
git add src/components/inventory/StockMovementModal.tsx "src/app/(admin)/inventory/page.tsx"
git commit -m "feat: wire Log Movement form to the Inventory page"
```

---

## Task 8: Orders "New Order" form

**Files:**
- Create: `src/components/orders/NewOrderModal.tsx`
- Modify: `src/app/(admin)/orders/page.tsx`

**Interfaces:**
- Consumes: `FormModal, FieldLabel, TextInput, SubmitBar` (Task 5); `useOrdersData()`'s `createOrder` (Task 3); `GET /api/inventory/items` (existing, reused for the product+size picker).

Known limitation, documented rather than silently worked around: the status picker's options are derived from `id_estado`/`estado_nombre` pairs already present on loaded orders (matching the existing dynamic-status-filter pattern on this page — see `FINDINGS.md`'s "removed hardcoded status filter values" entry). If the Orders table is ever completely empty, this modal would have no status to pick from. Given the app already has live orders (per the screenshots that kicked off this work), this is a acceptable, called-out edge case — not something this task builds a new `/api/estados` endpoint to solve.

- [ ] **Step 1: Write the modal component**

Create `src/components/orders/NewOrderModal.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import { FormModal, FieldLabel, TextInput, SubmitBar } from "@/components/figma-shared/Modal";
import { cn } from "@/lib/utils";

export interface OrderLineOption {
  id: number;
  label: string;
  price: number;
}

export interface StatusOption {
  id: number;
  label: string;
}

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineOptions: OrderLineOption[];
  statusOptions: StatusOption[];
  onSubmit: (payload: {
    cliente_nombre: string;
    cliente_email: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => Promise<void>;
}

export function NewOrderModal({ open, onOpenChange, lineOptions, statusOptions, onSubmit }: NewOrderModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [statusId, setStatusId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveStatusId = statusId ?? statusOptions[0]?.id ?? null;

  const toggleLine = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setNombre("");
    setEmail("");
    setSelected(new Set());
    setStatusId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }
    if (selected.size === 0) {
      setError("Selecciona al menos un producto");
      return;
    }
    if (!effectiveStatusId) {
      setError("No hay estados disponibles para asignar");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = lineOptions
        .filter((o) => selected.has(o.id))
        .map((o) => ({ id_producto_talla: o.id, cantidad: 1, precio_unitario: o.price }));
      await onSubmit({
        cliente_nombre: nombre.trim(),
        cliente_email: email.trim(),
        id_estado: effectiveStatusId,
        items,
      });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="New Drop" title="New Order">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Customer Name</FieldLabel>
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" />
          </div>
        </div>

        <div>
          <FieldLabel>Products</FieldLabel>
          <div className="max-h-48 overflow-y-auto border border-bone/15 rounded-[2px] divide-y divide-bone/10">
            {lineOptions.length === 0 && (
              <p className="px-3 py-4 text-xs text-bone/40 font-geist">No products with available stock.</p>
            )}
            {lineOptions.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center justify-between px-3 py-2.5 text-sm font-geist text-bone cursor-pointer hover:bg-bone/5"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(opt.id)}
                    onChange={() => toggleLine(opt.id)}
                    className="accent-ember"
                  />
                  {opt.label}
                </span>
                <span className="text-bone/60">${opt.price.toFixed(2)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusId(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border",
                  effectiveStatusId === s.id
                    ? "bg-ember text-obsidian border-ember"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <SubmitBar submitLabel="Place Order" loading={loading} error={error} />
      </form>
    </FormModal>
  );
}
```

- [ ] **Step 2: Wire it into the Orders page**

Edit `src/app/(admin)/orders/page.tsx`:

Add to the imports:
```typescript
import { NewOrderModal, OrderLineOption, StatusOption } from "@/components/orders/NewOrderModal";
```

Add state, a lazily-fetched product list, and a derived status list — insert after the existing `availableStatuses` memo (around line 62):
```typescript
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [lineOptions, setLineOptions] = useState<OrderLineOption[]>([]);

  const statusOptions: StatusOption[] = useMemo(() => {
    const map = new Map<number, string>();
    orders.forEach((o) => {
      if (o.id_estado && o.estado_nombre) map.set(o.id_estado, o.estado_nombre);
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [orders]);

  useEffect(() => {
    if (!showNewOrderModal) return;
    fetch("/api/inventory/items?limit=200")
      .then((res) => res.json())
      .then((result) => {
        const items = result.data ?? [];
        setLineOptions(
          items.map((i: any) => ({
            id: i.inventory_id,
            label: `${i.sku} — ${i.product_name}`,
            price: Number(i.price) || 0,
          }))
        );
      });
  }, [showNewOrderModal]);
```

Update the `PageHeader` (around line 117) to wire the button:
```tsx
      <PageHeader
        label="Order Center"
        title="Orders"
        sub="Manage and track all customer orders in real time."
        actionLabel="+ New Order"
        actionIcon={<Plus size={16} />}
        onAction={() => setShowNewOrderModal(true)}
        bgImage="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&h=300&fit=crop&auto=format"
      />

      <NewOrderModal
        open={showNewOrderModal}
        onOpenChange={setShowNewOrderModal}
        lineOptions={lineOptions}
        statusOptions={statusOptions}
        onSubmit={createOrder}
      />
```

Update the hook destructuring on line 22 to also pull `createOrder`:
```typescript
  const { orders, loading, error, refetch, createOrder } = useOrdersData({ limit: 50 });
```

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Navigate to `/orders`, click "+ New Order", fill in a customer name, check at least one product, pick a status, click "Place Order". Confirm:
- The modal closes and the new order appears at the top of the orders table without a manual reload.
- Selecting the new order in the list shows its detail panel with the selected product line.
- Navigate to `/movements` and confirm a `salida` (Venta - Pedido #...) entry was logged automatically for the product sold.

- [ ] **Step 5: Commit**

```bash
git add src/components/orders/NewOrderModal.tsx "src/app/(admin)/orders/page.tsx"
git commit -m "feat: wire New Order form to the Orders page"
```
