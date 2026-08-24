# Admin Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix real logic bugs (Orders can't be placed, Movements/Inventory show indistinguishable SKUs, product creation isn't logged as a movement), add the missing Catalog product-edit flow and Collection filters, and replace hardcoded/dead dashboard content with the project's existing "Próximamente" placeholder pattern.

**Architecture:** One migration fixes five stored procedures to expose size/collection data they were silently missing. Adapter and hook layers pass that data through unchanged in shape. Component-level fixes are scoped to the exact file each bug lives in — no new shared abstractions beyond one `SelectField` primitive added to the existing `figma-shared/Modal.tsx` kit (reused by Task 2, on the same pattern as `ChipPicker`/`NumberStepper` already there).

**Tech Stack:** Next.js 14 (App Router) API routes, Supabase (Postgres + PostgREST RPC), `@supabase/supabase-js` service client, React (client components), `@radix-ui/react-select` (already a dependency), Tailwind CSS with the existing BRUMA design tokens.

## Global Constraints

- Do NOT run `git add` or `git commit` in any task. The user reviews and commits everything themselves at the end of the whole plan.
- No `projectId` parameter anywhere in new code — the single-project architecture is canonical (see `FINDINGS.md`).
- Follow the existing BRUMA visual language exactly: `bg-obsidian`, `text-bone`, `text-ember`, `font-geist` for labels/UI text (uppercase, `tracking-[0.15em]`–`[0.25em]`), `font-fraunces` for headings, `rounded-[2px]` for inputs/chips, `rounded-[4px]` for panels/buttons — copy these from `src/components/figma-shared/Modal.tsx` and `src/components/figma-shared/Common.tsx`, don't invent new tokens.
- All money values are `numeric` in Postgres — always parse with `parseFloat`/`Number(...)` on the way in and `.toFixed(2)` on the way out, never string concatenation.
- No test framework exists in this repo (`package.json` has no `jest`/`vitest`). Verification steps use `npm run type-check`, direct `curl` against the dev server / Supabase REST endpoint, and manual browser checks — follow each task's verification step exactly, don't invent a test framework.
- When a verification step creates temporary data in the live Supabase database (a test product, order, etc.), clean it up (delete it) before finishing the task — this is a shared dev database, not a sandbox.
- The dev server may already be running on port 3000 from a prior task; check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` before starting a new one.

---

## Task 1: Backend SQL — expose size and collection data that five SPs were silently dropping

**Files:**
- Create: `supabase/migrations/20260812000000_polish_pass_sp_fixes.sql`

**Interfaces:**
- Produces: `get_inventory_movements(...)` now returns `producto_codigo`, `variante_codigo`, `talla_codigo` (previously missing entirely — the Movements page could not show a distinguishing SKU).
- Produces: `list_inventory_items(...)` now additionally returns `coleccion_nombre`.
- Produces: `list_products(...)` now additionally returns `id_coleccion`, `coleccion_nombre`.
- Produces: `update_product(...)` gains a new `p_id_coleccion` parameter (7 params total, in this order: `p_id_producto, p_nombre, p_codigo, p_descripcion, p_id_categoria, p_id_coleccion, p_activo`) and returns `id_coleccion`, `coleccion_nombre` alongside the existing columns.
- Produces: `get_product(...)` now additionally returns `id_coleccion`, `coleccion_nombre`, and each entry in the `variantes` jsonb array's `stock_tallas` now includes `talla_codigo` (previously only `id_producto_talla`/`id_talla_proveedor`/`stock`/`precio` — no human-readable size).

- [ ] **Step 1: Write the migration file**

```sql
-- ================================================
-- Polish pass: expose size (talla_codigo) and collection
-- (coleccion_nombre) data that these SPs were silently dropping,
-- causing indistinguishable SKUs and non-functional collection filters.
-- ================================================

