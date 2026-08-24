# Orders, Invoicing & Log Movement Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the New Order form collect optional contact details and validated quantities, give orders a real status-change control, delete the fake Invoicing page (invoices are generated from an order, not authored standalone), and make Log Movement usable for every catalog product — including a deliberate, confirmed path to push stock negative.

**Architecture:** Small, additive SQL migrations (new nullable columns, one new function parameter, one function extended with a `UNION ALL` branch) paired with narrow adapter/route/hook changes and three targeted component edits. No new pages, no new tables, no new dependencies.

**Tech Stack:** Next.js 14 (App Router) API routes, Supabase (Postgres + PostgREST RPC), `@supabase/supabase-js` service client, React (client components), Tailwind CSS with the existing BRUMA design tokens (`obsidian`/`ember`/`bone`, `font-geist`/`font-fraunces`).

## Global Constraints

- No `projectId` parameter anywhere in new code — the single-project architecture is canonical.
- Follow the existing BRUMA visual language exactly: `bg-obsidian`, `text-bone`, `text-ember`, `font-geist` for labels/UI text (uppercase, `tracking-[0.15em]`–`[0.25em]`), `font-fraunces` for headings, `rounded-[2px]` for inputs/chips, `rounded-[4px]` for panels/buttons — copy these from `src/components/figma-shared/Modal.tsx` and the pages under `src/app/(admin)/`, don't invent new tokens.
- All money values are `numeric` in Postgres — always parse with `parseFloat`/`Number(...)` on the way in and `.toFixed(2)` on the way out, never string concatenation.
- Every SQL function whose parameter list changes MUST be preceded by `DROP FUNCTION IF EXISTS <name>(<exact old param types>);` in the same migration — `CREATE OR REPLACE FUNCTION` does NOT replace a function whose argument type list differs, it silently creates a second overload, which breaks PostgREST's RPC resolution. This codebase has hit this exact issue twice already; every migration below follows this rule.
- No test framework exists in this repo (`package.json` has no `jest`/`vitest`). Verification steps use `npm run type-check`, direct `curl` against the dev server / Supabase REST endpoint, and manual browser checks.
- Apply every migration with `npx supabase db push` as part of the task that creates it, and verify with `curl` against the live Supabase REST endpoint (`source .env` first) before moving on — don't leave a migration file unapplied.
- Any test data created for verification (products, orders, movements, stock rows) must be deleted afterward, and the deletion confirmed with a follow-up query showing zero rows. Never delete or modify pre-existing data you didn't create this session.

---

## Task 1: Orders backend — optional contact fields + wire real order statuses

**Files:**
- Create: `supabase/migrations/20260813000000_orders_contact_fields.sql`
- Modify: `src/lib/database/adapters/orders-adapter.ts` (the `createOrder` method, ~line 70-83)
- Modify: `src/hooks/useOrdersData.ts` (the `createOrder` payload type and the `UseOrdersDataResult` interface)
- Modify: `src/app/api/orders/route.ts` (the `postOrdersHandler` function)
- Modify: `src/components/orders/NewOrderModal.tsx`
- Modify: `src/app/(admin)/orders/page.tsx` (only the `statusOptions` computation and the `useOrdersData`/`NewOrderModal` wiring — leave the rest of the file untouched, Task 3 touches the detail panel)

**Interfaces:**
- Consumes: `pedido` table (`supabase/migrations/20260710045923_initial_schema.sql:136-150`), `create_order` SP (currently 10 params, no telefono/instagram), `useOrdersData()`'s existing `statuses: {id_estado, nombre}[]` (already fetched from `/api/orders/statuses` today but never consumed by the page — this task fixes that).
- Produces: `create_order` SP gains `p_cliente_telefono`, `p_cliente_instagram` (both nullable, inserted right after `p_cliente_email`). `OrdersAdapter.createOrder` and the `/api/orders` POST body both accept `cliente_telefono?: string` and `cliente_instagram?: string`. `orders/page.tsx` no longer computes its own broken `statusOptions` — it passes `statuses` straight through from the hook.

Two real bugs get fixed as part of this task, not just the feature: (1) email is currently technically already optional server-side and client-side, but the UI implies it's required — this task makes that explicit; (2) `useOrdersData` already fetches `/api/orders/statuses` (the correct, always-populated source) into a `statuses` array, but `orders/page.tsx` still derives its own `statusOptions` by scanning the *existing orders list* — which is empty (and therefore breaks New Order with "No hay estados disponibles para asignar") whenever there are zero orders. This task deletes that broken derivation and wires the real one through.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260813000000_orders_contact_fields.sql`:

```sql
ALTER TABLE public.pedido ADD COLUMN IF NOT EXISTS cliente_telefono character varying;
ALTER TABLE public.pedido ADD COLUMN IF NOT EXISTS cliente_instagram character varying;

DROP FUNCTION IF EXISTS public.create_order(integer, integer, integer, character varying, character varying, numeric, text, integer, character varying, text);

CREATE OR REPLACE FUNCTION public.create_order(
  p_id_estado integer,
  p_id_codigo_envio integer DEFAULT NULL,
  p_id_cliente integer DEFAULT NULL,
  p_cliente_nombre character varying DEFAULT NULL,
  p_cliente_email character varying DEFAULT NULL,
  p_cliente_telefono character varying DEFAULT NULL,
  p_cliente_instagram character varying DEFAULT NULL,
  p_total numeric DEFAULT NULL,
  p_notas text DEFAULT NULL,
  p_id_metodo_pago integer DEFAULT NULL,
  p_referencia_pago character varying DEFAULT NULL,
  p_notas_pago text DEFAULT NULL
)
RETURNS TABLE (
  id_pedido integer,
  fecha timestamp without time zone,
  id_estado integer,
  id_codigo_envio integer,
  id_cliente integer,
  cliente_nombre character varying,
  cliente_email character varying,
  cliente_telefono character varying,
  cliente_instagram character varying,
  total numeric,
  notas text,
  id_metodo_pago integer,
  referencia_pago character varying,
  notas_pago text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.pedido (
    id_estado, id_codigo_envio, id_cliente, cliente_nombre, cliente_email,
    cliente_telefono, cliente_instagram, total, notas, id_metodo_pago,
    referencia_pago, notas_pago
  ) VALUES (
    p_id_estado, p_id_codigo_envio, p_id_cliente, p_cliente_nombre, p_cliente_email,
    p_cliente_telefono, p_cliente_instagram, p_total, p_notas, p_id_metodo_pago,
    p_referencia_pago, p_notas_pago
  )
  RETURNING id_pedido, fecha, id_estado, id_codigo_envio, id_cliente, cliente_nombre,
    cliente_email, cliente_telefono, cliente_instagram, total, notas, id_metodo_pago,
    referencia_pago, notas_pago;
$$;
```

- [ ] **Step 2: Apply and verify the migration**

Run: `npx supabase db push`

Verify (`source .env` first): `curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/create_order" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"p_id_estado":1,"p_cliente_nombre":"__plan_verify__","p_cliente_telefono":"8888-0000","p_cliente_instagram":"@planverify"}'`

