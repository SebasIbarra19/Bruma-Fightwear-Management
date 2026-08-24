# Invoicing Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real invoicing feature from scratch — database, backend, and UI — so an admin can generate an invoice from an order, adjust its line items and apply a discount, mark it paid, and download a real PDF.

**Architecture:** New `factura`/`factura_item`/`factura_consecutivo` tables and 5 stored procedures, following this codebase's existing SQL-function-per-operation pattern. A new `invoicing-adapter.ts` + `/api/invoicing` routes mirror the shape already established for Orders this session. The `/invoicing` page (currently a static "Próximamente" placeholder) becomes the real list + detail + editor view, and the already-stubbed "Generate Invoice" button on an order's detail panel starts working. PDF generation uses `@react-pdf/renderer` in a dedicated route handler — no headless browser, no new infrastructure.

**Tech Stack:** Next.js 14 (App Router) API routes, Supabase (Postgres + PostgREST RPC), `@supabase/supabase-js` service client, React 18 (client components), `@react-pdf/renderer` (new dependency), Tailwind CSS with the existing BRUMA design tokens.

## Global Constraints

- No `projectId` parameter anywhere in new code.
- All money values are `numeric` in Postgres — parse with `parseFloat`/`Number(...)` on the way in, `.toFixed(2)` on the way out, never string concatenation.
- Every SQL function whose parameter list changes after this plan's own earlier tasks MUST be preceded by `DROP FUNCTION IF EXISTS <name>(<exact old param types>)` — this codebase has hit silent-overload bugs from skipping this twice already. (Not relevant to Task 1's brand-new functions, but relevant if a later task in this plan needs to change one of them — none currently do.)
- Follow the existing BRUMA visual language exactly: `bg-obsidian`, `text-bone`, `text-ember`, `font-geist` for labels/UI text (uppercase, `tracking-[0.15em]`–`[0.25em]`), `font-fraunces` for headings, `rounded-[2px]` for inputs/chips, `rounded-[4px]` for panels/buttons.
- No test framework exists in this repo. Verification steps use `npm run type-check`, direct `curl` against the dev server / Supabase REST endpoint, and manual browser checks.
- Apply every migration with `npx supabase db push` as part of the task that creates it, and verify with `curl` (`source .env` first) against the live Supabase REST endpoint before moving on.
- Any test data created for verification must be deleted afterward, confirmed with a follow-up query — never delete or modify pre-existing data.
- **Never run `git stash`, `git reset`, `git checkout --`, or `git clean`** — an earlier plan this session had an incident where `git stash` briefly reverted every uncommitted file in the repo. Only read-only git commands (`status`/`diff`/`log`) are safe. Do not run `git add`/`git commit` either — the user commits everything themselves at the end.

---

## Task 1: Database — `factura` schema and stored procedures

**Files:**
- Create: `supabase/migrations/20260814000000_invoicing.sql`

**Interfaces:**
- Produces: tables `factura_consecutivo(anio, ultimo_numero)`, `factura(id_factura, numero_factura, id_pedido, fecha_emision, fecha_vencimiento, subtotal, descuento, iva, total, estado, notas, fecha_actualizacion)`, `factura_item(id_item, id_factura, descripcion, cantidad, precio_unitario, orden)`.
- Produces SPs: `create_invoice_from_order(p_id_pedido integer, p_dias_vencimiento integer DEFAULT 14) RETURNS jsonb`, `update_invoice(p_id_factura integer, p_items jsonb, p_descuento numeric DEFAULT 0, p_notas text DEFAULT NULL) RETURNS jsonb`, `mark_invoice_paid(p_id_factura integer) RETURNS jsonb`, `get_invoice_detail(p_id_factura integer) RETURNS jsonb`, `list_invoices(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_id_pedido integer DEFAULT NULL) RETURNS TABLE(...)`.

Design notes for whoever implements this: `factura.estado` is a plain `character varying` (`'pending'` / `'paid'`), NOT a foreign key to the existing `estado` table — that table is for order statuses (Pendiente/Confirmado/Enviado/Entregado/Cancelado), a different concept, and coupling them would be wrong. "Overdue" is never stored — it's derived at read time (`estado = 'pending' AND fecha_vencimiento < now()`) in `get_invoice_detail` and `list_invoices`, so it can never drift out of sync with the calendar. `factura_item.descripcion` is free text, not a foreign key to a product — this lets an invoice survive independently of later catalog changes, and lets it be edited (add a line, adjust a description) without any product ever needing to exist for that line. The invoice numbering uses a per-year counter table with an atomic `INSERT ... ON CONFLICT DO UPDATE` (safe under concurrent invoice creation without explicit locking) rather than a Postgres `SEQUENCE`, because sequences don't reset per calendar year on their own and you were explicit about wanting a real, gapless, non-duplicated consecutivo.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260814000000_invoicing.sql`:

```sql
CREATE TABLE public.factura_consecutivo (
  anio integer PRIMARY KEY,
  ultimo_numero integer NOT NULL DEFAULT 0
);