-- Fix get_inventory_movements: return the fields needed to build a
-- distinguishing SKU (producto_codigo, variante_codigo, talla_codigo).
-- Previously returned only producto_nombre/variante_nombre.
DROP FUNCTION IF EXISTS public.get_inventory_movements(integer, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_inventory_movements(
  p_id_producto_talla integer DEFAULT NULL,
  p_tipo_movimiento text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_movimiento integer,
  id_producto_talla integer,
  producto_nombre character varying,
  producto_codigo character varying,
  variante_codigo character varying,
  talla_codigo character varying,
  tipo_movimiento character varying,
  cantidad integer,
  motivo text,
  fecha timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id_movimiento,
    m.id_producto_talla,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    pv.codigo_variante AS variante_codigo,
    tb.codigo AS talla_codigo,
    m.tipo_movimiento,
    m.cantidad,
    m.motivo,
    m.fecha
  FROM public.inventario_movimiento m
  JOIN public.productotallastock pts ON pts.id_producto_talla = m.id_producto_talla
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE (p_id_producto_talla IS NULL OR m.id_producto_talla = p_id_producto_talla)
    AND (p_tipo_movimiento IS NULL OR m.tipo_movimiento = p_tipo_movimiento)
  ORDER BY m.fecha DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Fix list_inventory_items: add coleccion_nombre (this function already
-- returns talla_codigo from migration 20260808000000 — this only adds
-- the collection join on top of that).
DROP FUNCTION IF EXISTS public.list_inventory_items(boolean, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.list_inventory_items(
  p_incluir_stock_cero boolean DEFAULT false,
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_producto_talla integer,
  id_producto integer,
  id_variante integer,
  producto_nombre character varying,
  producto_codigo character varying,
  categoria_nombre character varying,
  coleccion_nombre character varying,
  variante_nombre character varying,
  variante_codigo character varying,
  talla_codigo character varying,
  stock integer,
  precio numeric,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pts.id_producto_talla,
    p.id_producto,
    pv.id_variante,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    col.nombre AS coleccion_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    tb.codigo AS talla_codigo,
    pts.stock,
    pts.precio,
    CASE
      WHEN pts.stock <= 0 THEN 'critical'
      WHEN pts.stock <= 5 THEN 'warning'
      ELSE 'normal'
    END AS status
  FROM public.productotallastock pts
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE (p_incluir_stock_cero OR pts.stock > 0)
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
  ORDER BY p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Fix list_products: add id_coleccion/coleccion_nombre so the Catalog
-- page can filter products by collection.
DROP FUNCTION IF EXISTS public.list_products(integer, integer, integer, boolean, text);

CREATE OR REPLACE FUNCTION public.list_products(
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_activo boolean DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  categoria_nombre character varying,
  id_coleccion integer,
  coleccion_nombre character varying,
  activo boolean,
  variante_count bigint,
  stock_total bigint,
  fecha_creacion timestamp without time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH variant_stats AS (
    SELECT
      pv.id_producto,
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    GROUP BY pv.id_producto
  )
  SELECT
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.codigo,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.id_coleccion,
    col.nombre AS coleccion_nombre,
    p.activo,
    COALESCE(vs.variante_count, 0)::bigint AS variante_count,
    COALESCE(vs.stock_total, 0)::bigint AS stock_total,
    p.fecha_creacion
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN variant_stats vs ON vs.id_producto = p.id_producto
  WHERE (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    AND (p_activo IS NULL OR p.activo = p_activo)
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.nombre ILIKE '%' || p_search || '%'
      OR COALESCE(p.codigo, '') ILIKE '%' || p_search || '%'
      OR COALESCE(c.nombre, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY p.fecha_creacion DESC, p.nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Fix update_product: add p_id_coleccion so the Catalog edit flow can
-- change a product's collection (mirrors the create_product fix from
-- migration 20260807120000).
DROP FUNCTION IF EXISTS public.update_product(integer, character varying, character varying, text, integer, boolean);

CREATE OR REPLACE FUNCTION public.update_product(
  p_id_producto integer,
  p_nombre character varying DEFAULT NULL,
  p_codigo character varying DEFAULT NULL,
  p_descripcion text DEFAULT NULL,
  p_id_categoria integer DEFAULT NULL,
  p_id_coleccion integer DEFAULT NULL,
  p_activo boolean DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  codigo character varying,
  descripcion text,
  id_categoria integer,
  categoria_nombre character varying,
  id_coleccion integer,
  coleccion_nombre character varying,
  activo boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.producto p
    SET
      nombre = COALESCE(p_nombre, p.nombre),
      codigo = COALESCE(p_codigo, p.codigo),
      descripcion = COALESCE(p_descripcion, p.descripcion),
      id_categoria = COALESCE(p_id_categoria, p.id_categoria),
      id_coleccion = COALESCE(p_id_coleccion, p.id_coleccion),
      activo = COALESCE(p_activo, p.activo)
    WHERE p.id_producto = p_id_producto
    RETURNING p.*
  )
  SELECT
    u.id_producto,
    u.nombre,
    u.codigo,
    u.descripcion,
    u.id_categoria,
    c.nombre AS categoria_nombre,
    u.id_coleccion,
    col.nombre AS coleccion_nombre,
    u.activo
  FROM updated u
  LEFT JOIN public.tipoproducto c ON c.id_tipo = u.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = u.id_coleccion;
$$;

-- Fix get_product: add id_coleccion/coleccion_nombre at the top level,
-- and enrich each variant's stock_tallas with talla_codigo so the edit
-- UI can show human-readable sizes instead of raw ids.
DROP FUNCTION IF EXISTS public.get_product(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_product(
  p_id_producto integer DEFAULT NULL,
  p_codigo character varying DEFAULT NULL
)
RETURNS TABLE (
  id_producto integer,
  nombre character varying,
  descripcion text,
  codigo character varying,
  id_categoria integer,
  categoria_nombre character varying,
  id_coleccion integer,
  coleccion_nombre character varying,
  activo boolean,
  variante_count bigint,
  stock_total bigint,
  variantes jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id_producto,
    p.nombre,
    p.descripcion,
    p.codigo,
    p.id_categoria,
    c.nombre AS categoria_nombre,
    p.id_coleccion,
    col.nombre AS coleccion_nombre,
    p.activo,
    COALESCE(vs.variante_count, 0)::bigint AS variante_count,
    COALESCE(vs.stock_total, 0)::bigint AS stock_total,
    COALESCE(var_json.variantes, '[]'::jsonb) AS variantes
  FROM public.producto p
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  LEFT JOIN LATERAL (
    SELECT
      COUNT(DISTINCT pv.id_variante)::bigint AS variante_count,
      COALESCE(SUM(pts.stock), 0)::bigint AS stock_total
    FROM public.productovariante pv
    LEFT JOIN public.productotallastock pts ON pts.id_variante = pv.id_variante
    WHERE pv.id_producto = p.id_producto
  ) vs ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_variante', pv.id_variante,
        'id_color', pv.id_color,
        'codigo_variante', pv.codigo_variante,
        'nombre_variante', pv.nombre_variante,
        'precio_variante', pv.precio_variante,
        'activo', pv.activo,
        'stock_tallas', (
           SELECT jsonb_agg(jsonb_build_object(
             'id_producto_talla', pts.id_producto_talla,
             'id_talla_proveedor', pts.id_talla_proveedor,
             'talla_codigo', tb.codigo,
             'stock', pts.stock,
             'precio', pts.precio
           ))
           FROM public.productotallastock pts
           LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
           LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
           WHERE pts.id_variante = pv.id_variante
        )
      )
    ) AS variantes
    FROM public.productovariante pv
    WHERE pv.id_producto = p.id_producto
  ) var_json ON TRUE
  WHERE (p_id_producto IS NOT NULL AND p.id_producto = p_id_producto)
     OR (p_id_producto IS NULL AND p_codigo IS NOT NULL AND p.codigo = p_codigo)
  LIMIT 1;
$$;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: the CLI reports the new migration applied with no errors. If it reports "already up to date" or asks to link the project, run `npx supabase migration list` first to confirm you're linked to the project referenced in `.env`'s `NEXT_PUBLIC_SUPABASE_URL`, then retry.

- [ ] **Step 3: Verify all five functions via curl**

Run (`source .env` first to load `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`):

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/get_inventory_movements" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{}'
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/list_inventory_items" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{}'
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/list_products" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{}'
```

Expected: no `PGRST202`/`42883` errors (which would mean the signature didn't match). Empty `[]` arrays are fine if the tables are currently empty — the point is the call succeeds. Then create one temp product to exercise all five end to end:

```bash
curl -s -X POST http://localhost:3000/api/catalog -H "Content-Type: application/json" -d '{"nombre":"SqlFixVerify","codigo":"SQLFIX01","precio":15,"stockQty":2,"sizes":["M"]}'
```

Fetch its `id_producto` from the response, then:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/get_product" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"p_id_producto": <id>}'
```

Expected: response includes `id_coleccion`/`coleccion_nombre` at the top level, and `variantes[0].stock_tallas[0].talla_codigo` equals `"M"`. Then clean up (delete in FK order: `productotallastock` for the variant, then `productovariante`, then `producto` — use the same curl DELETE pattern used in prior tasks).

---

## Task 2: StockMovementModal — styled SKU dropdown, no native spinner, per-type stock validation

**Files:**
- Modify: `src/components/figma-shared/Modal.tsx` (add `SelectField`)
- Modify: `src/components/inventory/StockMovementModal.tsx`
- Modify: `src/app/globals.css` (hide native number-input spin buttons)

**Interfaces:**
- Consumes: `@radix-ui/react-select` (already installed, confirmed in `package.json`).
- Produces: `SelectField<T>({ value, onChange, placeholder, options }: { value: T | null; onChange: (value: T) => void; placeholder: string; options: { value: T; label: string }[] })` — exported from `src/components/figma-shared/Modal.tsx`, for use anywhere in the app that needs a BRUMA-styled dropdown (the native `<select>`'s open-state option list can't be restyled with CSS, hence a Radix-based replacement).

- [ ] **Step 1: Add `SelectField` to the shared modal kit**

In `src/components/figma-shared/Modal.tsx`, add this import alongside the existing ones at the top of the file:

```tsx
import * as SelectPrimitive from "@radix-ui/react-select";
```

And add `ChevronDown` to the existing `lucide-react` import (`import { X, Plus, Minus } from "lucide-react";` becomes `import { X, Plus, Minus, ChevronDown } from "lucide-react";`).

Then add this new export anywhere after `NumberStepper` and before `ChipPicker`:

```tsx
export function SelectField<T extends string | number>({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
  options: { value: T; label: string }[];
}) {
  const isNumeric = typeof options[0]?.value === "number";
  return (
    <SelectPrimitive.Root
      value={value !== null ? String(value) : undefined}
      onValueChange={(v) => onChange((isNumeric ? Number(v) : v) as T)}
    >
      <SelectPrimitive.Trigger className="w-full flex items-center justify-between px-3 py-2.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-sm font-geist focus:outline-none focus:border-ember data-[placeholder]:text-bone/30">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-bone/40" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 w-[var(--radix-select-trigger-width)] max-h-72 overflow-y-auto bg-obsidian border border-bone/20 rounded-[2px] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={String(opt.value)}
                value={String(opt.value)}
                className="px-3 py-2 text-sm font-geist text-bone rounded-[2px] outline-none cursor-pointer data-[highlighted]:bg-ember/10 data-[highlighted]:text-ember data-[state=checked]:text-ember"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
```

- [ ] **Step 2: Hide native number-input spin buttons globally**

In `src/app/globals.css`, add this block (anywhere at the top level, outside any existing `@layer` block, or inside an existing `@layer base` block if one exists in the file — check the file first and match its structure):

```css
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
```

- [ ] **Step 3: Replace the native SKU `<select>` and add per-type quantity validation**

In `src/components/inventory/StockMovementModal.tsx`, change the import line:

```tsx
import { FormModal, FieldLabel, TextInput, NumberStepper, SubmitBar } from "@/components/figma-shared/Modal";
```

to:

```tsx
import { FormModal, FieldLabel, TextInput, NumberStepper, SelectField, SubmitBar } from "@/components/figma-shared/Modal";
```

Replace the entire SKU `<select>` block:

```tsx
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
```

with:

```tsx
            <SelectField
              value={skuId}
              onChange={setSkuId}
              placeholder="Select SKU..."
              options={skuOptions.map((opt) => ({
                value: opt.id,
                label: `${opt.sku} — ${opt.productName} (${opt.currentStock} in stock)`,
              }))}
            />
```

Then update `handleSubmit` to validate quantity against available stock for reducing movements (Stock Out always reduces; Adjustment only reduces when direction is `-1`; Stock In and Return always add, so they need no cap). Replace:

```tsx
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
```

with:

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = skuOptions.find((o) => o.id === skuId);
    if (!skuId || !selectedOption) {
      setError("Selecciona un SKU");
      return;
    }
    const sign = movementType === "out" ? -1 : movementType === "adjustment" ? direction : 1;
    const delta = sign * quantity;
    if (delta < 0 && Math.abs(delta) > selectedOption.currentStock) {
      setError(`No hay suficiente stock. Disponible: ${selectedOption.currentStock}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        inventoryId: skuId,
        quantityChange: delta,
        reason: note.trim() || activeType.description,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Verify**

Run `npm run type-check` and confirm no new errors from `Modal.tsx`, `StockMovementModal.tsx`, or `globals.css`-adjacent files.

Then in the browser (start the dev server if not running: `npm run dev`), open Inventory, click the movement button, open the SKU dropdown — confirm it renders as a dark BRUMA-styled panel (not a native OS dropdown), and confirm hovering the quantity input no longer shows native up/down arrows next to the custom +/− buttons. Pick a SKU with known stock (e.g. 2 units), select "Stock Out", type a quantity greater than 2, submit — confirm the inline error "No hay suficiente stock. Disponible: 2" appears and no request is sent (check Network tab / server logs show no new POST). Then set quantity to 1 and submit — confirm it succeeds.

---

## Task 3: Movements page shows a real distinguishing SKU; product creation logs a movement

**Files:**
- Modify: `src/lib/database/adapters/inventory-movements-adapter.ts`
- Modify: `src/app/(admin)/movements/page.tsx`
- Modify: `src/lib/database/adapters/catalog-adapter.ts`

**Interfaces:**
- Consumes: `get_inventory_movements` from Task 1 (now returns `producto_codigo`/`variante_codigo`/`talla_codigo`).
- Produces: `MovementWithInventory` gains a `size: string | null` field.

- [ ] **Step 1: Update the movements adapter mapping**

In `src/lib/database/adapters/inventory-movements-adapter.ts`, change the `MovementWithInventory` type:

```ts
export type MovementWithInventory = {
  id: number;
  inventory_id: number;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  // Del join/extra
  sku: string | null;
  product_name: string | null;
};
```

to:

```ts
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
```

And update the mapping inside `listInventoryMovements`:

```ts
  return (data ?? []).map((m: any) => ({
    id: m.id_movimiento,
    inventory_id: m.id_producto_talla,
    movement_type: m.tipo_movimiento,
    quantity: m.cantidad,
    notes: m.motivo,
    created_at: m.fecha,
    sku: m.variante_codigo || m.producto_codigo,
    product_name: m.producto_nombre
  }));
```

to:

```ts
  return (data ?? []).map((m: any) => ({
    id: m.id_movimiento,
    inventory_id: m.id_producto_talla,
    movement_type: m.tipo_movimiento,
    quantity: m.cantidad,
    notes: m.motivo,
    created_at: m.fecha,
    sku: m.variante_codigo || m.producto_codigo,
    size: m.talla_codigo || null,
    product_name: m.producto_nombre
  }));
```

- [ ] **Step 2: Show the SKU + size in the Movements table's Product column**

In `src/app/(admin)/movements/page.tsx`, change the `Movement` interface:

```ts
interface Movement {
  id_movimiento: number;
  id_producto_talla: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string | null;
  fecha: string;
  producto_nombre: string;
  variante_nombre: string;
  producto_codigo: string;
}
```

to:

```ts
interface Movement {
  id_movimiento: number;
  id_producto_talla: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string | null;
  fecha: string;
  producto_nombre: string;
  size: string;
  producto_codigo: string;
}
```

Update the mapping that builds `movements`:

```ts
  const movements: Movement[] = useMemo(() => rawMovements.map((m: any) => ({
    id_movimiento: m.id,
    id_producto_talla: m.inventory_id,
    tipo_movimiento: m.movement_type,
    cantidad: m.quantity,
    motivo: m.notes,
    fecha: m.created_at,
    producto_nombre: m.product_name || 'Desconocido',
    variante_nombre: '',
    producto_codigo: m.sku || ''
  })), [rawMovements]);
```

to:

```ts
  const movements: Movement[] = useMemo(() => rawMovements.map((m: any) => ({
    id_movimiento: m.id,
    id_producto_talla: m.inventory_id,
    tipo_movimiento: m.movement_type,
    cantidad: m.quantity,
    motivo: m.notes,
    fecha: m.created_at,
    producto_nombre: m.product_name || 'Desconocido',
    size: m.size || '',
    producto_codigo: m.sku || ''
  })), [rawMovements]);
```

And update the `Product` column's `render` function:

```tsx
      render: (m) => (
        <div>
          <p className="font-fraunces text-base font-bold text-bone">{m.producto_nombre}</p>
          <p className="font-geist text-[10px] text-bone/50 uppercase tracking-widest mt-0.5">{m.producto_codigo} • {m.variante_nombre}</p>
        </div>
      )
```

to:

```tsx
      render: (m) => (
        <div>
          <p className="font-fraunces text-base font-bold text-bone">{m.producto_nombre}</p>
          <p className="font-geist text-[10px] text-bone/50 uppercase tracking-widest mt-0.5">{m.producto_codigo}{m.size ? ` • ${m.size}` : ''}</p>
        </div>
      )
```

- [ ] **Step 3: Log a movement when a new product is created with initial stock**

In `src/lib/database/adapters/catalog-adapter.ts`, inside `createCatalogProductWithStock`, replace this block:

```ts
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
    const { error: stockErr } = await (client as any).from('productotallastock').insert(stockRows);
    if (stockErr) throw stockErr;
  }
```

with:

```ts
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
```

- [ ] **Step 4: Verify**

Run `npm run type-check` and confirm no new errors from the 3 modified files.

Then (dev server running):

```bash
curl -s -X POST http://localhost:3000/api/catalog -H "Content-Type: application/json" -d '{"nombre":"MovementLogVerify","codigo":"MOVLOG01","precio":12,"stockQty":4,"sizes":["S","L"]}'
curl -s "http://localhost:3000/api/inventory-movements" | python3 -m json.tool
```

Expected: 2 new `entrada` movement rows, one per size, each `notes: "Producto creado en Catálogo — MovementLogVerify"` and `quantity: 4`. Open `/movements` in the browser and confirm the Product column shows something like `MOVLOG01 • S` and `MOVLOG01 • L` (not two identical rows). Then clean up: delete the 2 `inventario_movimiento` rows, the 2 `productotallastock` rows, the `productovariante` row, and the `producto` row for `MovementLogVerify` (same FK-order curl DELETE pattern as prior tasks).

---

## Task 4: Fix "No hay estados disponibles" — Orders can't be placed when the orders list is empty

**Files:**
- Modify: `src/lib/database/adapters/orders-adapter.ts`
- Create: `src/app/api/orders/statuses/route.ts`
- Modify: `src/hooks/useOrdersData.ts`
- Modify: `src/app/(admin)/orders/page.tsx`

**Root cause:** `orders/page.tsx` currently builds the New Order form's status options by scanning the *existing orders already in the list* for distinct status names (`orders.forEach((o) => { if (o.id_estado && o.estado_nombre) map.set(...) })`). When there are zero orders in the database — which is the current state, since prior verification passes deleted all test orders — there is nothing to derive statuses from, so the dropdown is empty and the form refuses to submit with "No hay estados disponibles para asignar". The fix is to source statuses from the real `estado` reference table (confirmed live: 5 rows — Pendiente/Confirmado/Enviado/Entregado/Cancelado) instead of inferring them from order history.

**Interfaces:**
- Produces: `OrdersAdapter.listStatuses(): Promise<{ id_estado: number; nombre: string }[]>`.
- Produces: `GET /api/orders/statuses` → `{ success: true, data: [{ id_estado, nombre }, ...] }`.
- Produces: `useOrdersData()` return value gains `statuses: { id_estado: number; nombre: string }[]`.

- [ ] **Step 1: Add `listStatuses` to the orders adapter**

In `src/lib/database/adapters/orders-adapter.ts`, add this method inside the `OrdersAdapter` class (after `listOrders` is fine):

```ts
  async listStatuses(): Promise<{ id_estado: number; nombre: string }[]> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any)
      .from('estado')
      .select('id_estado, nombre')
      .order('id_estado');
    if (error) throw new DatabaseError('Failed to list order statuses', { originalError: error });
    return data ?? [];
  }
```

- [ ] **Step 2: Create the statuses route**

Create `src/app/api/orders/statuses/route.ts`:

```ts
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter } from '@/lib/database/adapters/orders-adapter';

async function getStatusesHandler() {
  const adapter = new OrdersAdapter();
  const statuses = await adapter.listStatuses();
  return ApiResponse.success(statuses);
}

export const GET = withErrorHandling(getStatusesHandler);
```

- [ ] **Step 3: Expose `statuses` from `useOrdersData`**

In `src/hooks/useOrdersData.ts`, add `id_estado`/`nombre` fetching. Change the `UseOrdersDataResult` interface:

```ts
interface UseOrdersDataResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createOrder: (payload: { cliente_nombre: string; cliente_email: string; id_estado: number; items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[] }) => Promise<void>;
}
```

to:

```ts
interface OrderStatus {
  id_estado: number;
  nombre: string;
}

interface UseOrdersDataResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createOrder: (payload: { cliente_nombre: string; cliente_email: string; id_estado: number; items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[] }) => Promise<void>;
  statuses: OrderStatus[];
}
```

Add a new state and effect inside `useOrdersData`, right after the existing `refetch`/`createOrder` declarations and before the existing orders-fetching `useEffect`:

```ts
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => {
    fetch('/api/orders/statuses')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setStatuses(result.data);
      })
      .catch(() => {});
  }, []);