Expected: a single row back with `cliente_telefono` and `cliente_instagram` populated. Then delete it: `curl -s -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/pedido?cliente_nombre=eq.__plan_verify__" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"`.

- [ ] **Step 3: Thread the new fields through `OrdersAdapter.createOrder`**

In `src/lib/database/adapters/orders-adapter.ts`, replace the `createOrder` method body:

```typescript
  async createOrder(params: any): Promise<any> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('create_order', {
      p_id_cliente: params.id_cliente,
      p_cliente_nombre: params.cliente_nombre,
      p_cliente_email: params.cliente_email,
      p_cliente_telefono: params.cliente_telefono,
      p_cliente_instagram: params.cliente_instagram,
      p_id_estado: params.id_estado || 1, // Default estado
      p_total: params.total,
      p_notas: params.notas,
      p_id_metodo_pago: params.id_metodo_pago
    });
    if (error) throw new DatabaseError('Failed to create order', { originalError: error });
    return data?.[0] || null;
  }
```

- [ ] **Step 4: Accept the new fields in the API route**

In `src/app/api/orders/route.ts`, in `postOrdersHandler`, change the destructuring and the `createOrder` call:

```typescript
  const { cliente_nombre, cliente_email, cliente_telefono, cliente_instagram, id_estado, items } = body as {
    cliente_nombre?: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado?: number;
    items?: CreateOrderItemInput[];
  };
```

and:

```typescript
  const order = await adapter.createOrder({
    id_estado: id_estado || 1,
    cliente_nombre,
    cliente_email,
    cliente_telefono,
    cliente_instagram,
    total,
  });
```

(Leave every other line in this file — the GET handler, the validation checks, the `items` loop — exactly as-is.)

- [ ] **Step 5: Update the hook's type and stop deriving statuses on the page**

In `src/hooks/useOrdersData.ts`, change the `createOrder` payload type in both `UseOrdersDataResult` and the function signature (they must match — this is one type used twice) to:

```typescript
  createOrder: (payload: { cliente_nombre: string; cliente_email?: string; cliente_telefono?: string; cliente_instagram?: string; id_estado: number; items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[] }) => Promise<void>;
```

and the `createOrder` function's own parameter type identically:

```typescript
  const createOrder = async (payload: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => {
```

(The body of `createOrder` — the `fetch('/api/orders', ...)` call — is unchanged, it already forwards the whole `payload` object as JSON.)

- [ ] **Step 6: Add the two new fields to the New Order form, mark contact fields optional**

In `src/components/orders/NewOrderModal.tsx`:

Add two new pieces of state alongside the existing `nombre`/`email` state:
```typescript
  const [telefono, setTelefono] = useState("");
  const [instagram, setInstagram] = useState("");
```

Add them to the reset effect and the `reset()` helper (both currently reset `nombre`/`email`/`selected`/`statusId`/`error`) — add `setTelefono("");` and `setInstagram("");` to both places.

Change the Email field's label to make optionality explicit, and add the two new fields right after it. Replace:
```tsx
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
```
with:
```tsx
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Customer Name</FieldLabel>
            <TextInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <FieldLabel>Email (Optional)</FieldLabel>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" />
          </div>
          <div>
            <FieldLabel>Phone (Optional)</FieldLabel>
            <TextInput type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="8888-0000" />
          </div>
          <div>
            <FieldLabel>Instagram (Optional)</FieldLabel>
            <TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
          </div>
        </div>
```

In `handleSubmit`, the `await onSubmit({...})` call currently sends `cliente_email: email.trim()` — change the whole call to:
```typescript
      await onSubmit({
        cliente_nombre: nombre.trim(),
        cliente_email: email.trim() || undefined,
        cliente_telefono: telefono.trim() || undefined,
        cliente_instagram: instagram.trim() || undefined,
        id_estado: effectiveStatusId,
        items,
      });
```

Update the `NewOrderModalProps['onSubmit']` type at the top of the file to match:
```typescript
  onSubmit: (payload: {
    cliente_nombre: string;
    cliente_email?: string;
    cliente_telefono?: string;
    cliente_instagram?: string;
    id_estado: number;
    items: { id_producto_talla: number; cantidad: number; precio_unitario: number }[];
  }) => Promise<void>;
```

- [ ] **Step 7: Wire the real status list into the Orders page, delete the broken derivation**

In `src/app/(admin)/orders/page.tsx`, the hook call currently reads:
```typescript
  const { orders, loading, error, refetch, createOrder } = useOrdersData({ limit: 50 });
```
Change it to also pull `statuses`:
```typescript
  const { orders, loading, error, refetch, createOrder, statuses } = useOrdersData({ limit: 50 });
```

Find this block (the broken derivation):
```typescript
  const statusOptions: StatusOption[] = useMemo(() => {
    const map = new Map<number, string>();
    orders.forEach((o) => {
      if (o.id_estado && o.estado_nombre) map.set(o.id_estado, o.estado_nombre);
    });
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [orders]);
```
and delete it entirely. Replace every use of `statusOptions` below it (the `<NewOrderModal statusOptions={statusOptions} .../>` prop) with:
```tsx
      <NewOrderModal
        open={showNewOrderModal}
        onOpenChange={setShowNewOrderModal}
        lineOptions={lineOptions}
        statusOptions={statuses.map((s) => ({ id: s.id_estado, label: s.nombre }))}
        onSubmit={createOrder}
      />
```
(Only the `statusOptions` prop's value changes — `lineOptions` and `onSubmit` stay as they are.)

- [ ] **Step 8: Verify end-to-end**

Run `npm run type-check` — zero new errors from any file touched in this task.

Start the dev server if not running, open `/orders`, click "+ New Order". Confirm: (a) the Status chips are populated even though this is the same page that was broken before (proves Step 7 fixed the real bug); (b) Phone and Instagram fields are visible and both optional — submit an order leaving Email, Phone, and Instagram all blank and confirm it succeeds; (c) submit a second test order with Phone and Instagram filled in, then `curl` `$NEXT_PUBLIC_SUPABASE_URL/rest/v1/pedido?cliente_nombre=eq.<your test name>&select=cliente_telefono,cliente_instagram` and confirm both values landed in the database. Delete both test orders afterward (`pedidodetalle` rows cascade-delete with the parent `pedido` per the existing `ON DELETE CASCADE` — but any `productotallastock`/`inventario_movimiento` side effects from `add_order_item` must be cleaned up manually the same way earlier tasks in this project have done: revert the stock delta, delete the movement row).

---

## Task 2: Orders — quantity per line item, validated against stock

**Files:**
- Modify: `src/app/(admin)/orders/page.tsx` (only the `lineOptions` building effect)
- Modify: `src/components/orders/NewOrderModal.tsx`

**Interfaces:**
- Consumes: `/api/inventory/items` response shape (`current_stock` field, already returned today).
- Produces: `OrderLineOption` gains `stock: number`. `NewOrderModal`'s internal selection state changes from `Set<number>` (just which lines are checked) to `Map<number, number>` (line id → chosen quantity), and the submitted `items` array now carries real per-line quantities instead of a hardcoded `1`.

- [ ] **Step 1: Include stock in the line options fetched for New Order**

In `src/app/(admin)/orders/page.tsx`, find the effect that builds `lineOptions`:
```typescript
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
Change the `.map` to also carry stock:
```typescript
        setLineOptions(
          items.map((i: any) => ({
            id: i.inventory_id,
            label: `${i.sku} — ${i.product_name}`,
            price: Number(i.price) || 0,
            stock: Number(i.current_stock) || 0,
          }))
        );
```

- [ ] **Step 2: Add `stock` to the `OrderLineOption` type and switch selection to a quantity map**

In `src/components/orders/NewOrderModal.tsx`, change:
```typescript
export interface OrderLineOption {
  id: number;
  label: string;
  price: number;
}
```
to:
```typescript
export interface OrderLineOption {
  id: number;
  label: string;
  price: number;
  stock: number;
}
```

Replace the selection state. Change:
```typescript
  const [selected, setSelected] = useState<Set<number>>(new Set());
```
to:
```typescript
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
```

Update every place that touched `selected` as a `Set`:

The reset effect and `reset()` helper both currently do `setSelected(new Set());` — change both to `setSelected(new Map());`.

Replace the `toggleLine` function:
```typescript
  const toggleLine = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
```
with:
```typescript
  const toggleLine = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, 1);
      return next;
    });
  };

  const setLineQuantity = (id: number, qty: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(id, Math.max(1, qty));
      return next;
    });
  };