CREATE TABLE public.factura (
  id_factura SERIAL PRIMARY KEY,
  numero_factura character varying NOT NULL UNIQUE,
  id_pedido integer NOT NULL UNIQUE REFERENCES public.pedido(id_pedido),
  fecha_emision timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento timestamp without time zone NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  estado character varying NOT NULL DEFAULT 'pending',
  notas text,
  fecha_actualizacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.factura_item (
  id_item SERIAL PRIMARY KEY,
  id_factura integer NOT NULL REFERENCES public.factura(id_factura) ON DELETE CASCADE,
  descripcion character varying NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  orden integer NOT NULL DEFAULT 0
);

-- ================================================
-- STORED PROCEDURE: get_invoice_detail
-- ================================================

CREATE OR REPLACE FUNCTION public.get_invoice_detail(p_id_factura integer)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'factura', to_jsonb(f) || jsonb_build_object(
      'cliente_nombre', o.cliente_nombre,
      'cliente_email', o.cliente_email,
      'estado_calculado', CASE WHEN f.estado = 'pending' AND f.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'overdue' ELSE f.estado END
    ),
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(fi) ORDER BY fi.orden) FROM public.factura_item fi WHERE fi.id_factura = f.id_factura), '[]'::jsonb)
  )
  FROM public.factura f
  JOIN public.pedido o ON o.id_pedido = f.id_pedido
  WHERE f.id_factura = p_id_factura;
$$;

-- ================================================
-- STORED PROCEDURE: create_invoice_from_order
-- ================================================

