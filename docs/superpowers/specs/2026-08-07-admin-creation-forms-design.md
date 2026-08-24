# Admin Creation Forms — Design Spec

**Date:** 2026-08-07
**Status:** Approved by user, ready for implementation planning

## Problem

Across the admin panel, the "+Add" buttons in page headers (`PageHeader` in
`src/components/figma-shared/Common.tsx`) render but do nothing —
`actionLabel` is set without a matching `onAction`. Confirmed inert on:

- **Inventory** (`+ Add Product`)
- **Catalog** (`+ Add Product`)
- **Orders** (`+ New Order`)

Movements has no button at all today, which turns out to be correct (see
Decision 2 below).

A legacy `src/components/inventory/InventoryForm.tsx` exists but is unused,
generic-Tailwind-light-themed, and targets the discarded multi-project
schema (`useProducts`, `useSuppliers`, `InventoryFormData` types) — it is
not a valid starting point and is out of scope to fix/reuse.

The user supplied 5 inspiration mockups (BRUMA-styled dark UI: obsidian bg,
ember accents, bone text) showing 4 conceptual forms: Add Product
(inventory), Log Movement, New Order, Add to Catalog.

## Decisions made during brainstorming

1. **Scope is 3 forms, not 4.** Inventory and Catalog both showed
   "add product"-shaped mockups, but they are different operations on the
   same `producto` entity:
   - **Catalog** creates a brand-new product (real creation).
   - **Inventory** should NOT duplicate product creation. Instead it gets a
     movement-style form (styled like the "Log Movement" mock) that adjusts
     stock on an **existing** SKU/size.
2. **Movements page stays read-only.** Movement log rows are a side effect
   of other actions (stock adjustments, order fulfillment), not something
   created by hand. This matches `inventario_movimiento` already being
   auto-inserted by `adjust_inventory` and `add_order_item` (see Schema
   section) and matches the current code (no button there today).
3. **Inventory's form only adjusts existing SKUs.** It does not create new
   size/variant rows — that happens via the Catalog creation flow.
4. **Collection is real.** Initial assumption that "Collection" was
   fictional was wrong — corrected after re-reading the actual `CREATE
   TABLE` statements (not just stored procedure signatures). `coleccion`
   table exists and `producto.id_coleccion` references it.

## Schema (verified from `supabase/migrations/20260710045923_initial_schema.sql`)

Relevant tables (Spanish names, as they exist in the live schema — this is
the canonical schema per `FINDINGS.md`, not `database/schema.sql` which is
discarded):

```
coleccion(id_coleccion, nombre, descripcion)
tipoproducto(id_tipo, codigo, nombre)                      -- "category"
proveedor(id_proveedor, nombre, contacto, telefono, email)
producto(id_producto, codigo, nombre, descripcion,
         id_proveedor -> proveedor, id_categoria -> tipoproducto,
         id_coleccion -> coleccion, activo, ...)
productovariante(id_variante, id_producto -> producto, id_color -> color,
                  codigo_variante, nombre_variante, precio_variante, activo)
tallabase(id_talla, codigo, descripcion)                   -- generic size ref (S/M/L/XL/OS)
tallaproveedor(id_talla_proveedor, id_proveedor -> proveedor,
               id_talla -> tallabase, medida_pecho, medida_cintura,
               medida_largo, codigo_talla_proveedor, descripcion_talla)
productotallastock(id_producto_talla, id_variante -> productovariante,
                    id_talla_proveedor -> tallaproveedor, stock, precio)
inventario_movimiento(id_movimiento, id_producto_talla -> productotallastock,
                       tipo_movimiento, cantidad, motivo, fecha,
                       referencia_pedido)
pedido(id_pedido, fecha, id_estado, id_codigo_envio, id_cliente,
       cliente_nombre, cliente_email, total, notas, id_metodo_pago,
       referencia_pago, notas_pago, ...)
pedidodetalle(id_pedido_detalle, id_pedido -> pedido,
              id_producto_talla -> productotallastock, cantidad, precio_unitario)
```

Price lives at two levels: `productovariante.precio_variante` (nullable,
per color-variant "base" price) and `productotallastock.precio` (NOT NULL,
actual sellable price per size row). A size only becomes purchasable once a
`productotallastock` row exists, which requires a `tallaproveedor` row
(provider + size + measurements) to already exist.

Existing stored procedures relevant to this work:

| SP | Signature | Status |
|---|---|---|
| `create_product` | `p_nombre, p_descripcion, p_codigo, p_id_categoria, p_activo` | **Missing `p_id_coleccion`/`p_id_proveedor`** despite the table having both columns — must be fixed |
| `create_category` | `p_nombre, p_codigo` → inserts `tipoproducto` | OK, usable as-is for inline "+ add category" |
| `create_product_variant` | `p_id_producto, p_id_color, p_codigo_variante, p_nombre_variante, p_precio_variante, p_activo` | OK |
| `adjust_inventory` | `p_id_variante, p_id_talla_proveedor, p_cantidad_cambio, p_motivo` | OK, already auto-inserts `inventario_movimiento` — no separate movement-log SP needed |
| `create_order` | full pedido header fields | OK |
| `add_order_item` | `p_id_pedido, p_id_producto_talla, p_cantidad, p_precio_unitario` | OK, already deducts stock + auto-inserts `inventario_movimiento` with `referencia_pedido` |