```

And update the final `return` statement:

```ts
  return { orders, loading, error, refetch, createOrder };
```

to:

```ts
  return { orders, loading, error, refetch, createOrder, statuses };
```

- [ ] **Step 4: Use real statuses in the Orders page instead of deriving from order history**

In `src/app/(admin)/orders/page.tsx`, change the destructuring:

```tsx
  const { orders, loading, error, refetch, createOrder } = useOrdersData({ limit: 50 });
```

to:

```tsx
  const { orders, loading, error, refetch, createOrder, statuses } = useOrdersData({ limit: 50 });
```

Then remove the old derivation entirely:

```tsx
  const statusOptions: StatusOption[] = useMemo(() => {
    const map = new Map<number, string>();
    orders.forEach((o) => {
      if (o.id_estado && o.estado_nombre) map.set(o.id_estado, o.estado_nombre);
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [orders]);
```

and replace it with:

```tsx
  const statusOptions: StatusOption[] = useMemo(
    () => statuses.map((s) => ({ id: s.id_estado, label: s.nombre })),
    [statuses]
  );
```

- [ ] **Step 5: Verify**

Run `npm run type-check` and confirm no new errors from the 4 modified/created files.

Then (dev server running):

```bash
curl -s http://localhost:3000/api/orders/statuses
```

Expected: `{"success":true,"data":[{"id_estado":1,"nombre":"Pendiente"},{"id_estado":2,"nombre":"Confirmado"},...]}` — 5 rows.

In the browser, confirm the current DB has zero orders (or note however many exist), open `/orders`, click "+ New Order" — confirm the Status section now shows real chips (Pendiente/Confirmado/Enviado/Entregado/Cancelado) instead of "No hay estados disponibles para asignar", even with zero existing orders. Fill in a customer name, select a product with stock, select a status, and submit — confirm the order is created successfully (no error banner) and appears in the orders list. Then delete that test order and its associated movement/stock changes via curl DELETE (same FK-order pattern as prior tasks) to leave the database clean.

---

## Task 5: Filters — new categories/collections show up live; Inventory's hardcoded collection is fixed; Catalog gets a real Collection filter

**Files:**
- Modify: `src/hooks/useCatalogData.ts`
- Modify: `src/lib/database/adapters/catalog-adapter.ts`
- Modify: `src/lib/database/adapters/inventory-adapter.ts`
- Modify: `src/app/(admin)/catalog/page.tsx`
- Modify: `src/app/(admin)/inventory/page.tsx`

**Root causes:**
1. `useCatalogData`'s `createCategory`/`createCollection` never call `refetch()`, so a category/collection created inline in the Add/Edit Product form doesn't appear in the page's filter chips until a full reload.
2. `inventory/page.tsx` hardcodes `collection: 'BRUMA'` on every single item (line ~116) — the collection filter list is therefore always just `['BRUMA']` regardless of real data.
3. `catalog/page.tsx` has no Collection filter section at all (only Category).

**Interfaces:**
- Consumes: `list_products` and `list_inventory_items` from Task 1 (now return `coleccion_nombre`).
- Produces: `CatalogProduct` (in `catalog-adapter.ts`) gains a `collection_name: string | null` field.
- Produces: `InventoryItemExtended` (in `inventory-adapter.ts`) gains real (non-hardcoded) `collection` data via its existing `size`-style field pattern.

- [ ] **Step 1: Make `createCategory`/`createCollection` refetch**

In `src/hooks/useCatalogData.ts`, change:

```ts
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
```

to:

```ts
  const createCategory: UseCatalogDataResult['createCategory'] = async (nombre) => {
    const res = await fetch('/api/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    refetch();
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
    refetch();
    return result.data;
  };
```

- [ ] **Step 2: Add `collection_name` to `CatalogProduct` and its mapping**

In `src/lib/database/adapters/catalog-adapter.ts`, change the `CatalogProduct` type:

```ts
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
```

to:

```ts
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
};
```

And update the mapping in `listCatalogProducts`:

```ts
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
```

to:

```ts
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
  }));