CREATE OR REPLACE FUNCTION public.create_invoice_from_order(
  p_id_pedido integer,
  p_dias_vencimiento integer DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anio integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_numero integer;
  v_numero_factura character varying;
  v_id_factura integer;
  v_subtotal numeric := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.factura WHERE id_pedido = p_id_pedido) THEN
    RAISE EXCEPTION 'Este pedido ya tiene una factura';
  END IF;

  INSERT INTO public.factura_consecutivo (anio, ultimo_numero)
  VALUES (v_anio, 1)
  ON CONFLICT (anio) DO UPDATE SET ultimo_numero = factura_consecutivo.ultimo_numero + 1
  RETURNING ultimo_numero INTO v_numero;

  v_numero_factura := 'FAC-' || v_anio || '-' || LPAD(v_numero::text, 4, '0');

  INSERT INTO public.factura (numero_factura, id_pedido, fecha_vencimiento, estado)
  VALUES (v_numero_factura, p_id_pedido, CURRENT_TIMESTAMP + (p_dias_vencimiento || ' days')::interval, 'pending')
  RETURNING id_factura INTO v_id_factura;

  INSERT INTO public.factura_item (id_factura, descripcion, cantidad, precio_unitario, orden)
  SELECT
    v_id_factura,
    p.nombre || COALESCE(' - ' || tb.codigo, ''),
    pd.cantidad,
    pd.precio_unitario,
    ROW_NUMBER() OVER (ORDER BY pd.id_pedido_detalle)
  FROM public.pedidodetalle pd
  JOIN public.productotallastock pts ON pts.id_producto_talla = pd.id_producto_talla
  JOIN public.productovariante pv ON pv.id_variante = pts.id_variante
  JOIN public.producto p ON p.id_producto = pv.id_producto
  LEFT JOIN public.tallaproveedor tp ON tp.id_talla_proveedor = pts.id_talla_proveedor
  LEFT JOIN public.tallabase tb ON tb.id_talla = tp.id_talla
  WHERE pd.id_pedido = p_id_pedido;

  SELECT COALESCE(SUM(cantidad * precio_unitario), 0) INTO v_subtotal
  FROM public.factura_item WHERE id_factura = v_id_factura;

  UPDATE public.factura
  SET subtotal = v_subtotal,
      iva = ROUND(v_subtotal * 0.13, 2),
      total = ROUND(v_subtotal * 1.13, 2)
  WHERE id_factura = v_id_factura;

  RETURN public.get_invoice_detail(v_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: update_invoice
-- ================================================

CREATE OR REPLACE FUNCTION public.update_invoice(
  p_id_factura integer,
  p_items jsonb,
  p_descuento numeric DEFAULT 0,
  p_notas text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric;
BEGIN
  DELETE FROM public.factura_item WHERE id_factura = p_id_factura;

  INSERT INTO public.factura_item (id_factura, descripcion, cantidad, precio_unitario, orden)
  SELECT
    p_id_factura,
    (item->>'descripcion')::character varying,
    (item->>'cantidad')::integer,
    (item->>'precio_unitario')::numeric,
    ordinality
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality);

  SELECT COALESCE(SUM(cantidad * precio_unitario), 0) INTO v_subtotal
  FROM public.factura_item WHERE id_factura = p_id_factura;

  UPDATE public.factura
  SET subtotal = v_subtotal,
      descuento = p_descuento,
      iva = ROUND((v_subtotal - p_descuento) * 0.13, 2),
      total = ROUND((v_subtotal - p_descuento) * 1.13, 2),
      notas = COALESCE(p_notas, notas),
      fecha_actualizacion = CURRENT_TIMESTAMP
  WHERE id_factura = p_id_factura;

  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: mark_invoice_paid
-- ================================================

CREATE OR REPLACE FUNCTION public.mark_invoice_paid(p_id_factura integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.factura SET estado = 'paid', fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_factura = p_id_factura;
  RETURN public.get_invoice_detail(p_id_factura);
END;
$$;

-- ================================================
-- STORED PROCEDURE: list_invoices
-- ================================================

CREATE OR REPLACE FUNCTION public.list_invoices(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_id_pedido integer DEFAULT NULL
)
RETURNS TABLE (
  id_factura integer,
  numero_factura character varying,
  id_pedido integer,
  cliente_nombre character varying,
  cliente_email character varying,
  fecha_emision timestamp without time zone,
  fecha_vencimiento timestamp without time zone,
  total numeric,
  estado character varying,
  estado_calculado text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id_factura, f.numero_factura, f.id_pedido, o.cliente_nombre, o.cliente_email,
    f.fecha_emision, f.fecha_vencimiento, f.total, f.estado,
    CASE WHEN f.estado = 'pending' AND f.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'overdue' ELSE f.estado END
  FROM public.factura f
  JOIN public.pedido o ON o.id_pedido = f.id_pedido
  WHERE p_id_pedido IS NULL OR f.id_pedido = p_id_pedido
  ORDER BY f.fecha_emision DESC
  LIMIT p_limit OFFSET p_offset;
$$;
```

- [ ] **Step 2: Apply and verify the migration**

Run: `npx supabase db push`

Verify (`source .env` first). First find a real order to test against: `curl -s "http://localhost:3000/api/orders?limit=1"` (start the dev server first if needed) to get a real `id_pedido` that has at least one item — or create a throwaway one via `POST /api/orders` the same way earlier tasks in this session's other plans did, if none exists with items.

Call `create_invoice_from_order`:
```bash
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/create_invoice_from_order" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_id_pedido": <real id>}'
```
Expected: a JSON object with `factura.numero_factura` matching `FAC-<current year>-0001` (or the next number if you've run this before), `factura.subtotal`/`iva`/`total` correctly computed (iva = 13% of subtotal, total = subtotal × 1.13), and an `items` array with one entry per order line, each `descripcion` containing a real product name (not just a raw SKU id).

Call it again with the same `p_id_pedido` — expect the `RAISE EXCEPTION 'Este pedido ya tiene una factura'` error (proves the 1:1 uniqueness guard works).

Call `update_invoice` with a `p_descuento` and a modified `p_items` array (e.g. add a line) — confirm `subtotal`/`iva`/`total` recompute correctly with the discount applied before tax (`iva = (subtotal - descuento) * 0.13`).

Call `mark_invoice_paid` — confirm `estado` becomes `'paid'`.

Call `list_invoices` with no args — confirm your test invoice appears, and `estado_calculado` reads `'paid'` (matching the state you just set) not `'overdue'`.

Delete your test invoice and its items afterward (`DELETE FROM factura_item WHERE id_factura = ...` then `DELETE FROM factura WHERE id_factura = ...` via Supabase REST), and reset `factura_consecutivo`'s counter back down by one for the current year if you want the numbering to look clean for the next real invoice — this is optional cosmetic cleanup, not required for correctness (a gap here is fine since nothing else was issued that number), but do delete the test `factura`/`factura_item` rows themselves.

---

## Task 2: Backend — `invoicing-adapter.ts` and `/api/invoicing` routes

**Files:**
- Create: `src/lib/database/adapters/invoicing-adapter.ts`
- Create: `src/app/api/invoicing/route.ts`
- Create: `src/app/api/invoicing/[id]/route.ts`

**Interfaces:**
- Consumes: the 5 SPs from Task 1.
- Produces: `InvoicingAdapter` class with `listInvoices(idPedido?: number): Promise<InvoiceListItem[]>`, `getInvoiceDetail(id: number): Promise<InvoiceDetail | null>`, `createFromOrder(idPedido: number, diasVencimiento?: number): Promise<InvoiceDetail>`, `updateInvoice(id: number, items: {descripcion: string; cantidad: number; precio_unitario: number}[], descuento: number, notas?: string): Promise<InvoiceDetail>`, `markPaid(id: number): Promise<InvoiceDetail>`. Routes: `GET /api/invoicing` (list, optional `?id_pedido=`), `POST /api/invoicing` (body `{id_pedido, dias_vencimiento?}` → create), `GET /api/invoicing/[id]` (detail), `PATCH /api/invoicing/[id]` (body `{items, descuento, notas?}` → update, OR body `{mark_paid: true}` → mark paid).

- [ ] **Step 1: Write the adapter**

Create `src/lib/database/adapters/invoicing-adapter.ts`:

```typescript
import { SupabaseServiceClient } from '@/lib/api/client';
import { DatabaseError } from '@/lib/api/error-handler';

export interface InvoiceListItem {
  id_factura: number;
  numero_factura: string;
  id_pedido: number;
  cliente_nombre: string | null;
  cliente_email: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  estado: string;
  estado_calculado: string;
}

export interface InvoiceItem {
  id_item: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

export interface InvoiceDetail {
  factura: {
    id_factura: number;
    numero_factura: string;
    id_pedido: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    subtotal: number;
    descuento: number;
    iva: number;
    total: number;
    estado: string;
    estado_calculado: string;
    notas: string | null;
    cliente_nombre: string | null;
    cliente_email: string | null;
  };
  items: InvoiceItem[];
}

const db = () => SupabaseServiceClient.getInstance().getClient();

export class InvoicingAdapter {
  async listInvoices(idPedido?: number): Promise<InvoiceListItem[]> {
    const { data, error } = await (db() as any).rpc('list_invoices', {
      p_limit: 100,
      p_offset: 0,
      p_id_pedido: idPedido ?? null,
    });
    if (error) throw new DatabaseError('Failed to list invoices', { originalError: error });
    return data ?? [];
  }

  async getInvoiceDetail(id: number): Promise<InvoiceDetail | null> {
    const { data, error } = await (db() as any).rpc('get_invoice_detail', { p_id_factura: id });
    if (error) throw new DatabaseError('Failed to get invoice detail', { originalError: error });
    return data ?? null;
  }

  async createFromOrder(idPedido: number, diasVencimiento: number = 14): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('create_invoice_from_order', {
      p_id_pedido: idPedido,
      p_dias_vencimiento: diasVencimiento,
    });
    if (error) throw new DatabaseError('Failed to create invoice', { originalError: error });
    return data;
  }

  async updateInvoice(
    id: number,
    items: { descripcion: string; cantidad: number; precio_unitario: number }[],
    descuento: number,
    notas?: string
  ): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('update_invoice', {
      p_id_factura: id,
      p_items: items,
      p_descuento: descuento,
      p_notas: notas ?? null,
    });
    if (error) throw new DatabaseError('Failed to update invoice', { originalError: error });
    return data;
  }

  async markPaid(id: number): Promise<InvoiceDetail> {
    const { data, error } = await (db() as any).rpc('mark_invoice_paid', { p_id_factura: id });
    if (error) throw new DatabaseError('Failed to mark invoice as paid', { originalError: error });
    return data;
  }
}
```

- [ ] **Step 2: Write the list/create route**

Create `src/app/api/invoicing/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError } from '@/lib/api/error-handler';
import { InvoicingAdapter } from '@/lib/database/adapters/invoicing-adapter';