```

- [ ] **Step 3: Validate quantity against stock before submit, build real `cantidad` values**

In `handleSubmit`, find:
```typescript
    if (selected.size === 0) {
      setError("Selecciona al menos un producto");
      return;
    }
```
Add a stock check right after it:
```typescript
    if (selected.size === 0) {
      setError("Selecciona al menos un producto");
      return;
    }
    for (const [id, qty] of selected) {
      const opt = lineOptions.find((o) => o.id === id);
      if (opt && qty > opt.stock) {
        setError(`${opt.label}: cantidad (${qty}) excede el stock disponible (${opt.stock})`);
        return;
      }
    }
```

Find where `items` is built:
```typescript
      const items = lineOptions
        .filter((o) => selected.has(o.id))
        .map((o) => ({ id_producto_talla: o.id, cantidad: 1, precio_unitario: o.price }));
```
Change `cantidad: 1` to the real chosen quantity:
```typescript
      const items = lineOptions
        .filter((o) => selected.has(o.id))
        .map((o) => ({ id_producto_talla: o.id, cantidad: selected.get(o.id) || 1, precio_unitario: o.price }));
```

- [ ] **Step 4: Add a quantity control to each selected line in the JSX**

Find the products list block:
```tsx
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
```
Replace with a version that shows a small quantity stepper only for checked lines, and the available stock as a hint:
```tsx
            {lineOptions.map((opt) => {
              const qty = selected.get(opt.id);
              return (
                <div
                  key={opt.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-geist text-bone hover:bg-bone/5"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(opt.id)}
                      onChange={() => toggleLine(opt.id)}
                      className="accent-ember shrink-0"
                    />
                    <span className="truncate">{opt.label}</span>
                    <span className="text-bone/40 text-xs shrink-0">({opt.stock} in stock)</span>
                  </label>
                  <div className="flex items-center gap-3 shrink-0">
                    {qty !== undefined && (
                      <div className="flex items-center border border-bone/20 rounded-[2px]">
                        <button
                          type="button"
                          onClick={() => setLineQuantity(opt.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-bone/60 hover:text-ember text-xs"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setLineQuantity(opt.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-bone/60 hover:text-ember text-xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                    <span className="text-bone/60 w-14 text-right">${opt.price.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
```

- [ ] **Step 5: Verify**

Run `npm run type-check` — zero new errors.

Open `/orders` → "+ New Order", check a product with stock ≥ 3, use the +/- stepper to set quantity to a number greater than its available stock, submit — confirm the friendly "excede el stock disponible" error appears and no request is sent (check Network tab / no new order created). Then set a valid quantity (≤ stock) and submit successfully; `curl` the order's detail (`/api/orders/<id>`) and confirm `cantidad` matches what you picked, not `1`. Delete the test order and revert the stock/movement side effects the same way as Task 1's verification.

---

## Task 3: Order status changer (replaces the non-functional "Mark Dispatched" button)

**Files:**
- Modify: `src/app/api/orders/[id]/route.ts` (add a PATCH handler)
- Modify: `src/lib/database/adapters/orders-adapter.ts` — no change needed, `updateOrderStatus` already exists (line 102-109), this task just calls it
- Modify: `src/hooks/useOrdersData.ts` (add an `updateStatus` function)
- Modify: `src/app/(admin)/orders/page.tsx` (the order detail panel's action buttons)

**Interfaces:**
- Consumes: `OrdersAdapter.updateOrderStatus(id: number, statusId: number): Promise<void>` (already exists), `statuses` from `useOrdersData()` (wired in Task 1).
- Produces: `PATCH /api/orders/[id]` with body `{id_estado: number}` → `{success, data: {id_estado: number}}`. `useOrdersData().updateStatus(orderId: number, statusId: number): Promise<void>`.

- [ ] **Step 1: Add the PATCH handler**

In `src/app/api/orders/[id]/route.ts`, the file currently only exports `GET` (built around a `getOrderDetailHandler` wrapped in `withErrorHandling`). Add a PATCH handler using the exact same wrapping pattern already in this file:

```typescript
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { OrdersAdapter } from '@/lib/database/adapters/orders-adapter';
import { ValidationError } from '@/lib/api/error-handler';

async function getOrderDetailHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const adapter = new OrdersAdapter();
  const detail = await adapter.getOrderDetails(id);
  return ApiResponse.success(detail);
}

async function patchOrderStatusHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const body = await request.json();
  const statusId = parseInt(body.id_estado, 10);
  if (isNaN(statusId)) throw new ValidationError('id_estado es requerido y debe ser numérico');

  const adapter = new OrdersAdapter();
  await adapter.updateOrderStatus(id, statusId);
  return ApiResponse.success({ id_estado: statusId });
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return getOrderDetailHandler(req, context)
  })(request)
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return patchOrderStatusHandler(req, context)
  })(request)
}
```

(This keeps the existing `getOrderDetailHandler`/`GET` exactly as they are today — only `patchOrderStatusHandler`/`PATCH` and the two new imports, `ApiResponse`'s already-imported, are added.)

- [ ] **Step 2: Add `updateStatus` to the hook**

In `src/hooks/useOrdersData.ts`, add to `UseOrdersDataResult`:
```typescript
  updateStatus: (orderId: number, statusId: number) => Promise<void>;
```
Add the function itself, alongside `createOrder`:
```typescript
  const updateStatus = async (orderId: number, statusId: number) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_estado: statusId }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error?.message || 'Error al actualizar el estado');
    refetch();
  };