```

- [ ] **Step 3: Add the Collection filter to the Catalog page**

In `src/app/(admin)/catalog/page.tsx`, add a `collFilter` state next to the existing `catFilter` state:

```tsx
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
```

becomes:

```tsx
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [collFilter, setCollFilter] = useState<Set<string>>(new Set());
```

Add a toggle function next to `toggleCat`:

```tsx
  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }
```

becomes:

```tsx
  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }
  function toggleColl(c: string) { setCollFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }
```

Add `collectionNames` next to `categoryNames`:

```tsx
  const categoryNames = categories.map(c => c.name);
```

becomes:

```tsx
  const categoryNames = categories.map(c => c.name);
  const collectionNames = collections.map(c => c.name);
```

Update the `filtered` memo to also match on collection:

```tsx
  const filtered = useMemo(() => products.filter(p => {
    const matchCat = catFilter.size === 0 || (p.category_name && catFilter.has(p.category_name));
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  }), [products, catFilter, search]);
```

to:

```tsx
  const filtered = useMemo(() => products.filter(p => {
    const matchCat = catFilter.size === 0 || (p.category_name && catFilter.has(p.category_name));
    const matchColl = collFilter.size === 0 || (p.collection_name && collFilter.has(p.collection_name));
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q);
    return matchCat && matchColl && matchSearch;
  }), [products, catFilter, collFilter, search]);