Missing:
- `create_collection` SP (inline "+ add collection" needs this — `coleccion`
  has no create function today).
- A way to attach a **new** size to a newly-created product. Confirmed no
  seed data for `tallabase`/`tallaproveedor`/`coleccion` exists in the
  migration files, meaning current rows (if any: e.g. existing category
  chips like "HOODIES", "T-SHIRTS" seen in the live Catalog page, and any
  existing collections like BRUMA/TARCOLES) were inserted directly via the
  Supabase dashboard, not tracked in a migration/seed file. **Verify against
  the live DB at implementation time** whether `tallabase` rows (generic
  S/M/L/XL/OS) and `tallaproveedor` rows for the product's provider already
  exist. If they do, size selection in Add to Catalog just picks existing
  `tallaproveedor` ids per selected size and inserts `productotallastock`
  directly — no new SP needed beyond that insert path. If a product has no
  `id_proveedor` set, a placeholder/default provider decision will be
  needed — flag to user if this blocks implementation, don't invent a
  fake provider silently.

## Forms

### 1. Catalog → "Add to Catalog"
Fields: name, code (auto-suggested from name, editable), category
(existing chips + inline "+ add" via `create_category`), collection
(existing chips + inline "+ add" via new `create_collection`), description,
price, sizes (multi-select from available `tallaproveedor` sizes for the
chosen/default provider), status (in stock / low stock / out of stock —
derived, not stored — matches existing `StatusBadge` semantics used
elsewhere).

Submit sequence: `create_product` (fixed SP, now takes
`p_id_coleccion`/`p_id_proveedor`) → `create_product_variant` (one, no
color) → `productotallastock` insert per selected size, using the price
from the form.

### 2. Inventory → "Stock Movement" (replaces the inert "+ Add Product")
Fields: movement type (Stock In / Stock Out / Adjustment / Return /
Transfer — maps to `tipo_movimiento`: entrada/salida/ajuste), SKU picker
(existing `productotallastock` rows, sourced from the already-working
`/api/inventory/items`), quantity, note.

Submit: `adjust_inventory(p_id_variante, p_id_talla_proveedor,
p_cantidad_cambio, p_motivo)` — sign of `p_cantidad_cambio` derived from
movement type. Already auto-writes the movement log row, so Movements
updates without any separate call.

Backend note: `useInventory.createInventoryItem`/`adjustStock` are
currently gated behind a vestigial `projectId` param
(`FINDINGS.md`, "HTTP API layer dead code" section). This form bypasses
that hook and calls a new, `projectId`-free route instead — same pattern
already used for the 6 pages migrated in the 2026-08-04/05 integration
work (no `projectId` anywhere).

### 3. Orders → "New Order"
Fields: customer name, email, product+size picker (checkboxes, sourced
from `/api/inventory/items` — shows SKU/size, price, available stock),
status (Pending / Processing / Shipped → `id_estado`).

Submit sequence: `create_order` (header) → `add_order_item` once per
selected line (handles stock deduction + movement log automatically, per
schema above — no extra plumbing needed here).

## Shared UI

One `Modal` shell component + a small set of form-field primitives
(text input, select/chip-picker, quantity stepper, status pill group),
styled to match the existing BRUMA visual language already established in
`figma-shared/Common.tsx` and `TacticalTable` (obsidian background, ember
accent, bone text, `font-geist` labels, `font-fraunces` headings, `2px`/`4px`
border-radius scale). All 3 forms are built from this shared kit rather than
three bespoke modals, matching the codebase's existing `figma-shared`
convention of shared presentational primitives.

## Explicitly out of scope

- Editing/deleting via these forms (create-only, per the original request).
- Color variants (`productovariante.id_color`) — new products get a single
  default variant, no color selection UI.
- Fixing the unrelated `useInventory` `projectId` gate for the rest of that
  hook's functions (only the new movement-form path avoids it).
- Porting or fixing the legacy `InventoryForm.tsx` — it stays dead/unused;
  not deleted as part of this work unless it becomes a blocker.
- Purchase orders, suppliers, customers pages (not in the 4-page admin nav
  scope confirmed by the user).

## Division of work

Per project convention (`CLAUDE.md`), work is split across subagents,
run sequentially:

- **developer**: fix `create_product` SP, add `create_collection` SP,
  verify/handle the size→`tallaproveedor` attachment path against the live
  DB, add the 3 API routes (or extend existing ones), wire adapters/hooks.
- **visual-designer**: build the shared `Modal` + field-kit components and
  the 3 form layouts, adapted from the mockups to the real BRUMA design
  system (not copy-pasted from the generic mockup styling).
- Integration (wiring forms to `onAction`, submit handlers, success/error
  states, refetching the underlying table on success) can be done by
  whichever agent finishes the relevant piece, reviewed against both
  concerns before considered done.