```
Add it to the final `return { orders, loading, error, refetch, createOrder, statuses }` → `return { orders, loading, error, refetch, createOrder, statuses, updateStatus };`.

- [ ] **Step 3: Replace "Mark Dispatched" with a real status control**

In `src/app/(admin)/orders/page.tsx`, add `updateStatus` to the hook destructure from Step 1 of Task 1 (`const { orders, loading, error, refetch, createOrder, statuses } = useOrdersData({ limit: 50 });` becomes `const { orders, loading, error, refetch, createOrder, statuses, updateStatus } = useOrdersData({ limit: 50 });`).

Add local state for the in-flight update, near the other `useState` calls in this component:
```typescript
  const [statusUpdating, setStatusUpdating] = useState(false);
```

Find the action buttons block at the bottom of the order detail panel:
```tsx
            <div className="flex gap-4 border-t border-bone/10 pt-6 mt-auto">
              <button className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)]">
                <Truck size={14} />
                Mark Dispatched
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all">
                <FileText size={14} />
                Generate Invoice
              </button>
            </div>
```
Replace it with a status-chip row above the two action buttons (keep "Generate Invoice" exactly as it is — it's a placeholder for now and that's fine, don't wire it to anything):
```tsx
            <div className="border-t border-bone/10 pt-6 mt-auto">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-3">Change Status</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {statuses.map((s) => (
                  <button
                    key={s.id_estado}
                    type="button"
                    disabled={statusUpdating}
                    onClick={async () => {
                      if (s.id_estado === selected.id_estado) return;
                      setStatusUpdating(true);
                      try {
                        await updateStatus(selected.id_pedido, s.id_estado);
                      } catch (e: any) {
                        alert(e.message || 'Error al actualizar el estado');
                      } finally {
                        setStatusUpdating(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-widest font-geist font-bold transition-all border disabled:opacity-50 ${
                      selected.id_estado === s.id_estado
                        ? "bg-ember text-obsidian border-ember"
                        : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                    }`}
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all">
                  <FileText size={14} />
                  Generate Invoice
                </button>
              </div>
            </div>
```

(The `Truck` icon import becomes unused after this change — remove `Truck` from the `lucide-react` import line at the top of the file; keep `FileText` since "Generate Invoice" still uses it.)

- [ ] **Step 4: Verify**

Run `npm run type-check` — zero new errors, and confirm `Truck` is no longer imported anywhere in this file (an unused import would only be a lint warning, not a type error, so check by eye too).

Open `/orders`, select an order, click a different status chip than the current one — confirm the badge on that order (both in the left list and the detail header) updates to the new status after the call resolves, and that clicking the already-active status chip does nothing (no network call). Directly query the order afterward (`curl /api/orders/<id>`) to confirm `id_estado` persisted. If you changed a real order's status during testing, change it back to its original value before finishing.

---

## Task 4: Invoicing page cleanup — delete the hardcoded list and "+ New Invoice"

**Files:**
- Modify: `src/app/(admin)/invoicing/page.tsx` (full rewrite of the file body)

**Interfaces:**
- Consumes: none (this page becomes fully static).
- Produces: nothing consumed elsewhere.

Invoices are meant to be generated directly from an order (the "Generate Invoice" button added in Task 3, currently a placeholder with no backend — there is no `factura`/`invoice` table anywhere in the schema), not authored standalone from this page. Until that backend exists, this page follows the exact same "Próximamente" pattern already used on `/reporting` (Activity Log) and `/dashboard`.

- [ ] **Step 1: Replace the whole file**

Replace the entire contents of `src/app/(admin)/invoicing/page.tsx` with:

```tsx
"use client";

import React from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function InvoicingPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Finance"
        title="Invoicing"
        sub="Manage and preview customer invoices with IVA calculation."
        bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=300&fit=crop&auto=format"
      />

      <FloraGlass className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Receipt size={48} className="text-bone/30 mb-6" />
        <h2 className="font-fraunces text-3xl font-bold text-bone mb-3">Próximamente</h2>
        <p className="font-geist text-sm text-bone/50 max-w-md leading-relaxed">
          Las facturas se generan directamente desde cada pedido, no desde esta pantalla.
          Esta vista mostrará el historial de facturas una vez exista esa integración en el backend.
        </p>
      </FloraGlass>
    </div>
  );
}
```

This deletes: the hardcoded `INVOICES` array, the `+ New Invoice` header button, the search bar, the status filter chips, the invoice list column, and the entire mocked invoice-detail preview (crosshair deco, line items table, subtotal/tax/total math, Download/Send buttons) — none of it is backed by real data.

- [ ] **Step 2: Verify**

Run `npm run type-check` — zero new errors from this file (and confirm no other file imports anything from the old `invoicing/page.tsx` — it's a page component, nothing should).

Open `/invoicing` in the browser — confirm it shows the Próximamente panel, no console errors, no leftover invoice list or "+ New Invoice" button anywhere on the page.

---

## Task 5: Log Movement — deliberate negative-stock override with a hold-to-confirm button

**Files:**
- Create: `supabase/migrations/20260813010000_adjust_inventory_forzar.sql`
- Create: `src/components/figma-shared/HoldToConfirmButton.tsx`
- Modify: `src/lib/database/adapters/inventory-adapter.ts` (`adjustInventory` method)
- Modify: `src/app/api/inventory/adjust/route.ts`
- Modify: `src/lib/inventory-movements-client.ts`
- Modify: `src/components/inventory/StockMovementModal.tsx`

**Interfaces:**
- Consumes: current `adjust_inventory(p_id_producto_talla, p_cantidad_cambio, p_motivo, p_tipo_movimiento)` (4 params, currently hard-rejects any change that would take stock below 0).
- Produces: `adjust_inventory` gains a 5th param `p_forzar boolean DEFAULT false` — when true, the negative-stock guard is skipped and stock is allowed to go negative. `InventoryAdapter.adjustInventory(inventoryId, quantityChange, reason?, tipoMovimiento?, forzar?)`. `HoldToConfirmButton` — a new shared component: `{ onConfirm: () => void; holdMs?: number; label: string; className?: string }`, renders a button that fills with a progress bar while pressed and calls `onConfirm` only once the hold completes.

- [ ] **Step 1: Write and apply the migration**

Create `supabase/migrations/20260813010000_adjust_inventory_forzar.sql`:

```sql
DROP FUNCTION IF EXISTS public.adjust_inventory(integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_id_producto_talla integer,
  p_cantidad_cambio integer,
  p_motivo text DEFAULT 'ajuste manual',
  p_tipo_movimiento text DEFAULT NULL,
  p_forzar boolean DEFAULT false
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

  IF v_nuevo_stock < 0 AND NOT p_forzar THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', v_stock_actual, ABS(p_cantidad_cambio);
  END IF;

  v_tipo_movimiento := COALESCE(p_tipo_movimiento, CASE WHEN p_cantidad_cambio >= 0 THEN 'entrada' ELSE 'salida' END);

  UPDATE public.productotallastock
  SET stock = v_nuevo_stock
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
    'stock_nuevo', v_nuevo_stock,
    'tipo_movimiento', v_tipo_movimiento,
    'success', TRUE
  );
END;
$$;
```

Run `npx supabase db push`. Verify: fetch a real `productotallastock` row's stock, call the RPC with `p_cantidad_cambio` more negative than available stock and `p_forzar: false` (or omitted) — confirm it still raises (this must keep working exactly as before). Then call it again with the same over-negative `p_cantidad_cambio` and `p_forzar: true` — confirm it now succeeds and the row's `stock` really went negative (query `productotallastock` directly, don't just trust the RPC's return value). Revert the stock back to its original value afterward (another `adjust_inventory` call with the inverse delta and `p_forzar: true`, since going back up will also cross zero) and delete the two movement rows your verification created.

- [ ] **Step 2: Thread `forzar` through the adapter, route, and client helper**

In `src/lib/database/adapters/inventory-adapter.ts`, change the `adjustInventory` method:

```typescript
  async adjustInventory(
    inventoryId: number,
    quantityChange: number,
    reason: string = 'ajuste manual',
    tipoMovimiento?: string | null,
    forzar: boolean = false
  ): Promise<AdjustmentResult> {
    const supabase = this.client.getClient();

    const { data, error } = await (supabase as any).rpc('adjust_inventory', {
      p_id_producto_talla: inventoryId,
      p_cantidad_cambio: quantityChange,
      p_motivo: reason,
      p_tipo_movimiento: tipoMovimiento || null,
      p_forzar: forzar
    });

    if (error) {
      console.error('Error adjusting inventory:', error);
      throw new ValidationError(error.message);
    }

    return data;
  }
```

In `src/app/api/inventory/adjust/route.ts`, in `adjustInventoryHandler`, add `forzar` extraction and pass it through:

```typescript
  const forzar = body.forzar === true

  ...

  const result = await adapter.adjustInventory(
    inventoryId,
    quantityChange,
    reason,
    tipoMovimiento,
    forzar
  )
```

(Add the `const forzar = ...` line right after the existing `tipoMovimiento` line, and add `forzar` as the 5th argument to the existing `adapter.adjustInventory(...)` call — every other line in this handler stays as it is.)

In `src/lib/inventory-movements-client.ts`, add `forzar` to the payload:

```typescript
export interface LogMovementPayload {
  inventoryId: number;
  quantityChange: number;
  reason: string;
  tipoMovimiento?: string;
  forzar?: boolean;
}

export async function logInventoryMovement(payload: LogMovementPayload) {
  const res = await fetch('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventoryId: payload.inventoryId,
      quantityChange: payload.quantityChange,
      reason: payload.reason,
      tipoMovimiento: payload.tipoMovimiento,
      forzar: payload.forzar,
    }),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Error al registrar el movimiento');
  }
  return result.data;
}
```

- [ ] **Step 3: Build the hold-to-confirm button**

Create `src/components/figma-shared/HoldToConfirmButton.tsx`:

```tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HoldToConfirmButtonProps {
  label: string;
  onConfirm: () => void;
  holdMs?: number;
  disabled?: boolean;
  className?: string;
}

export function HoldToConfirmButton({
  label,
  onConfirm,
  holdMs = 3000,
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / holdMs);
    setProgress(pct);
    if (pct >= 1) {
      stop();
      onConfirm();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [holdMs, onConfirm, stop]);

  const start = useCallback(() => {
    if (disabled) return;
    setHolding(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, tick]);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      className={cn(
        "relative w-full py-3 overflow-hidden bg-red-950/40 border border-red-500/50 text-red-300 font-geist text-xs font-bold uppercase tracking-[0.15em] rounded-[4px] transition-colors disabled:opacity-50 select-none",
        holding ? "text-obsidian" : "hover:bg-red-950/60",
        className
      )}
    >
      <span
        className="absolute inset-y-0 left-0 bg-red-500 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative z-10">{holding ? "Hold to confirm..." : label}</span>
    </button>
  );
}
```

- [ ] **Step 4: Wire the confirm flow into `StockMovementModal`**

In `src/components/inventory/StockMovementModal.tsx`:

Import the new button and add `HoldToConfirmButton` to the existing import line from `figma-shared/Modal` — actually `HoldToConfirmButton` lives in its own file (Step 3), so add a separate import line:
```typescript
import { HoldToConfirmButton } from "@/components/figma-shared/HoldToConfirmButton";
```

Add state to track the pending-negative-confirmation flow, alongside the existing `useState` calls:
```typescript
  const [pendingNegative, setPendingNegative] = useState<{ delta: number; tipoMovimiento?: string } | null>(null);
```

Add `setPendingNegative(null);` to the existing `if (!open) { ... }` reset effect, alongside the other resets.

Replace `handleSubmit` entirely — it currently blocks with a hard error when the delta would exceed stock; now it instead arms the confirm flow:

```typescript
  const performSubmit = async (delta: number, tipoMovimiento: string | undefined, forzar: boolean) => {
    const selectedOption = skuOptions.find((o) => o.id === skuId);
    if (!skuId || !selectedOption) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        inventoryId: skuId,
        quantityChange: delta,
        reason: note.trim() || activeType.description,
        tipoMovimiento,
        forzar,
      });
      setPendingNegative(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = skuOptions.find((o) => o.id === skuId);
    if (!skuId || !selectedOption) {
      setError("Selecciona un SKU");
      return;
    }
    const sign = movementType === "out" ? -1 : movementType === "adjustment" ? direction : 1;
    const delta = sign * quantity;
    const tipoMovimiento = movementType === "adjustment" ? "ajuste" : undefined;

    if (delta < 0 && Math.abs(delta) > selectedOption.currentStock) {
      setPendingNegative({ delta, tipoMovimiento });
      return;
    }

    await performSubmit(delta, tipoMovimiento, false);
  };
```

Update `onSubmit`'s prop type in `StockMovementModalProps` to include the two new optional fields:
```typescript
  onSubmit: (payload: { inventoryId: number; quantityChange: number; reason: string; tipoMovimiento?: string; forzar?: boolean }) => Promise<void>;
```

Reset `pendingNegative` whenever the user changes any input that would invalidate the pending confirmation (SKU, quantity, movement type, direction) — add this near the top of the component body, after the other `useState` declarations:
```typescript
  useEffect(() => {
    setPendingNegative(null);
  }, [skuId, quantity, movementType, direction]);
```

Finally, replace the `<SubmitBar submitLabel="Log It" loading={loading} error={error} />` line at the bottom of the form with a conditional block — normal submit button when there's no pending negative confirmation, the hold-to-confirm button plus a warning message when there is:

```tsx
        {pendingNegative ? (
          <div className="flex flex-col gap-3 pt-2">
            <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
              Esta acción puede generar stock negativo. ¿Continuar de todas formas?
            </div>
            {error && (
              <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[2px] font-geist">
                {error}
              </div>
            )}
            <HoldToConfirmButton
              label="SÉ LO QUE HAGO"
              disabled={loading}
              onConfirm={() => performSubmit(pendingNegative.delta, pendingNegative.tipoMovimiento, true)}
            />
          </div>
        ) : (
          <SubmitBar submitLabel="Log It" loading={loading} error={error} />
        )}
```

- [ ] **Step 5: Verify**

Run `npm run type-check` — zero new errors.

Open `/inventory`, click a SKU picker entry with a small known stock (or note the current stock of any SKU), open "Log Movement", pick "Stock Out", enter a quantity larger than that SKU's current stock, click "Log It" — confirm: (a) the warning message appears, (b) the button changes to "SÉ LO QUE HAGO" with a visible progress fill, (c) releasing early (mouse up before ~3s) resets the fill and does NOT submit, (d) holding the full ~3 seconds submits successfully. After it submits, confirm on `/inventory` (or via direct `curl` of `/api/inventory/items`) that the SKU's stock is now genuinely negative, and that it displays as a negative number in the table (not clamped to 0, not hidden) — the table's Stock column has no custom renderer today (`TacticalTable`'s default cell renderer is `String(item.stock)`), so this should already work with no further code change; if it doesn't render correctly, that's a real finding to fix as part of this task, not a separate one. Then use "Stock In" to bring the SKU back to its original stock value (a normal, non-negative-resulting adjustment, no hold needed) and delete every movement row your testing created, keeping only the ones that were already there.

---

## Task 6: Log Movement — include catalog products that have no stock row yet

**Files:**
- Create: `supabase/migrations/20260813020000_list_inventory_items_include_unstocked.sql`
- Modify: `src/lib/database/adapters/catalog-adapter.ts` (export two currently-private helper functions, no behavior change)
- Modify: `src/lib/database/adapters/inventory-adapter.ts` (`getInventoryItems` — add an option and a new method)
- Modify: `src/app/api/inventory/adjust/route.ts` (accept a variant-only payload shape and route it to the new creation path)
- Modify: `src/components/inventory/StockMovementModal.tsx`
- Modify: `src/app/(admin)/inventory/page.tsx` (only the effect/state that feeds `StockMovementModal`'s `skuOptions` — the main table's own data source is untouched, it must keep behaving exactly as it does today)

**Interfaces:**
- Consumes: `resolveDefaultProviderId()` / `resolveTallaProveedorId()` from `catalog-adapter.ts` (currently private, this task exports them for reuse — no logic change).
- Produces: `list_inventory_items` gains a 5th param `p_incluir_sin_stock_row boolean DEFAULT false` — when true, the result additionally includes one synthetic row per `productovariante` that has zero `productotallastock` rows (`id_producto_talla: null`, `stock: 0`, `talla_codigo: null`). `InventoryAdapter.getInventoryItems(...)` gains `includeUnstocked?: boolean`. A new `InventoryAdapter.createStockAndAdjust(idVariante: number, initialQuantity: number, motivo: string): Promise<AdjustmentResult>` creates the first `productotallastock` row for a variant (size defaults to `"OS"`) and immediately logs it as an `entrada` via the existing `adjust_inventory` RPC.

**Why this is scoped the way it is:** there are three real catalog products in the live database right now (`Rashguard Bruma`, `Pantalón Sin Licra Bruma`, `T-Shirt Bruma`) with zero `productotallastock` rows at all — confirmed by direct query, not assumed. `list_inventory_items` currently INNER JOINs from `productotallastock` outward, so these can never appear via any existing flag combination. The main Inventory table and the Orders line-picker are correct to keep excluding them (you can't adjust or sell a size that was never catalogued) — only Log Movement needs to see them, specifically to let a user log the very first "Stock In" for a product that was catalogued without initial sizing. Rather than adding a size-picker to the movement form for this rare case, unstocked variants get a single default size, `"OS"` — the same value `SIZE_OPTIONS` in `AddProductModal.tsx`/`EditProductModal.tsx` already lists first.

- [ ] **Step 1: Write and apply the migration**

Create `supabase/migrations/20260813020000_list_inventory_items_include_unstocked.sql`:

```sql
DROP FUNCTION IF EXISTS public.list_inventory_items(boolean, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.list_inventory_items(
  p_incluir_stock_cero boolean DEFAULT false,
  p_id_categoria integer DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_incluir_sin_stock_row boolean DEFAULT false
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

  UNION ALL

  SELECT
    NULL::integer AS id_producto_talla,
    p.id_producto,
    pv.id_variante,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    c.nombre AS categoria_nombre,
    col.nombre AS coleccion_nombre,
    pv.nombre_variante,
    pv.codigo_variante,
    NULL::character varying AS talla_codigo,
    0 AS stock,
    COALESCE(pv.precio_variante, 0) AS precio,
    'critical' AS status
  FROM public.productovariante pv
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tipoproducto c ON c.id_tipo = p.id_categoria
  LEFT JOIN public.coleccion col ON col.id_coleccion = p.id_coleccion
  WHERE p_incluir_sin_stock_row
    AND (p_id_categoria IS NULL OR p.id_categoria = p_id_categoria)
    AND NOT EXISTS (
      SELECT 1 FROM public.productotallastock pts2 WHERE pts2.id_variante = pv.id_variante
    )

  ORDER BY producto_nombre ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;
```

Run `npx supabase db push`. Verify with `p_incluir_sin_stock_row: false` (or omitted) first — confirm the result is byte-for-byte the same shape/rows as before this migration for a couple of known SKUs (this flag must default to fully inert). Then call with `p_incluir_sin_stock_row: true` and confirm the 3 known unstocked products (`Rashguard Bruma`, `Pantalón Sin Licra Bruma`, `T-Shirt Bruma`) now appear, each with `id_producto_talla: null` and `stock: 0`.

- [ ] **Step 2: Export the two helpers this task needs to reuse**

In `src/lib/database/adapters/catalog-adapter.ts`, these two functions currently have no `export` keyword:
```typescript
async function resolveDefaultProviderId(): Promise<number> {
```
```typescript
async function resolveTallaProveedorId(providerId: number, sizeCode: string): Promise<number> {
```
Add `export` to both (`export async function resolveDefaultProviderId...` / `export async function resolveTallaProveedorId...`). No other change to either function's body.

- [ ] **Step 3: Add `includeUnstocked` to `getInventoryItems`, add `createStockAndAdjust`**

In `src/lib/database/adapters/inventory-adapter.ts`, add the import at the top:
```typescript
import { resolveDefaultProviderId, resolveTallaProveedorId } from './catalog-adapter'
```

Change the `getInventoryItems` method's options type and RPC call:
```typescript
  async getInventoryItems(
    _projectId?: string,
    options: {
      includeZeroStock?: boolean;
      includeUnstocked?: boolean;
      categoryFilter?: number | null;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InventoryItemExtended[]> {
    const {
      includeZeroStock = false,
      includeUnstocked = false,
      categoryFilter = null,
      limit = 100,
      offset = 0
    } = options;

    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('list_inventory_items', {
      p_incluir_stock_cero: includeZeroStock,
      p_id_categoria: categoryFilter,
      p_limit: limit,
      p_offset: offset,
      p_incluir_sin_stock_row: includeUnstocked
    });

    if (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      inventory_id: item.id_producto_talla,
      product_id: item.id_producto,
      variant_id: item.id_variante,
      sku: item.id_producto_talla
        ? (item.variante_codigo || item.producto_codigo) + (item.talla_codigo ? `-${item.talla_codigo}` : '')
        : `${item.producto_codigo} — No size set`,
      product_name: item.producto_nombre,
      product_sku: item.producto_codigo,
      category_name: item.categoria_nombre,
      variant_name: item.variante_nombre,
      variant_sku: item.variante_codigo,
      size: item.talla_codigo || null,
      collection: item.coleccion_nombre || null,
      current_stock: item.stock,
      price: Number(item.precio),
      status: item.status as any
    }));
  }
```

Add `variant_id: number | null;` to the `InventoryItemExtended` interface — check first whether it's already there (it should already exist as `variant_id: number | null;` per the current file); if present, leave it, this mapping just needs to actually populate it from `item.id_variante` as shown above.

Add a new method to the same class, right after `adjustInventory`:
```typescript
  async createStockAndAdjust(idVariante: number, initialQuantity: number, motivo: string): Promise<AdjustmentResult> {
    const providerId = await resolveDefaultProviderId();
    const tallaProveedorId = await resolveTallaProveedorId(providerId, 'OS');

    const supabase = this.client.getClient();
    const { data: variantRow, error: variantErr } = await (supabase as any)
      .from('productovariante')
      .select('precio_variante')
      .eq('id_variante', idVariante)
      .maybeSingle();
    if (variantErr) throw new ValidationError(variantErr.message);

    const { data: stockRow, error: stockErr } = await (supabase as any)
      .from('productotallastock')
      .insert({
        id_variante: idVariante,
        id_talla_proveedor: tallaProveedorId,
        stock: 0,
        precio: variantRow?.precio_variante || 0,
      })
      .select('id_producto_talla')
      .single();
    if (stockErr) throw new ValidationError(stockErr.message);

    return this.adjustInventory(stockRow.id_producto_talla, initialQuantity, motivo, 'entrada', false);
  }
```

- [ ] **Step 4: Route variant-only adjust requests to the creation path**

In `src/app/api/inventory/adjust/route.ts`, the handler currently always requires `inventoryId`. Add a second, variant-based path — if the request carries `idVariante` instead of `inventoryId`, create the row first. Replace the whole `adjustInventoryHandler` function:

```typescript
async function adjustInventoryHandler(request: NextRequest) {
  const body = await request.json()
  const idVariante = body.idVariante ? parseInt(body.idVariante, 10) : null
  const reason = body.reason || body.motivo || 'ajuste manual'
  const tipoMovimiento = body.tipoMovimiento || body.tipo_movimiento || null
  const forzar = body.forzar === true

  const adapter = new InventoryAdapter()

  if (idVariante) {
    const quantityChange = parseInt(body.quantityChange ?? body.cantidad_cambio, 10)
    if (isNaN(quantityChange) || quantityChange <= 0) {
      throw new ValidationError('quantityChange debe ser un número positivo para un SKU sin stock previo')
    }
    const result = await adapter.createStockAndAdjust(idVariante, quantityChange, reason)
    return ApiResponse.success(result)
  }

  const inventoryId = parseInt(body.inventoryId || body.id_producto_talla, 10)
  const quantityChange = parseInt(body.quantityChange ?? body.cantidad_cambio, 10)

  if (isNaN(inventoryId)) throw new ValidationError('inventoryId es requerido y debe ser numérico')
  if (isNaN(quantityChange)) throw new ValidationError('quantityChange es requerido y debe ser numérico')

  const result = await adapter.adjustInventory(
    inventoryId,
    quantityChange,
    reason,
    tipoMovimiento,
    forzar
  )

  return ApiResponse.success(result)
}
```

- [ ] **Step 5: Fetch the fuller list for Log Movement, only allow Stock In for unstocked entries**

In `src/app/(admin)/inventory/page.tsx`, find where `skuOptions` is built:
```typescript
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
This currently reuses the same `inventory` array as the main table (which correctly stays limited to stocked items — don't change that). Add a separate fetch specifically for the movement modal's options, alongside the existing `useInventory()` call:
```typescript
  const [movementSkuOptions, setMovementSkuOptions] = useState<{ id: number | null; idVariante: number; sku: string; productName: string; currentStock: number }[]>([]);

  useEffect(() => {
    if (!showMovementModal) return;
    fetch('/api/inventory/items?limit=200&includeZeroStock=true&includeUnstocked=true')
      .then((res) => res.json())
      .then((result) => {
        const items = result.data ?? [];
        setMovementSkuOptions(
          items.map((i: any) => ({
            id: i.inventory_id,
            idVariante: i.variant_id,
            sku: i.sku,
            productName: i.product_name,
            currentStock: i.current_stock,
          }))
        );
      });
  }, [showMovementModal]);
```
(`useEffect` is already imported in this file via `React.useEffect` — use `React.useEffect` to match the existing style in this file, or check the top import line first: if `useEffect` is already destructured from `"react"` alongside `useState`/`useMemo`, use it unqualified to match.)

Change the `<StockMovementModal skuOptions={skuOptions} .../>` prop to use the new list:
```tsx
      <StockMovementModal
        open={showMovementModal}
        onOpenChange={setShowMovementModal}
        skuOptions={movementSkuOptions}
        onSubmit={async (payload) => {
          await logInventoryMovement(payload);
          await fetchInventory();
        }}
      />
```

- [ ] **Step 6: Update `StockMovementModal` to handle the null-id case**

In `src/components/inventory/StockMovementModal.tsx`, update the `SkuOption` interface:
```typescript
export interface SkuOption {
  id: number | null;
  idVariante: number;
  sku: string;
  productName: string;
  currentStock: number;
}
```

Update `LogMovementPayload`'s consumer shape — the `onSubmit` payload's `inventoryId` field needs to become nullable and gain `idVariante` for the null case. Update `StockMovementModalProps['onSubmit']`:
```typescript
  onSubmit: (payload: { inventoryId: number | null; idVariante?: number; quantityChange: number; reason: string; tipoMovimiento?: string; forzar?: boolean }) => Promise<void>;
```

In `performSubmit` (added in Task 5), when `selectedOption.id` is `null`, only Stock In makes sense (there's no existing row to take from or adjust) — enforce this and pass `idVariante` through instead of `inventoryId`. Replace `performSubmit`'s body:
```typescript
  const performSubmit = async (delta: number, tipoMovimiento: string | undefined, forzar: boolean) => {
    const selectedOption = skuOptions.find((o) => o.id === skuId || (skuId === null && o.idVariante === pendingVariantId));
    if (!selectedOption) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        inventoryId: selectedOption.id,
        idVariante: selectedOption.id === null ? selectedOption.idVariante : undefined,
        quantityChange: delta,
        reason: note.trim() || activeType.description,
        tipoMovimiento,
        forzar,
      });
      setPendingNegative(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };
```

This introduces a problem: `skuId` (the `<select>`/dropdown's bound value) is typed `number | null` already for "nothing selected", so it can't also represent "a real selection whose id happens to be null." Change the SKU selection state to track the option's index/key instead of its `id`. Replace the `skuId` state and every place that reads it:

Change:
```typescript
  const [skuId, setSkuId] = useState<number | null>(null);
```
to:
```typescript
  const [selectedSkuKey, setSelectedSkuKey] = useState<string | null>(null);
```
(a stable string key, since `id` alone can collide with `null`). Build the key as `` `${sku.id ?? 'v'}-${sku.idVariante}` `` everywhere a `SkuOption` needs one.

Update the `DropdownField` usage:
```tsx
            <DropdownField
              value={selectedSkuKey}
              onChange={setSelectedSkuKey}
              placeholder="Select SKU..."
              options={skuOptions.map((opt) => ({
                value: `${opt.id ?? 'v'}-${opt.idVariante}`,
                label: opt.id
                  ? `${opt.sku} — ${opt.productName} (${opt.currentStock} in stock)`
                  : `${opt.sku} — ${opt.productName} (no size set yet)`,
              }))}
            />
```

`DropdownField` is generic over `string | number` (see `src/components/figma-shared/Modal.tsx`) — passing `string` values throughout is already a supported case, no change needed there.

Update every other place in the file that referenced `skuId` to instead derive the selected option from `selectedSkuKey`:
```typescript
  const selectedOption = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === selectedSkuKey);
```
Use `selectedOption` (compute it once near the top of `handleSubmit`, replacing the old `const selectedOption = skuOptions.find((o) => o.id === skuId);` line) instead of re-deriving it in `performSubmit` — simplify `performSubmit` back to taking the resolved option directly rather than re-searching:

```typescript
  const performSubmit = async (option: SkuOption, delta: number, tipoMovimiento: string | undefined, forzar: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        inventoryId: option.id,
        idVariante: option.id === null ? option.idVariante : undefined,
        quantityChange: delta,
        reason: note.trim() || activeType.description,
        tipoMovimiento,
        forzar,
      });
      setPendingNegative(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Error al registrar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === selectedSkuKey);
    if (!selectedOption) {
      setError("Selecciona un SKU");
      return;
    }
    if (selectedOption.id === null && movementType !== "in") {
      setError("Este producto no tiene tallas registradas todavía — solo se puede usar Stock In para darlo de alta.");
      return;
    }
    const sign = movementType === "out" ? -1 : movementType === "adjustment" ? direction : 1;
    const delta = sign * quantity;
    const tipoMovimiento = movementType === "adjustment" ? "ajuste" : undefined;

    if (delta < 0 && Math.abs(delta) > selectedOption.currentStock) {
      setPendingNegative({ option: selectedOption, delta, tipoMovimiento });
      return;
    }

    await performSubmit(selectedOption, delta, tipoMovimiento, false);
  };
```

Update `pendingNegative`'s type (introduced in Task 5) to carry the resolved option instead of re-deriving it later:
```typescript
  const [pendingNegative, setPendingNegative] = useState<{ option: SkuOption; delta: number; tipoMovimiento?: string } | null>(null);
```
and its consumer in the JSX (the `HoldToConfirmButton`'s `onConfirm`):
```tsx
            <HoldToConfirmButton
              label="SÉ LO QUE HAGO"
              disabled={loading}
              onConfirm={() => performSubmit(pendingNegative.option, pendingNegative.delta, pendingNegative.tipoMovimiento, true)}
            />
```

Update the reset effect and the `useEffect(() => setPendingNegative(null), [...])` from Task 5 to reference `selectedSkuKey` instead of `skuId`:
```typescript
  useEffect(() => {
    if (!open) {
      setMovementType("in");
      setSelectedSkuKey(null);
      setQuantity(1);
      setDirection(1);
      setNote("");
      setError(null);
      setPendingNegative(null);
    }
  }, [open]);

  useEffect(() => {
    setPendingNegative(null);
  }, [selectedSkuKey, quantity, movementType, direction]);
```

Finally, disable the movement-type buttons other than "Stock In" when the selected option has `id === null` — find the `MOVEMENT_TYPES.map((t) => (<button ...>))` block and add a `disabled` condition:
```tsx
            {MOVEMENT_TYPES.map((t) => {
              const selectedOption = skuOptions.find((o) => `${o.id ?? 'v'}-${o.idVariante}` === selectedSkuKey);
              const disabledForUnstocked = selectedOption?.id === null && t.id !== "in";
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabledForUnstocked}
                  onClick={() => setMovementType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 rounded-[2px] border text-[10px] font-geist uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                    movementType === t.id ? t.color : "text-bone/40 border-bone/15 hover:border-bone/40"
                  )}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              );
            })}