```

Finally, add a Collection filter block to the sidebar `<aside>`, right before the existing Category block:

```tsx
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Category:</span>
```

becomes:

```tsx
        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Collection:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCollFilter(new Set())}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  collFilter.size === 0
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              {collectionNames.map(c => (
                <button
                  key={c}
                  onClick={() => toggleColl(c)}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    collFilter.has(c)
                      ? "bg-ember/10 text-ember border-ember/30 font-bold"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Category:</span>
```

(This nests the existing Category block's markup as a second `<div className="flex flex-col gap-2">` sibling — check the existing JSX to confirm you're closing the new Collection block's `</div>` and opening a second one, not merging them into one block.)

Also update the "Clear Filters" empty-state action to reset both filters:

```tsx
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch("");
                    setCatFilter(new Set());
                  }}
```

to:

```tsx
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch("");
                    setCatFilter(new Set());
                    setCollFilter(new Set());
                  }}
```

- [ ] **Step 4: Fix Inventory's hardcoded collection**

In `src/lib/database/adapters/inventory-adapter.ts`, find the `InventoryItemExtended` interface and add a `collection` field next to the existing `size` field added in a prior task (place it right after `size: string | null;`):

```ts
  collection: string | null;
```

In `getInventoryItems`'s mapping object, change:

```ts
      sku: (item.variante_codigo || item.producto_codigo) + (item.talla_codigo ? `-${item.talla_codigo}` : ''),
      size: item.talla_codigo || null,