async function getInvoicesHandler(request: NextRequest) {
  const idPedidoParam = request.nextUrl.searchParams.get('id_pedido');
  const idPedido = idPedidoParam ? parseInt(idPedidoParam, 10) : undefined;

  const adapter = new InvoicingAdapter();
  const invoices = await adapter.listInvoices(idPedido);
  return ApiResponse.success(invoices);
}

async function postInvoiceHandler(request: NextRequest) {
  const body = await request.json();
  const idPedido = parseInt(body.id_pedido, 10);
  if (isNaN(idPedido)) throw new ValidationError('id_pedido es requerido y debe ser numérico');
  const diasVencimiento = body.dias_vencimiento ? parseInt(body.dias_vencimiento, 10) : 14;

  const adapter = new InvoicingAdapter();
  const invoice = await adapter.createFromOrder(idPedido, diasVencimiento);
  return ApiResponse.success(invoice);
}

export const GET = withErrorHandling(getInvoicesHandler);
export const POST = withErrorHandling(postInvoiceHandler);
```

- [ ] **Step 3: Write the detail/update route**

Create `src/app/api/invoicing/[id]/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { ValidationError, NotFoundError } from '@/lib/api/error-handler';
import { InvoicingAdapter } from '@/lib/database/adapters/invoicing-adapter';

async function getInvoiceHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const adapter = new InvoicingAdapter();
  const detail = await adapter.getInvoiceDetail(id);
  if (!detail) throw new NotFoundError('Factura no encontrada');
  return ApiResponse.success(detail);
}

async function patchInvoiceHandler(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw new ValidationError('id debe ser numérico');

  const body = await request.json();
  const adapter = new InvoicingAdapter();

  if (body.mark_paid === true) {
    const updated = await adapter.markPaid(id);
    return ApiResponse.success(updated);
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new ValidationError('items debe tener al menos una línea');
  }
  const descuento = parseFloat(body.descuento) || 0;
  const updated = await adapter.updateInvoice(id, body.items, descuento, body.notas);
  return ApiResponse.success(updated);
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return getInvoiceHandler(req, context);
  })(request);
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return patchInvoiceHandler(req, context);
  })(request);
}
```

- [ ] **Step 4: Verify**

Run `npm run type-check` — zero new errors from any of the 3 files.

Start the dev server if not running. `curl -s -X POST http://localhost:3000/api/invoicing -H "Content-Type: application/json" -d '{"id_pedido": <a real order id without an invoice yet>}'` — confirm `{"success":true,"data":{"factura":{...},"items":[...]}}`. `curl http://localhost:3000/api/invoicing` — confirm your new invoice appears in the list. `curl -X PATCH http://localhost:3000/api/invoicing/<id> -H "Content-Type: application/json" -d '{"mark_paid": true}'` — confirm `estado_calculado` becomes `"paid"`. `curl http://localhost:3000/api/invoicing/abc` — confirm a clean 400, not a 500. Delete the test invoice/items afterward and confirm via a follow-up `GET` returning nothing for it.