```

- [ ] **Step 7: Update `logInventoryMovement`'s payload type to match**

In `src/lib/inventory-movements-client.ts`, `LogMovementPayload.inventoryId` needs to become nullable and gain `idVariante`:
```typescript
export interface LogMovementPayload {
  inventoryId: number | null;
  idVariante?: number;
  quantityChange: number;
  reason: string;
  tipoMovimiento?: string;
  forzar?: boolean;
}

export async function logInventoryMovement(payload: LogMovementPayload) {
  const res = await fetch('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventoryId: payload.inventoryId,
      idVariante: payload.idVariante,
      quantityChange: payload.quantityChange,
      reason: payload.reason,
      tipoMovimiento: payload.tipoMovimiento,
      forzar: payload.forzar,
    }),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Error al registrar el movimiento');
  }
  return result.data;
}
```

- [ ] **Step 8: Verify end-to-end**

Run `npm run type-check` — zero new errors from any file touched in this task.

Open `/inventory`, confirm the main table's row count and contents are unchanged from before this task (the 3 unstocked legacy products must NOT appear there). Open "Log Movement" — confirm the SKU dropdown now includes `Rashguard Bruma`, `Pantalón Sin Licra Bruma`, and `T-Shirt Bruma` (labeled "no size set yet"), alongside every normal stocked SKU. Select one of the unstocked ones — confirm every movement-type button except "Stock In" is visibly disabled. With "Stock In" selected, enter a quantity, submit — confirm success, then confirm on `/inventory` that this product NOW appears in the main table too (since it has real stock ≥ 0 after the OS row was created) with size "OS". Check `/movements` shows the resulting `entrada` row. Then revert: delete the movement row, delete the `productotallastock` row you created, confirming via direct query that the product is back to having zero stock rows (matching its original state).

---

## Self-Review Notes

- Every task's SQL migration follows the `DROP FUNCTION IF EXISTS` rule from Global Constraints, matching the exact currently-deployed signature it's replacing (`create_order`: 10 params; `adjust_inventory`: 4 params; `list_inventory_items`: 4 params) — verified against the live migration files, not assumed.
- Task 6's `list_inventory_items` change is additive-only (`p_incluir_sin_stock_row` defaults to `false`, and the new `UNION ALL` branch contributes zero rows unless that flag is explicitly passed `true`) — the main Inventory table (`fetchInventory()` in `useInventory.ts`, unmodified by this plan) and the Orders line picker (`orders/page.tsx`, only touched by Task 2's unrelated `stock` field addition) keep their exact current behavior.
- Task 5 and Task 6 both touch `StockMovementModal.tsx`'s `handleSubmit`/`performSubmit`/state — they are written to compose (Task 6's Step 6 shows the fully-merged final state of those functions, not a second independent rewrite), so execute Task 5 before Task 6.
- No task touches `EditProductModal.tsx`, `AddProductModal.tsx`, `catalog-adapter.ts`'s `createCatalogProductWithStock`, or any file from the two prior plans beyond the two newly-exported helper functions (Task 6, Step 2) and `inventory-adapter.ts`'s already-established `adjustInventory` (Task 5).