```

to:

```ts
      sku: (item.variante_codigo || item.producto_codigo) + (item.talla_codigo ? `-${item.talla_codigo}` : ''),
      size: item.talla_codigo || null,
      collection: item.coleccion_nombre || null,
```

In `src/app/(admin)/inventory/page.tsx`, find and remove the hardcoded assignment:

```ts
    collection: 'BRUMA',
```

Replace it with:

```ts
    collection: item.collection || 'Sin colección',
```

(Keep the surrounding object literal and every other field exactly as-is — this is a single-line value change, not a restructure. Check the exact variable name the mapping uses for the source item — it may be `item` already, matching the existing `category: item.category_name || 'Sin Categoría'` line right above it.)

- [ ] **Step 5: Verify**

Run `npm run type-check` and confirm no new errors from the 5 modified files.

Then (dev server running), in the browser:
1. Open `/catalog`, click "+ Add Product", type a new collection name in the inline "+ Add" field under Collection (e.g. "PolishTest"), submit the "+ Add" — confirm the new "PolishTest" chip appears in the modal immediately (already worked before this task) AND, after closing the modal without submitting the full form, confirm "PolishTest" now also appears as a filter chip in the Catalog page's sidebar Collection section (this is the part that was broken).
2. Create one real product assigned to an existing collection (e.g. "BRUMA") via the Add Product form, confirm it appears in `/catalog`, then click the "BRUMA" chip in the new Collection filter — confirm the product list filters down to only BRUMA-collection products.
3. Open `/inventory`, confirm the Collection filter sidebar no longer shows only "BRUMA" for every item — items should show their real collection (or "Sin colección" if none is set), matching what's set in Catalog.
4. Clean up the temp product created in step 2 via curl DELETE (FK order).

---

## Task 6: Catalog product edit — category, collection, sizes, and variant price are editable

**Files:**
- Modify: `src/lib/database/adapters/catalog-adapter.ts`
- Create: `src/app/api/catalog/[id]/route.ts`
- Create: `src/components/catalog/EditProductModal.tsx`
- Modify: `src/app/(admin)/catalog/page.tsx`

**Scope (confirmed with the user):** no dedicated product detail page — clicking a catalog card opens an edit modal (reusing the same `FormModal` shell as Add/Log Movement/New Order). Editable: name, code, description, category, collection, variant price, and which sizes exist (add a new size at 0 stock, or remove a size — only allowed when its stock is already 0, since removing a size with stock would silently destroy inventory; the correct way to zero it out first is the existing Inventory movement flow). Stock *quantity* editing stays out of scope here — that's Inventory's job, consistent with the earlier design decision that Inventory only adjusts existing SKUs.

**Interfaces:**
- Consumes: `get_product` and `update_product` from Task 1.
- Produces: `getCatalogProductDetail(id: number): Promise<CatalogProductDetail | null>` and `updateCatalogProductFull(id: number, input: UpdateCatalogProductInput): Promise<CatalogProductDetail>` in `catalog-adapter.ts`.
- Produces: `GET /api/catalog/:id` → `{ data: CatalogProductDetail }`, `PATCH /api/catalog/:id` → `{ success: true, data: CatalogProductDetail }`.

- [ ] **Step 1: Add detail-fetch and full-update functions to the catalog adapter**

In `src/lib/database/adapters/catalog-adapter.ts`, add these exports at the end of the file (after `createCatalogProductWithStock`):

```ts
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
  }

  if (input.removeSizeIds && input.removeSizeIds.length > 0) {
    const { data: existing, error: findErr } = await (client as any)
      .from('productotallastock')
      .select('id_producto_talla, stock')
      .in('id_producto_talla', input.removeSizeIds);
    if (findErr) throw findErr;
    const blocked = (existing ?? []).filter((r: any) => r.stock > 0);
    if (blocked.length > 0) {
      throw new Error(
        `No se puede quitar una talla con stock disponible. Ajusta el stock a 0 desde Inventory primero (${blocked.length} talla(s) bloqueada(s)).`
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
```

- [ ] **Step 2: Add the detail/update route**

Create `src/app/api/catalog/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getCatalogProductDetail,
  updateCatalogProductFull,
} from '@/lib/database/adapters/catalog-adapter';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getCatalogProductDetail(Number(params.id));
    if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = await req.json();
    const data = await updateCatalogProductFull(Number(params.id), input);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build the Edit Product modal**

Create `src/components/catalog/EditProductModal.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  FormModal,
  FieldLabel,
  TextInput,
  TextArea,
  ChipPicker,
  InlineAddChip,
  SubmitBar,
} from "@/components/figma-shared/Modal";

const SIZE_OPTIONS = ["OS", "XS", "S", "M", "L", "XL", "XXL"];

interface NamedOption {
  id: number;
  name: string;
}

interface ProductDetail {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string | null;
  id_categoria: number | null;
  id_coleccion: number | null;
  activo: boolean;
  variantes: {
    id_variante: number;
    precio_variante: number | null;
    stock_tallas: { id_producto_talla: number; talla_codigo: string | null; stock: number }[];
  }[];
}

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
  categories: NamedOption[];
  collections: NamedOption[];
  onCreateCategory: (name: string) => Promise<NamedOption>;
  onCreateCollection: (name: string) => Promise<NamedOption>;
  onSaved: () => void;
}

export function EditProductModal({
  open,
  onOpenChange,
  productId,
  categories,
  collections,
  onCreateCategory,
  onCreateCollection,
  onSaved,
}: EditProductModalProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [fetching, setFetching] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [removedSizeIds, setRemovedSizeIds] = useState<Set<number>>(new Set());
  const [newSizes, setNewSizes] = useState<Set<string>>(new Set());
  const [localCategories, setLocalCategories] = useState(categories);
  const [localCollections, setLocalCollections] = useState(collections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLocalCategories(categories), [categories]);
  useEffect(() => setLocalCollections(collections), [collections]);

  useEffect(() => {
    if (!open || !productId) {
      setDetail(null);
      return;
    }
    setFetching(true);
    setError(null);
    fetch(`/api/catalog/${productId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) throw new Error(result.error);
        const d: ProductDetail = result.data;
        setDetail(d);
        setNombre(d.nombre);
        setCodigo(d.codigo || "");
        setDescripcion(d.descripcion || "");
        setCategoryId(d.id_categoria);
        setCollectionId(d.id_coleccion);
        setPrecio(String(d.variantes[0]?.precio_variante ?? ""));
        setRemovedSizeIds(new Set());
        setNewSizes(new Set());
      })
      .catch((e) => setError(e.message || "Error cargando el producto"))
      .finally(() => setFetching(false));
  }, [open, productId]);

  const existingSizes = detail?.variantes[0]?.stock_tallas ?? [];
  const existingCodes = new Set(existingSizes.map((s) => s.talla_codigo).filter(Boolean));
  const availableToAdd = SIZE_OPTIONS.filter((s) => !existingCodes.has(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const variant = detail.variantes[0];
      const res = await fetch(`/api/catalog/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          codigo: codigo.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          id_categoria: categoryId,
          id_coleccion: collectionId,
          variant: variant
            ? { id_variante: variant.id_variante, precio_variante: parseFloat(precio) || 0 }
            : undefined,
          removeSizeIds: Array.from(removedSizeIds),
          addSizes: variant
            ? Array.from(newSizes).map((sizeCode) => ({ codigo: sizeCode, stock: 0, precio: parseFloat(precio) || 0 }))
            : [],
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal open={open} onOpenChange={onOpenChange} eyebrow="Edit Gear" title="Edit Product">
      {fetching && <p className="text-sm text-bone/50 font-geist">Cargando...</p>}
      {!fetching && detail && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Product Name</FieldLabel>
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Product Code (SKU)</FieldLabel>
            <TextInput value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Price ($)</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
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
            <FieldLabel>Existing Sizes</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {existingSizes.map((s) => {
                const marked = removedSizeIds.has(s.id_producto_talla);
                return (
                  <button
                    key={s.id_producto_talla}
                    type="button"
                    disabled={s.stock > 0}
                    title={s.stock > 0 ? "Reduce stock to 0 in Inventory before removing" : "Click to remove"}
                    onClick={() =>
                      setRemovedSizeIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id_producto_talla)) next.delete(s.id_producto_talla);
                        else next.add(s.id_producto_talla);
                        return next;
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border ${
                      marked
                        ? "bg-red-500/10 text-red-400 border-red-500/30 line-through"
                        : "bg-bone/5 border-bone/20 text-bone/70"
                    } ${s.stock > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-ember/50"}`}
                  >
                    {s.talla_codigo || "?"} · {s.stock} in stock
                    {s.stock === 0 && <X size={10} />}
                  </button>
                );
              })}
              {existingSizes.length === 0 && (
                <p className="text-xs text-bone/40 font-geist">No hay tallas registradas.</p>
              )}
            </div>
          </div>

          {availableToAdd.length > 0 && (
            <div>
              <FieldLabel>Add New Size</FieldLabel>
              <ChipPicker
                options={availableToAdd.map((s) => ({ id: s, label: s }))}
                selected={newSizes}
                onToggle={(id) =>
                  setNewSizes((prev) => {
                    const next = new Set(prev);
                    if (next.has(id as string)) next.delete(id as string);
                    else next.add(id as string);
                    return next;
                  })
                }
              />
              <p className="text-[10px] text-bone/40 font-geist mt-1">New sizes start at 0 stock — add stock via Inventory.</p>
            </div>
          )}

          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <SubmitBar submitLabel="Save Changes" loading={loading} error={error} />
        </form>
      )}
    </FormModal>
  );
}
```

- [ ] **Step 4: Wire the modal to Catalog product cards**

In `src/app/(admin)/catalog/page.tsx`, add the import:

```tsx
import { AddProductModal } from "@/components/catalog/AddProductModal";
```

becomes:

```tsx
import { AddProductModal } from "@/components/catalog/AddProductModal";
import { EditProductModal } from "@/components/catalog/EditProductModal";
```

Add state next to `showAddModal`:

```tsx
  const [showAddModal, setShowAddModal] = useState(false);