---

## Task 3: Frontend — real Invoicing list/detail/editor, wire "Generate Invoice"

**Files:**
- Modify: `src/app/(admin)/invoicing/page.tsx` (full rewrite of the current static placeholder)
- Modify: `src/app/(admin)/orders/page.tsx` (wire the existing decorative "Generate Invoice" button)

**Interfaces:**
- Consumes: `GET /api/invoicing`, `GET /api/invoicing/[id]`, `POST /api/invoicing`, `PATCH /api/invoicing/[id]` from Task 2.
- Produces: nothing consumed by later tasks except Task 4, which needs to know the invoice detail's exact shape — already fixed in Task 2's `InvoiceDetail` type, reused as-is.

This task does NOT create a separate custom hook file — given the whole page's data needs (list + selected detail + create + update + mark-paid) are used in exactly one place, keep the fetch logic as local component state directly in `invoicing/page.tsx`, matching this app's existing "Patrón A" style seen in `useCatalogData`/`useOrdersData` but inlined here since nothing else needs to reuse it (avoid a one-consumer hook file — YAGNI).

- [ ] **Step 1: Replace the Invoicing page**

Replace the entire contents of `src/app/(admin)/invoicing/page.tsx` with:

```tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InvoiceListItem, InvoiceDetail, InvoiceItem } from "@/lib/database/adapters/invoicing-adapter";

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editDescuento, setEditDescuento] = useState("0");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refetchList = () => {
    setLoading(true);
    setError(null);
    fetch("/api/invoicing")
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) { setError(result.error?.message || "Error cargando facturas"); return; }
        setInvoices(result.data ?? []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refetchList(); }, []);

  useEffect(() => {
    if (selectedId === null && invoices.length > 0) setSelectedId(invoices[0].id_factura);
  }, [invoices, selectedId]);

  useEffect(() => {
    if (selectedId === null) { setDetail(null); return; }
    setDetailLoading(true);
    setDetailError(null);
    fetch(`/api/invoicing/${selectedId}`)
      .then((r) => r.json())
      .then((result) => {
        if (!result.success) { setDetailError(result.error?.message || "Error cargando factura"); return; }
        setDetail(result.data);
        setEditItems(result.data.items);
        setEditDescuento(String(result.data.factura.descuento));
      })
      .catch((e) => setDetailError(String(e)))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch = !q || inv.numero_factura.toLowerCase().includes(q) || (inv.cliente_nombre || "").toLowerCase().includes(q) || (inv.cliente_email || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || inv.estado_calculado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const editSubtotal = editItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
  const editDescuentoNum = parseFloat(editDescuento) || 0;
  const editIva = (editSubtotal - editDescuentoNum) * 0.13;
  const editTotal = editSubtotal - editDescuentoNum + editIva;

  const updateItemField = (idx: number, field: "descripcion" | "cantidad" | "precio_unitario", value: string) => {
    setEditItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      if (field === "descripcion") return { ...it, descripcion: value };
      if (field === "cantidad") return { ...it, cantidad: Math.max(1, parseInt(value, 10) || 1) };
      return { ...it, precio_unitario: parseFloat(value) || 0 };
    }));
  };

  const addItem = () => {
    setEditItems((prev) => [...prev, { id_item: -Date.now(), descripcion: "", cantidad: 1, precio_unitario: 0, orden: prev.length }]);
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveChanges = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/invoicing/${detail.factura.id_factura}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems.map((it) => ({ descripcion: it.descripcion, cantidad: it.cantidad, precio_unitario: it.precio_unitario })),
          descuento: editDescuentoNum,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al guardar");
      setDetail(result.data);
      setEditItems(result.data.items);
      refetchList();
    } catch (e: any) {
      setSaveError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/invoicing/${detail.factura.id_factura}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_paid: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Error al marcar como pagada");
      setDetail(result.data);
      refetchList();
    } catch (e: any) {
      setSaveError(e.message || "Error al marcar como pagada");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-[110px] rounded-[2px]" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-2 h-[450px] rounded-[2px]" />
          <Skeleton className="lg:col-span-3 h-[450px] rounded-[2px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState title="Error cargando facturas" description={error} actionLabel="Reintentar" onAction={refetchList} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4">
      <PageHeader
        label="Finance"
        title="Invoicing"
        sub="Manage and preview customer invoices with IVA calculation."
        bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="flex flex-col gap-3">
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer, email..."
            className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
          />
        </div>
        <div className="flex items-center gap-3 bg-obsidian/40 border border-bone/10 p-4 rounded-[4px] backdrop-blur-md">
          <span className="text-[10px] text-bone/50 font-geist uppercase tracking-widest shrink-0">Status:</span>
          <div className="flex flex-wrap gap-2">
            {["all", "paid", "pending", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  statusFilter === s ? "bg-ember/10 text-ember border-ember/30 font-bold" : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <FloraGlass className="lg:col-span-2 flex flex-col !overflow-visible">
          <div className="px-6 py-4 border-b border-bone/10">
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">All Invoices</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto tactical-scrollbar flex flex-col">
            {filtered.map((inv) => (
              <button
                key={inv.id_factura}
                onClick={() => setSelectedId(inv.id_factura)}
                className={`w-full text-left px-6 py-5 border-b border-bone/5 transition-all hover:bg-bone/5 ${
                  selectedId === inv.id_factura ? "bg-bone/10 border-l-[3px] border-l-ember" : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-geist text-[10px] font-bold tracking-widest text-bone/50 uppercase">{inv.numero_factura}</span>
                  <StatusBadge status={inv.estado_calculado} />
                </div>
                <p className="text-lg text-bone font-fraunces font-bold mb-1">{inv.cliente_nombre || "Sin nombre"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-bone/50 uppercase tracking-widest">Due {new Date(inv.fecha_vencimiento).toLocaleDateString()}</span>
                  <span className="font-geist text-sm text-bone font-medium">${Number(inv.total).toFixed(2)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-6 py-10 text-center text-xs text-bone/40 font-geist uppercase tracking-widest">No invoices match filters.</p>
            )}
          </div>
        </FloraGlass>

        {!detail && !detailLoading && (
          <FloraGlass className="lg:col-span-3 flex items-center justify-center p-8">
            <EmptyState title="No Invoice Selected" description="Select an invoice from the list, or generate one from an order's detail panel." />
          </FloraGlass>
        )}

        {detailLoading && <Skeleton className="lg:col-span-3 h-[450px] rounded-[2px]" />}

        {detailError && !detailLoading && (
          <FloraGlass className="lg:col-span-3 p-8">
            <p className="text-sm text-ember font-geist">{detailError}</p>
          </FloraGlass>
        )}

        {detail && !detailLoading && (
          <FloraGlass className="lg:col-span-3 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-8 border-b border-bone/10 pb-6">
                <div>
                  <p className="font-geist text-[10px] uppercase tracking-widest text-bone/50 font-bold mb-2">{detail.factura.numero_factura}</p>
                  <h2 className="font-fraunces text-4xl font-bold text-bone">{detail.factura.cliente_nombre}</h2>
                  <p className="text-sm text-bone/60 font-geist mt-1">{detail.factura.cliente_email}</p>
                </div>
                <StatusBadge status={detail.factura.estado_calculado} />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Issued</p><p className="text-bone font-geist">{new Date(detail.factura.fecha_emision).toLocaleDateString()}</p></div>
                <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Due</p><p className="text-bone font-geist">{new Date(detail.factura.fecha_vencimiento).toLocaleDateString()}</p></div>
                <div><p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">Order</p><p className="text-bone font-geist">#{detail.factura.id_pedido}</p></div>
              </div>

              <div className="bg-obsidian/90 border border-bone/5 p-6 rounded-[2px] mb-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">Items</p>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-[10px] text-ember font-geist uppercase tracking-widest hover:text-ember/80">
                    <Plus size={12} /> Add Line
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {editItems.map((item, idx) => (
                    <div key={item.id_item} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={item.descripcion}
                        onChange={(e) => updateItemField(idx, "descripcion", e.target.value)}
                        placeholder="Description"
                        className="col-span-6 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <input
                        type="number" min="1" value={item.cantidad}
                        onChange={(e) => updateItemField(idx, "cantidad", e.target.value)}
                        className="col-span-2 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <input
                        type="number" min="0" step="0.01" value={item.precio_unitario}
                        onChange={(e) => updateItemField(idx, "precio_unitario", e.target.value)}
                        className="col-span-3 px-2 py-1.5 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist focus:outline-none focus:border-ember"
                      />
                      <button type="button" onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-bone/40 hover:text-ember">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="font-geist text-bone/80">${editSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px]">Discount</span>
                      <input
                        type="number" min="0" step="0.01" value={editDescuento}
                        onChange={(e) => setEditDescuento(e.target.value)}
                        className="w-24 px-2 py-1 bg-bone/5 border border-bone/20 rounded-[2px] text-bone text-xs font-geist text-right focus:outline-none focus:border-ember"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-bone/40 font-geist uppercase tracking-widest text-[10px]">Tax (13% IVA)</span>
                      <span className="font-geist text-bone/80">${editIva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-bone/10">
                      <span className="font-fraunces font-bold text-bone text-lg uppercase tracking-tight">Total</span>
                      <span className="font-fraunces font-bold text-ember text-2xl">${editTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {saveError && <p className="text-xs text-ember font-geist mb-4">{saveError}</p>}
            </div>

            <div className="flex gap-4 border-t border-bone/10 pt-6 mt-auto">
              <button
                type="button" onClick={saveChanges} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {detail.factura.estado_calculado !== "paid" && (
                <button
                  type="button" onClick={markPaid} disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#7ddb7d]/50 text-[#7ddb7d] rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#7ddb7d]/10 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Mark Paid
                </button>
              )}
              <a
                href={`/api/invoicing/${detail.factura.id_factura}/pdf`}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </FloraGlass>
        )}
      </div>
    </div>
  );
}
```

Note: `StatusBadge` needs to recognize `"paid"`/`"pending"`/`"overdue"` — check `src/components/figma-shared/Common.tsx`'s existing status map before assuming; if any of these three keys is missing from its map, add it there (don't invent a separate badge component) using the same visual pattern already used for the existing statuses (`in-stock`/`shipped`/`paid` already map to the green treatment — `paid` likely already works; confirm `pending` and `overdue` render sensibly, adding them to the map with `pending` → the existing amber/warning treatment and `overdue` → the existing red/ember treatment if they currently fall through to an unstyled default).

- [ ] **Step 2: Wire the "Generate Invoice" button on Orders**

In `src/app/(admin)/orders/page.tsx`, find the decorative button (currently no `onClick`):
```tsx
                <button className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all">
                  <FileText size={14} />
                  Generate Invoice
                </button>
```
Add local state near the other `useState` calls in this component:
```typescript
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
```
Replace the button with a working version that creates the invoice and navigates to it:
```tsx
                <button
                  type="button"
                  disabled={generatingInvoice}
                  onClick={async () => {
                    setGeneratingInvoice(true);
                    try {
                      const res = await fetch("/api/invoicing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id_pedido: selected.id_pedido }),
                      });
                      const result = await res.json();
                      if (!result.success) throw new Error(result.error?.message || "Error al generar la factura");
                      window.location.href = "/invoicing";
                    } catch (e: any) {
                      alert(e.message || "Error al generar la factura");
                    } finally {
                      setGeneratingInvoice(false);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-bone/30 text-bone rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-bone hover:text-obsidian hover:border-bone transition-all disabled:opacity-50"
                >
                  <FileText size={14} />
                  {generatingInvoice ? "Generating..." : "Generate Invoice"}
                </button>
```
(This is a plain full-page navigation via `window.location.href` rather than Next.js's `useRouter().push` — check whether `useRouter` from `next/navigation` is already imported in this file; if it is, use `router.push("/invoicing")` instead for a client-side transition. If it isn't already imported, the plain `window.location.href` version above is fine — don't add a new import just for this one navigation.)

- [ ] **Step 3: Verify**

Run `npm run type-check` — zero new errors in either file.

Open `/orders`, select an order that doesn't have an invoice yet, click "Generate Invoice" — confirm it navigates to `/invoicing` and the new invoice is selected/visible with the order's real line items (correct product names and sizes, not raw SKU ids) and correct subtotal/iva/total. Edit a line's price, add a new line (e.g. a $0 "Bundle discount" style line, or use the Discount field directly), click "Save Changes" — confirm the totals update and persist (reload the page, re-select the invoice, confirm the edit stuck). Click "Mark Paid" — confirm the badge updates to Paid and the "Mark Paid" button disappears. Go back to `/orders`, select the same order again, click "Generate Invoice" again — confirm you get the friendly "ya tiene factura" error via `alert()`, not a crash. Clean up your test invoice via direct Supabase REST deletion afterward, confirmed with a follow-up query.

---

## Task 4: PDF generation

**Files:**
- Modify: `package.json` (add `@react-pdf/renderer`)
- Create: `src/components/invoicing/InvoicePdfDocument.tsx`
- Create: `src/app/api/invoicing/[id]/pdf/route.ts`

**Interfaces:**
- Consumes: `InvoicingAdapter.getInvoiceDetail` from Task 2, `InvoiceDetail` type.
- Produces: `GET /api/invoicing/[id]/pdf` → binary PDF response with `Content-Type: application/pdf`.

- [ ] **Step 1: Install the dependency**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Write the PDF document component**

Create `src/components/invoicing/InvoicePdfDocument.tsx`:

```tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceDetail } from "@/lib/database/adapters/invoicing-adapter";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, borderBottom: "2 solid #F46734", paddingBottom: 16 },
  brand: { fontSize: 18, fontWeight: 700 },
  brandSub: { fontSize: 8, color: "#666", marginTop: 4 },
  invoiceTitle: { fontSize: 16, fontWeight: 700, textAlign: "right" },
  invoiceNumber: { fontSize: 10, color: "#F46734", textAlign: "right", marginTop: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaLabel: { fontSize: 8, color: "#999", textTransform: "uppercase", marginBottom: 2 },
  metaValue: { fontSize: 11 },
  table: { marginBottom: 16 },
  tableHeaderRow: { flexDirection: "row", borderBottom: "1 solid #ccc", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5 solid #eee" },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colPrice: { width: "17.5%", textAlign: "right" },
  colTotal: { width: "17.5%", textAlign: "right" },
  headerCell: { fontSize: 8, color: "#999", textTransform: "uppercase" },
  totalsBox: { alignItems: "flex-end", marginTop: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 4 },
  totalsLabel: { fontSize: 9, color: "#666" },
  totalsValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginTop: 6, paddingTop: 6, borderTop: "1 solid #1a1a1a" },
  grandTotalLabel: { fontSize: 12, fontWeight: 700 },
  grandTotalValue: { fontSize: 14, fontWeight: 700, color: "#F46734" },
});

export function InvoicePdfDocument({ detail }: { detail: InvoiceDetail }) {
  const { factura, items } = detail;
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>BRUMAFIGHTWEAR</Text>
            <Text style={styles.brandSub}>San José, Costa Rica · brumafightwear.cr</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{factura.numero_factura}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaValue}>{factura.cliente_nombre}</Text>
            <Text style={{ ...styles.metaValue, fontSize: 9, color: "#666" }}>{factura.cliente_email}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Issued</Text>
            <Text style={styles.metaValue}>{new Date(factura.fecha_emision).toLocaleDateString()}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Due</Text>
            <Text style={styles.metaValue}>{new Date(factura.fecha_vencimiento).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={{ ...styles.headerCell, ...styles.colDesc }}>Item</Text>
            <Text style={{ ...styles.headerCell, ...styles.colQty }}>Qty</Text>
            <Text style={{ ...styles.headerCell, ...styles.colPrice }}>Unit Price</Text>
            <Text style={{ ...styles.headerCell, ...styles.colTotal }}>Total</Text>
          </View>
          {items.map((item) => (
            <View key={item.id_item} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.descripcion}</Text>
              <Text style={styles.colQty}>{item.cantidad}</Text>
              <Text style={styles.colPrice}>${Number(item.precio_unitario).toFixed(2)}</Text>
              <Text style={styles.colTotal}>${(item.cantidad * Number(item.precio_unitario)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>${Number(factura.subtotal).toFixed(2)}</Text>
          </View>
          {Number(factura.descuento) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>-${Number(factura.descuento).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax (13% IVA)</Text>
            <Text style={styles.totalsValue}>${Number(factura.iva).toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${Number(factura.total).toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Write the PDF route**

Create `src/app/api/invoicing/[id]/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicingAdapter } from "@/lib/database/adapters/invoicing-adapter";
import { InvoicePdfDocument } from "@/components/invoicing/InvoicePdfDocument";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: { message: "id debe ser numérico" } }, { status: 400 });
  }

  const adapter = new InvoicingAdapter();
  const detail = await adapter.getInvoiceDetail(id);
  if (!detail) {
    return NextResponse.json({ success: false, error: { message: "Factura no encontrada" } }, { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoicePdfDocument detail={detail} />);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${detail.factura.numero_factura}.pdf"`,
    },
  });
}
```

Note: this route file uses JSX (`<InvoicePdfDocument .../>`), so it must have a `.tsx` extension, not `.ts` — name it `src/app/api/invoicing/[id]/pdf/route.tsx`.

- [ ] **Step 4: Verify**

Run `npm run type-check` — zero new errors.

With an existing test invoice (create one via `POST /api/invoicing` if needed), `curl -s -o test-invoice.pdf http://localhost:3000/api/invoicing/<id>/pdf` — confirm the downloaded file starts with `%PDF-` (check via `head -c 5 test-invoice.pdf` or open it) and is a valid, non-empty PDF. Open `/invoicing` in the browser, select an invoice, click "Download PDF" — confirm a real PDF downloads with the correct invoice number, customer, line items, and totals matching what's shown on screen. Delete `test-invoice.pdf` and any test invoice data afterward.

---

## Self-Review Notes

- **Spec coverage**: 1:1 order-to-invoice (Task 1's `UNIQUE` constraint + `create_invoice_from_order`'s existence check), real sequential consecutivo with no gaps/duplicates (Task 1's `factura_consecutivo` atomic counter), Paid/Pending/Overdue with due date (Task 1's `estado` + derived `estado_calculado`, Task 3's status filter chips), editable line items seeded from the order but independently mutable including adding lines and a discount (Task 1's `update_invoice` + Task 3's item editor), downloadable PDF (Task 4) — every design decision from the approved design has a task.
- **Type consistency checked**: `InvoiceDetail`/`InvoiceItem`/`InvoiceListItem` are defined once in Task 2's adapter file and imported (not redefined) by Task 3's page and Task 4's PDF component/route — no drift between tasks.
- **Explicitly out of scope** (matches your approved design): email sending to the client — the old mock's "Send to Client" button is not resurrected in this plan; a future plan can add it once a mail provider is chosen. Per-order-line discounts (only a single header-level discount amount, matching your bundle-pricing description of "one final discount at the end," not per-item discounts).