```

becomes:

```tsx
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
```

Add the modal render right after the existing `<AddProductModal ... />` block:

```tsx
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

becomes:

```tsx
      <AddProductModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categories={categories}
        collections={collections}
        onCreateCategory={createCategory}
        onCreateCollection={createCollection}
        onSubmit={createProduct}
      />

      <EditProductModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        productId={editingProductId}
        categories={categories}
        collections={collections}
        onCreateCategory={createCategory}
        onCreateCollection={createCollection}
        onSaved={refetch}
      />
```

Finally, make the product card clickable. Find:

```tsx
              <FloraGlass
                key={product.id}
                className="group cursor-pointer hover:border-ember/40 transition-colors"
              >
```

and change it to:

```tsx
              <FloraGlass
                key={product.id}
                onClick={() => { setEditingProductId(product.id); setShowEditModal(true); }}
                className="group cursor-pointer hover:border-ember/40 transition-colors"
              >
```

- [ ] **Step 5: Verify**

Run `npm run type-check` and confirm no new errors from the 4 modified/created files.

Then (dev server running): create a temp product via curl (`{"nombre":"EditVerify","codigo":"EDITVER01","precio":20,"stockQty":0,"sizes":["S"]}`), open `/catalog` in the browser, click its card — confirm the Edit Product modal opens, pre-filled with the real name/code/price/category/collection/size. Change the category, add a new size ("M"), save — confirm no error, and reopen the same card to confirm the category change and new size persisted. Try to remove the "S" size while it still has 0 stock — confirm it's clickable/removable (stock is 0, so it's allowed) and, after saving, that it's gone on reopen. Clean up the temp product afterward.

---

## Task 7: Activity Log — replace hardcoded audit trail with "Próximamente"

**Files:**
- Modify: `src/app/(admin)/reporting/page.tsx` (full rewrite — the entire file is currently a fake data table)

**Interfaces:** None — this page has no consumers to preserve.

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(admin)/reporting/page.tsx` with:

```tsx
"use client";

import React from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function ReportingView() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Logistics Audit"
        title="Activity Log"
        sub="Audit chronological subroutines and operations. Track system overrides, price mutations, and clearance alerts."
        bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=300&fit=crop&auto=format"
      />

      <FloraGlass className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <ScrollText size={48} className="text-bone/30 mb-6" />
        <h2 className="font-fraunces text-3xl font-bold text-bone mb-3">Próximamente</h2>
        <p className="font-geist text-sm text-bone/50 max-w-md leading-relaxed">
          El registro de actividad requiere una tabla de auditoría dedicada que aún no existe
          en el backend. Se construye como su propio proyecto cuando haya una arquitectura de
          logging definida.
        </p>
      </FloraGlass>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run type-check` and confirm no new errors. Open `/reporting` in the browser and confirm it shows the same "Próximamente" pattern already used on `/statistics` (dark panel, centered icon, heading, explanatory text) — no fake log rows, no search bar, no filters.

---

## Task 8: Dashboard — drop hardcoded/misleading KPI values, relabel two tiles

**Files:**
- Modify: `src/app/(admin)/dashboard/page.tsx`

**Interfaces:** None — this page has no consumers to preserve. `useDashboardData`/`useOrdersData` are not modified, only how this page uses them.

- [ ] **Step 1: Stop reading live-but-currently-zero values into Active Orders / Low Stock Alerts; rename Revenue**

Change:

```tsx
export default function DashboardView() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardData();
  const { orders: recentOrders, loading: ordersLoading } = useOrdersData({ limit: 5 });

  const loading = statsLoading || ordersLoading;

  const kpis = [
    {
      label: "Active Orders",
      value: stats ? String(stats.pedidos) : "—",
      sub: "Total pedidos registrados",
      icon: ShoppingCart,
      color: "text-ember"
    },
    {
      label: "Low Stock Alerts",
      value: stats ? String(stats.productos_bajo_stock) : "—",
      sub: "SKUs con stock bajo",
      icon: Package,
      color: "text-[#7ddb7d]"
    },
    {
      label: "Revenue",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: TrendingUp,
      color: "text-bone/40"
    },
    {
      label: "New Customers",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: Users,
      color: "text-bone/40"
    },
  ];
```

to:

```tsx
export default function DashboardView() {
  const { loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardData();

  const loading = statsLoading;

  const kpis = [
    {
      label: "Active Orders",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: ShoppingCart,
      color: "text-bone/40"
    },
    {
      label: "Low Stock Alerts",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: Package,
      color: "text-bone/40"
    },
    {
      label: "Resueltos Hoy",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: TrendingUp,
      color: "text-bone/40"
    },
    {
      label: "New Customers",
      value: "Próximamente",
      sub: "Requiere reporte por período",
      icon: Users,
      color: "text-bone/40"
    },
  ];
```

Remove the now-unused `useOrdersData` import:

```tsx
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOrdersData } from "@/hooks/useOrdersData";
```

becomes:

```tsx
import { useDashboardData } from "@/hooks/useDashboardData";
```

- [ ] **Step 2: Replace the Recent Orders panel with a "Monthly Goal" próximamente panel**

Change:

```tsx
        <FloraGlass className="p-6 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-6">Recent Orders</p>
            <div className="space-y-5">
              {recentOrders.slice(0, 5).map(o => (
                <div key={o.id_pedido} className="flex items-center justify-between border-b border-bone/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm text-bone font-fraunces font-bold">{o.cliente_nombre || 'Sin nombre'}</p>
                    <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mt-0.5">#{o.id_pedido}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-sm font-geist text-bone font-medium">${Number(o.total).toFixed(2)}</p>
                    <StatusBadge status={(o.estado_nombre || '').toLowerCase()} />
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-xs text-bone/40 font-geist">Sin pedidos recientes.</p>
              )}
            </div>
          </div>
        </FloraGlass>
```

to:

```tsx
        <FloraGlass className="p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-4 self-start">Monthly Goal</p>
          <p className="font-fraunces text-2xl font-bold text-bone/40 uppercase tracking-tight">Próximamente</p>
          <p className="text-xs text-bone/30 font-geist mt-2 text-center max-w-xs">Requiere definición de metas mensuales por período, no disponible en el backend actual.</p>
        </FloraGlass>
```

Since `StatusBadge` is no longer used anywhere else in this file, remove it from the import too. Check:

```tsx
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
```

becomes:

```tsx
import { PageHeader } from "@/components/figma-shared/Common";
```

(Only remove `StatusBadge` from this import if grepping the file confirms it has no other usages — it shouldn't, since the Recent Orders block was its only call site in this file.)

- [ ] **Step 3: Verify**

Run `npm run type-check` and confirm no new errors from `dashboard/page.tsx`.

Open `/dashboard` in the browser and confirm: Active Orders and Low Stock Alerts tiles now show "Próximamente" instead of a number; the third tile is now labeled "Resueltos Hoy" (still "Próximamente"); the right-side panel is now labeled "Monthly Goal" and shows a centered "Próximamente" message instead of a real order list. Confirm no console errors from the removed `useOrdersData`/`StatusBadge` usage.

---

## Self-Review Notes

- **Spec coverage:** all 7 user-reported items are covered — StockMovementModal styling+validation (Task 2), Movements SKU display + product-creation logging (Task 3), Orders placement bug (Task 4), Catalog image-click → edit with category/collection/sizes/variant (Task 6), Activity Log cleanup (Task 7), filters functional on create (Task 5), Dashboard relabeling (Task 8). Task 1 is the shared prerequisite migration all of Tasks 2–6 depend on for real data.
- **Task ordering:** matches the user's stated priority (logic bugs first: 2–4; missing features: 5–6; visual cleanup last: 7–8), with Task 1 pulled to the front only because every later task's SQL dependency requires it to exist first — not a priority violation, a dependency requirement.
- **Type consistency checked:** `SelectField` (Task 2) is generic and reused nowhere else in this plan — no signature drift risk. `MovementWithInventory.size`, `InventoryItemExtended.collection`, `CatalogProduct.collection_name`, and `UseOrdersDataResult.statuses` are each defined once (Tasks 3/5/5/4 respectively) and consumed only within the same task's own page — no cross-task name mismatches.
