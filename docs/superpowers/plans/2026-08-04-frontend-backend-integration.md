# Frontend-Backend Integration — Iteración 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar 6 páginas admin (dashboard, inventory, movements, orders, catalog, statistics-placeholder) a datos reales de Supabase, eliminando el patrón de `supabase.rpc()` directo y el parámetro `projectId` vestigial, a favor de hooks + rutas API + adapters ya existentes.

**Architecture:** Cada página sigue: `hook (fetch a /api/*) → loading/error/data → EmptyState en error`. Los adapters llaman stored procedures `SECURITY DEFINER` del schema single-project deployado (`supabase/migrations/20260710045923_initial_schema.sql`). Dos piezas de backend nuevas (dashboard) se construyen sobre SPs ya existentes.

**Tech Stack:** Next.js 14 (App Router), React hooks, Supabase JS client, TypeScript (proyecto usa `any` liberalmente en la capa de datos — se sigue esa convención, no se introduce tipado estricto nuevo).

## Global Constraints

- No se usa `projectId` en ningún hook/ruta/adapter tocado — el schema single-project no tiene esa columna.
- `EmptyState` (`src/components/ui/EmptyState.tsx`) es el único componente de error UI — no se crea uno nuevo.
- Patrón de error por página: `if (error) return <EmptyState title="Error" description={error} actionLabel="Reintentar" onAction={refetch} />` antes del render normal.
- No se agregan fallbacks a mock data en error — si falla, se muestra el error real.
- No hay suite de tests en el proyecto — verificación es manual vía navegador, un paso por tarea.
- Todas las stored procedures del schema son `SECURITY DEFINER` — RLS no es bloqueante, no se tocan políticas RLS en este plan.
- Rutas API nuevas responden con el envelope `{ success, data, ... }` vía `ApiResponse` (`src/lib/api/response-builder.ts`) cuando sea código nuevo; rutas existentes modificadas conservan su envelope actual (`{ data }` / `{ error }`) para no romper el contrato ya usado por su hook.

---

### Task 1: Orders — quitar `projectId`, conectar lista real

**Files:**
- Modify: `src/hooks/useOrdersData.ts`
- Modify: `src/app/(admin)/orders/page.tsx`

**Interfaces:**
- Consumes: `OrdersAdapter.listOrders()` (ya existe, sin cambios) vía `/api/orders` (ya existe, sin cambios — nunca leyó `projectId`)
- Produces: `useOrdersData(options: UseOrdersDataOptions): { orders: Order[], loading: boolean, error: string | null }` — `Order` importado de `@/lib/database/adapters/orders-adapter` (campos: `id_pedido, fecha, id_estado, estado_nombre, id_cliente, cliente_nombre, cliente_email, total, id_metodo_pago, metodo_pago_nombre, items_count`)

- [ ] **Step 1: Quitar `projectId` de `useOrdersData`**

Editar `src/hooks/useOrdersData.ts`:

```typescript
import { useEffect, useState } from 'react';
import type { Order } from '@/lib/database/adapters/orders-adapter';

interface UseOrdersDataOptions {
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface UseOrdersDataResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrdersData(options: UseOrdersDataOptions = {}): UseOrdersDataResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    fetch(`/api/orders?${params.toString()}`)
      .then(res => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data);
        } else {
          setError(result.error || 'Error loading orders');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(options), refreshKey]);

  return { orders, loading, error, refetch };
}
```

- [ ] **Step 2: Reemplazar el mock de `orders/page.tsx` por datos reales**

Editar `src/app/(admin)/orders/page.tsx` — reemplazar líneas 1-30 (imports + array `ORDERS`) por:

```typescript
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Package,
  ChevronRight,
  Truck,
  FileText
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrdersData } from "@/hooks/useOrdersData";
import type { Order } from "@/lib/database/adapters/orders-adapter";
```

Reemplazar el cuerpo de `export default function OrdersPage()` (desde `const [selected, setSelected] = useState(ORDERS[0]);` hasta el `useEffect` del timer de loading) por:

```typescript
export default function OrdersPage() {
  const { orders, loading, error, refetch } = useOrdersData({ limit: 50 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (selectedId === null && orders.length > 0) {
      setSelectedId(orders[0].id_pedido);
    }
  }, [orders, selectedId]);
```

Reemplazar el bloque `const filtered = useMemo(...)` para operar sobre `orders` reales:

```typescript
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || String(o.id_pedido).includes(q)
        || (o.cliente_nombre || '').toLowerCase().includes(q)
        || (o.cliente_email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter.size === 0 || statusFilter.has((o.estado_nombre || '').toLowerCase());
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, orders]);

  const selected = filtered.find(o => o.id_pedido === selectedId) ?? filtered[0];
```

Reemplazar el bloque `if (loading) { ... }` para usar el `loading` real del hook (mismo JSX de skeleton, sin cambios de contenido, solo la condición ya viene del hook).

Agregar, inmediatamente después del bloque de loading y antes del `return` principal:

```typescript
  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando pedidos"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }
```

En el JSX principal, reemplazar cada referencia a `order.id` / `o.id` por `order.id_pedido` (mostrado como `` `#${order.id_pedido}` ``), `order.customer`/`o.customer` por `order.cliente_nombre`, `order.email` por `order.cliente_email`, `order.status`/`o.status` por `(order.estado_nombre || '').toLowerCase()`, `order.total` sin cambios, `order.items` por `order.items_count`, `order.date` por `new Date(order.fecha).toLocaleDateString()`. El bloque `{selected.products.map(...)}` (líneas ~213-223 del original, sección "Requisition Details") se elimina — el desglose de productos se agrega en el Task 2 vía una llamada aparte, no está disponible en la lista.

- [ ] **Step 3: Verificar en navegador**

Levantar el dev server, navegar a `/orders`. Confirmar: skeleton breve, luego lista real de pedidos (o `EmptyState` si la tabla `pedido` está vacía — no es un error, es dataset vacío legítimo; en ese caso verificar que no aparezca como "Error"). Abrir la consola y confirmar cero errores nuevos. Forzar un error deteniendo la red y confirmar que aparece el `EmptyState` de error con botón "Reintentar".

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useOrdersData.ts "src/app/(admin)/orders/page.tsx"
git commit -m "feat: connect orders page to real data, drop vestigial projectId"
```

---

### Task 2: Orders — ruta de detalle + panel de desglose real

**Files:**
- Create: `src/app/api/orders/[id]/route.ts`
- Modify: `src/app/(admin)/orders/page.tsx`

**Interfaces:**
- Consumes: `OrdersAdapter.getOrderDetails(id: number): Promise<any>` (ya existe, retorna `{ pedido, cliente, items: [{ id_pedido_detalle, id_pedido, id_producto_talla, cantidad, precio_unitario }] }`)
- Produces: `GET /api/orders/:id` → `{ success: true, data: { pedido, cliente, items } }`

**Nota de alcance:** `pedidodetalle` solo tiene `id_producto_talla` (FK), no el nombre del producto — la SP `get_order_details` no hace ese join. El panel muestra SKU/cantidad/precio unitario, no el nombre del producto. Documentado, no es un bug — es el dato real disponible hoy.

- [ ] **Step 1: Crear la ruta de detalle**

Crear `src/app/api/orders/[id]/route.ts`:

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

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    return getOrderDetailHandler(req, context)
  })(request)
}
```

(Mismo patrón que `src/app/api/inventory/items/[id]/route.ts` — `withErrorHandling` espera un handler de un solo argumento, así que la ruta dinámica se envuelve con una función intermedia que cierra sobre `context`.)

- [ ] **Step 2: Verificar la ruta manualmente**

Levantar el dev server. Con un `id_pedido` real de la base (obtenerlo del listado de `/orders` o de la respuesta de `/api/orders`), navegar en el navegador a `/api/orders/<id>` y confirmar que responde JSON con `success: true` y `data.items` como array.

- [ ] **Step 3: Wire del panel de detalle en la página**

Editar `src/app/(admin)/orders/page.tsx` — agregar estado y fetch de detalle. Insertar después del `useEffect` que setea `selectedId`:

```typescript
  const [orderDetail, setOrderDetail] = useState<{ items: Array<{ id_producto_talla: number; cantidad: number; precio_unitario: number }> } | null>(null);

  useEffect(() => {
    if (!selectedId) { setOrderDetail(null); return; }
    fetch(`/api/orders/${selectedId}`)
      .then(res => res.json())
      .then((result) => {
        if (result.success) setOrderDetail(result.data);
      })
      .catch(() => setOrderDetail(null));
  }, [selectedId]);
```

Reemplazar el bloque "Requisition Details" (removido en Task 1) por:

```typescript
                <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-4">Requisition Details</p>
                <div className="space-y-2">
                  {(orderDetail?.items ?? []).map((item) => (
                    <div key={item.id_producto_talla} className="flex items-center gap-4 py-3 px-4 bg-obsidian/60 border border-bone/5 rounded-[2px]">
                      <div className="w-8 h-8 bg-bone/5 rounded-[2px] border border-bone/10 flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-bone/40" />
                      </div>
                      <span className="text-sm text-bone font-geist flex-1">SKU #{item.id_producto_talla}</span>
                      <span className="text-xs text-bone/50 font-geist">x{item.cantidad}</span>
                      <span className="text-sm text-bone font-geist">${Number(item.precio_unitario).toFixed(2)}</span>
                    </div>
                  ))}
                  {orderDetail === null && (
                    <p className="text-xs text-bone/40 font-geist">Cargando detalle...</p>
                  )}
                </div>
```

- [ ] **Step 4: Verificar en navegador**

Navegar a `/orders`, seleccionar distintos pedidos en la lista izquierda, confirmar que el panel derecho muestra items reales (SKU/cantidad/precio) que cambian según el pedido seleccionado. Sin errores en consola.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/orders/[id]/route.ts "src/app/(admin)/orders/page.tsx"
git commit -m "feat: add order detail route, wire real line items in orders panel"
```

---

### Task 3: Catalog — quitar `projectId`, conectar catálogo real (simplificado)

**Files:**
- Modify: `src/hooks/useCatalogData.ts`
- Modify: `src/lib/database/adapters/catalog-adapter.ts`
- Modify: `src/app/api/catalog/route.ts`
- Modify: `src/app/(admin)/catalog/page.tsx`

**Interfaces:**
- Consumes: `listCatalogProducts()`, `listCategoriesForFilter()` (ya existen)
- Produces: `useCatalogData(): { products: CatalogProduct[], categories: CategoryForFilter[], loading, error, refetch, toggleStatus, deleteProduct }` — `CatalogProduct` sin `price`/`sizes` (no existen en la SP actual, decisión ya tomada)

**Nota de alcance:** `list_products` no devuelve precio ni tallas (viven en `productovariante`/`productotallastock`). La card de catálogo se simplifica: nombre, categoría, stock total, estado — sin precio, sin chips de talla.

- [ ] **Step 1: Quitar `projectId` del adapter**

Editar `src/lib/database/adapters/catalog-adapter.ts` — quitar el parámetro `_projectId` de las tres funciones de lectura:

```typescript
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
    variante_count: Number(p.variante_count || 0),
    stock_total: Number(p.stock_total || 0),
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
  return [];
}
```

Y quitar `_projectId` del parámetro de `createCatalogProduct`:

```typescript
export async function createCatalogProduct(input: CreateCatalogProductInput): Promise<CatalogProduct> {
```

(sin otros cambios en el cuerpo de esa función).

- [ ] **Step 2: Quitar `projectId` de la ruta**

Editar `src/app/api/catalog/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  listCatalogProducts,
  listCategoriesForFilter,
  listProductLinesForFilter,
  toggleCatalogProductStatus,
  deleteCatalogProduct,
  createCatalogProduct,
} from '@/lib/database/adapters/catalog-adapter';

export async function GET() {
  try {
    const [products, categories, productLines] = await Promise.all([
      listCatalogProducts(),
      listCategoriesForFilter(),
      listProductLinesForFilter(),
    ]);
    return NextResponse.json({ data: products, categories, productLines });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const data = await createCatalogProduct(input);
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
    await deleteCatalogProduct(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Quitar `projectId` del hook**

Editar `src/hooks/useCatalogData.ts`:

```typescript
import { useEffect, useState } from 'react';
import type {
  CatalogProduct,
  CategoryForFilter,
  ProductLineForFilter,
} from '@/lib/database/adapters/catalog-adapter';

interface UseCatalogDataResult {
  products: CatalogProduct[];
  categories: CategoryForFilter[];
  productLines: ProductLineForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export function useCatalogData(): UseCatalogDataResult {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryForFilter[]>([]);
  const [productLines, setProductLines] = useState<ProductLineForFilter[]>([]);
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

  return {
    products,
    categories,
    productLines,
    loading,
    error,
    refetch,
    toggleStatus,
    deleteProduct,
  };
}
```

- [ ] **Step 4: Reemplazar el mock en `catalog/page.tsx`**

Editar `src/app/(admin)/catalog/page.tsx` — reemplazar los imports y el array `CATALOG` (líneas 1-24) por:

```typescript
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Eye
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogData } from "@/hooks/useCatalogData";

function catalogStatus(stockTotal: number): "in-stock" | "low" | "out" {
  if (stockTotal <= 0) return "out";
  if (stockTotal <= 10) return "low";
  return "in-stock";
}
```

Eliminar la función `CollectionFilterBar` y `SizeFilterBar` completas (ya no hay datos de colección/talla a nivel de producto). Reemplazar el cuerpo de `export default function CatalogPage()` por:

```typescript
export default function CatalogPage() {
  const { products, categories, loading, error, refetch } = useCatalogData();
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  function toggleCat(c: string) { setCatFilter(prev => { const next = new Set(prev); next.has(c) ? next.delete(c) : next.add(c); return next; }); }

  const categoryNames = categories.map(c => c.name);

  const filtered = useMemo(() => products.filter(p => {
    const matchCat = catFilter.size === 0 || (p.category_name && catFilter.has(p.category_name));
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category_name || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  }), [products, catFilter, search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-9 flex flex-col gap-8">
            <Skeleton className="w-full h-12 rounded-[2px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-obsidian/40 border border-bone/10 p-5 rounded-[4px] flex flex-col gap-4">
                  <Skeleton className="w-full aspect-[3/3.5] rounded-[2px]" />
                  <Skeleton className="w-24 h-4 rounded-[2px]" />
                  <Skeleton className="w-full h-6 rounded-[2px]" />
                  <Skeleton className="w-16 h-8 rounded-[2px]" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="lg:col-span-3 h-[400px] rounded-[4px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando catálogo"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Product Line"
        title="Catalog"
        sub="Your full lineup — styled for the street and the mat."
        actionLabel="+ Add Product"
        actionIcon={<Plus size={16} />}
        bgImage="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-9 flex flex-col gap-4">

          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/40 group-focus-within:text-ember transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search catalog products..."
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/30 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(product => (
              <FloraGlass
                key={product.id}
                className="group cursor-pointer hover:border-ember/40 transition-colors"
              >
                <div className="relative overflow-hidden bg-obsidian/80" style={{ aspectRatio: "3/3.5" }}>
                  <ImageWithFallback
                    src="/imports/image-3.png"
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <StatusBadge status={catalogStatus(product.stock_total)} />
                  </div>

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest font-geist">
                      <Eye size={14} />
                      View Details
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mb-1">{product.category_name || 'Sin categoría'}</p>
                  <h3 className="font-fraunces text-lg font-bold text-bone leading-tight mb-2 truncate">{product.name}</h3>
                  <div className="flex items-end justify-between mb-4">
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{product.stock_total} units</p>
                    <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{product.variante_count} variantes</p>
                  </div>
                </div>
              </FloraGlass>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  title="Sector Clear"
                  description="No catalog products match your search or filter parameters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch("");
                    setCatFilter(new Set());
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-3 lg:sticky lg:top-[120px] flex flex-col gap-6 bg-obsidian/40 border border-bone/10 p-6 rounded-[4px] backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-bone/40 font-geist uppercase tracking-[0.2em] font-bold">Category:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCatFilter(new Set())}
                className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                  catFilter.size === 0
                    ? "bg-ember/10 text-ember border-ember/30 font-bold"
                    : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                }`}
              >
                All
              </button>
              {categoryNames.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`px-3 py-1 rounded-[2px] text-[10px] uppercase tracking-widest font-geist transition-all border ${
                    catFilter.has(c)
                      ? "bg-ember/10 text-ember border-ember/30 font-bold"
                      : "bg-bone/5 border-bone/20 text-bone/60 hover:border-bone/50 hover:text-bone"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verificar en navegador**

Navegar a `/catalog`. Confirmar: skeleton breve, luego cards reales con nombre/categoría/stock (sin precio, sin chips de talla). Filtro de categoría funciona. Sin errores en consola. Forzar error de red y confirmar `EmptyState` con "Reintentar".

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCatalogData.ts src/lib/database/adapters/catalog-adapter.ts src/app/api/catalog/route.ts "src/app/(admin)/catalog/page.tsx"
git commit -m "feat: connect catalog page to real data, simplify card (no price/sizes), drop projectId"
```

---

### Task 4: Inventory — arreglar ruta rota, quitar `projectId`, conectar página real

**Files:**
- Modify: `src/app/api/inventory/items/route.ts`
- Delete: `src/app/api/inventory/grouped/route.ts`
- Modify: `src/hooks/useInventory.ts`
- Modify: `src/app/(admin)/inventory/page.tsx`

**Interfaces:**
- Consumes: `InventoryAdapter.getInventoryItems(_projectId, options): Promise<InventoryItemExtended[]>` (sin cambios de firma — su primer parámetro ya es `_projectId?: string`, ignorado en el cuerpo; se le pasa `undefined` explícito desde la ruta en vez de un valor real)
- Produces: `GET /api/inventory/items` sin requerir `projectId`, responde `ApiResponse.paginated(items, total, page, limit)`

**Nota de alcance — por qué no se toca `inventory-adapter.ts`:** `getInventoryItems` ya recibe `_projectId?: string` sin usarlo en el cuerpo (confirmado leyendo el archivo). Cambiar su firma para quitar ese parámetro rompería a sus otros dos llamadores internos en la misma clase (`getInventoryItemById` y `getInventoryAlerts`, que hacen `this.getInventoryItems(projectId, {...})` con dos argumentos) — esas dos rutas no están en el alcance de esta iteración, así que tocar su firma sería un cambio innecesario con riesgo de romper código fuera de alcance. La forma más chica seguirá: dejar el adapter intacto, y que la ruta le pase `undefined` en vez de un `projectId` real.

**Nota — bug encontrado:** `src/app/api/inventory/grouped/route.ts` llama `list_inventory_grouped_by_product` con `{ p_project_id: projectId }`, pero esa SP no acepta parámetros (`list_inventory_grouped_by_product()`), y además mapea campos (`row.product_id`, `row.product_name`, etc.) que no existen en las columnas reales que devuelve la SP (`id_producto`, `producto_nombre`, etc.). Esta ruta está rota hoy — nadie la usa porque `inventory/page.tsx` llama la SP directo. Se elimina en vez de arreglarla: `/api/inventory/items` (que sí funciona, vía el adapter) cubre la misma necesidad con datos planos, que es justamente la forma que la tabla de la UI ya espera.

- [ ] **Step 1: Quitar `projectId` de la ruta `/api/inventory/items`**

Editar `src/app/api/inventory/items/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api/middleware'
import { ApiResponse } from '@/lib/api/response-builder'
import { InventoryAdapter } from '@/lib/database/adapters/inventory-adapter'
import { ValidationError } from '@/lib/api/error-handler'

async function getInventoryItemsHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const includeZeroStock = searchParams.get('includeZeroStock') === 'true' || searchParams.get('include_zero_stock') === 'true'
  const categoryFilter = searchParams.get('categoryFilter') || searchParams.get('category_filter')
  const categoryId = categoryFilter ? parseInt(categoryFilter, 10) : null

  if (limit < 1 || limit > 200) {
    throw new ValidationError('limit debe estar entre 1 y 200')
  }
  if (offset < 0) {
    throw new ValidationError('offset debe ser mayor o igual a 0')
  }

  const adapter = new InventoryAdapter()
  const items = await adapter.getInventoryItems(undefined, {
    includeZeroStock,
    categoryFilter: categoryId,
    limit,
    offset
  })

  const totalCount = items.length
  const page = Math.floor(offset / limit) + 1

  return ApiResponse.paginated(
    items,
    totalCount,
    page,
    limit
  )
}

export const GET = withErrorHandling(getInventoryItemsHandler)
```

(Ya no se usa `withProjectValidation` — la ruta pasa de requerir `projectId` a no requerirlo en absoluto.)

- [ ] **Step 3: Eliminar la ruta rota `/api/inventory/grouped`**

```bash
git rm src/app/api/inventory/grouped/route.ts
```

- [ ] **Step 4: Redirigir `useInventory.fetchInventory` a `/api/inventory/items`**

Editar `src/hooks/useInventory.ts` — reemplazar el bloque `fetchInventory` (líneas ~73-107):

```typescript
  const fetchInventory = async () => {
    setLoadingInventory(true)
    setError(null)
    try {
      const response = await fetch(`/api/inventory/items?limit=100&includeZeroStock=true`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || result.error || 'Error cargando inventario')
        setInventory([])
        setTotalInventory(0)
        return
      }
      if (result.success) {
        const items = result.data || []
        setInventory(Array.isArray(items) ? items : [])
        setTotalInventory(items.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando inventario')
      setInventory([])
      setTotalInventory(0)
    } finally {
      setLoadingInventory(false)
    }
  }
```

No se tocan las demás funciones del hook (`fetchMovements`, `fetchInventoryItem`, `createInventoryItem`, etc.) — siguen gateadas por `projectId` como antes; ninguna es consumida por `inventory/page.tsx` hoy, así que no hay regresión visible. Quedan documentadas como pendientes en `FINDINGS.md` si se conectan más adelante.

- [ ] **Step 5: Reemplazar el mock/RPC directo en `inventory/page.tsx`**

Editar `src/app/(admin)/inventory/page.tsx` — reemplazar los imports (líneas 1-14):

```typescript
"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Fauna } from "@/components/ui/Fauna";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { useInventory } from "@/hooks/useInventory";
```

Quitar la constante `FALLBACK_INVENTORY` completa (ya no se usa). Mantener `mapInventoryImage` tal cual.

Reemplazar el inicio de `export default function InventoryView()` — desde `const [inventory, setInventory] = useState<InventoryItem[]>([]);` hasta el cierre del `useEffect(() => { const fetchData = ...` — por:

```typescript
export default function InventoryView() {
  const { inventory: rawInventory, loadingInventory, error, fetchInventory } = useInventory();
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [sizeFilter, setSizeFilter] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PER_PAGE = 8;

  React.useEffect(() => {
    fetchInventory();
  }, []);

  const inventory: InventoryItem[] = useMemo(() => rawInventory.map((item: any) => ({
    id: String(item.inventory_id),
    sku: item.sku,
    name: item.product_name || 'Desconocido',
    category: item.category_name || 'Sin Categoría',
    collection: 'BRUMA',
    size: item.variant_name || 'OS',
    stock: item.current_stock || 0,
    price: item.price || 0,
    status: item.status,
    img: mapInventoryImage(item.sku)
  })), [rawInventory]);
```

Agregar, justo antes del bloque `if (loading)` existente (que debe cambiar su condición a `loadingInventory`):

```typescript
  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando inventario"
          description={error}
          actionLabel="Reintentar"
          onAction={fetchInventory}
        />
      </div>
    );
  }

  if (loadingInventory) {
```

(reemplaza el `if (loading) {` original por `if (loadingInventory) {`, mismo contenido JSX interno sin cambios).

Quitar la referencia a `useRouter`/`router` y `createClient`/`supabase`/`getUserProject` en todo el archivo — ya no se usan.

- [ ] **Step 6: Verificar en navegador**

Navegar a `/inventory`. Confirmar: skeleton breve, luego tabla con inventario real (nombre, SKU, categoría, stock, precio, status con datos reales — ya no `"Desconocido"`/`"Sin Categoría"` en todas las filas, que era el bug previo). Filtros funcionan. Sin errores en consola. Forzar error de red y confirmar `EmptyState`.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/inventory/items/route.ts src/hooks/useInventory.ts "src/app/(admin)/inventory/page.tsx"
git commit -m "fix: route inventory page through working /api/inventory/items, drop broken grouped route and projectId"
```

---

### Task 5: Movements — quitar `projectId`, conectar página real

**Files:**
- Modify: `src/lib/database/adapters/inventory-movements-adapter.ts`
- Modify: `src/app/api/inventory-movements/route.ts`
- Modify: `src/hooks/useInventoryMovementsData.ts`
- Modify: `src/app/(admin)/movements/page.tsx`

**Interfaces:**
- Consumes: `listInventoryMovements()`, `listInventoryItems()` (adapters, modificados — sin `_projectId`)
- Produces: `useInventoryMovementsData(): { movements: MovementWithInventory[], inventoryItems: InventoryItemForFilter[], loading, error, refetch }`

- [ ] **Step 1: Quitar `_projectId` del adapter**

Editar `src/lib/database/adapters/inventory-movements-adapter.ts`:

```typescript
export async function listInventoryMovements(): Promise<MovementWithInventory[]> {
  const { data, error } = await (db() as any).rpc('get_inventory_movements', {
    p_limit: 100
  });

  if (error) throw error;

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
}

export async function listInventoryItems(): Promise<InventoryItemForFilter[]> {
  const { data, error } = await (db() as any).rpc('list_inventory_items', {
    p_limit: 1000
  });

  if (error) throw error;

  return (data ?? []).map((i: any) => ({
    id: i.id_producto_talla,
    sku: i.variante_codigo || i.producto_codigo,
    product_name: i.producto_nombre
  }));
}
```

- [ ] **Step 2: Quitar `projectId` de la ruta**

Editar `src/app/api/inventory-movements/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  listInventoryMovements,
  listInventoryItems,
} from '@/lib/database/adapters/inventory-movements-adapter';

export async function GET(req: NextRequest) {
  const includeItems = req.nextUrl.searchParams.get('includeItems') === 'true';
  try {
    const [movements, items] = await Promise.all([
      listInventoryMovements(),
      includeItems ? listInventoryItems() : Promise.resolve([]),
    ]);
    return NextResponse.json({ data: movements, inventoryItems: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Quitar `projectId` del hook**

Editar `src/hooks/useInventoryMovementsData.ts`:

```typescript
import { useEffect, useState } from 'react';
import type {
  MovementWithInventory,
  InventoryItemForFilter,
} from '@/lib/database/adapters/inventory-movements-adapter';

interface UseInventoryMovementsDataResult {
  movements: MovementWithInventory[];
  inventoryItems: InventoryItemForFilter[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInventoryMovementsData(): UseInventoryMovementsDataResult {
  const [movements, setMovements] = useState<MovementWithInventory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemForFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/inventory-movements?includeItems=true`)
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else {
          setMovements(result.data ?? []);
          setInventoryItems(result.inventoryItems ?? []);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { movements, inventoryItems, loading, error, refetch };
}
```

- [ ] **Step 4: Reemplazar el RPC directo en `movements/page.tsx`**

Editar `src/app/(admin)/movements/page.tsx` — reemplazar imports (líneas 1-8):

```typescript
"use client";

import React, { useState, useMemo } from "react";
import { Search, ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TacticalTable, Column } from "@/components/ui/TacticalTable";
import { useInventoryMovementsData } from "@/hooks/useInventoryMovementsData";
```

Reemplazar el inicio de `export default function MovementsView()` (desde `const [movements, setMovements] = useState<Movement[]>([]);` hasta el cierre del `useEffect` de `fetchMovements`) por:

```typescript
export default function MovementsView() {
  const { movements: rawMovements, loading, error, refetch } = useInventoryMovementsData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

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

Agregar, antes del bloque `if (loading)` existente:

```typescript
  if (error) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando movimientos"
          description={error}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }
```

- [ ] **Step 5: Verificar en navegador**

Navegar a `/movements`. Confirmar: skeleton breve, luego tabla con movimientos reales. Filtro de tipo funciona. Sin errores en consola. Forzar error de red y confirmar `EmptyState`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/database/adapters/inventory-movements-adapter.ts src/app/api/inventory-movements/route.ts src/hooks/useInventoryMovementsData.ts "src/app/(admin)/movements/page.tsx"
git commit -m "feat: connect movements page to real data, drop projectId"
```

---

### Task 6: Dashboard — adapter, hook y ruta nuevos

**Files:**
- Create: `src/lib/database/adapters/dashboard-adapter.ts`
- Create: `src/app/api/dashboard/route.ts`
- Create: `src/hooks/useDashboardData.ts`

**Interfaces:**
- Consumes: SP `get_dashboard_stats()` (ya existe, sin parámetros) → `{ pedidos, productos_bajo_stock, clientes, proveedores }`
- Produces: `useDashboardData(): { stats: DashboardStats | null, loading: boolean, error: string | null, refetch: () => void }` — `DashboardStats = { pedidos: number, productos_bajo_stock: number, clientes: number, proveedores: number }`

- [ ] **Step 1: Crear el adapter**

Crear `src/lib/database/adapters/dashboard-adapter.ts`:

```typescript
import { SupabaseServiceClient } from '@/lib/api/client';

export interface DashboardStats {
  pedidos: number;
  productos_bajo_stock: number;
  clientes: number;
  proveedores: number;
}

export class DashboardAdapter {
  private client: SupabaseServiceClient;

  constructor() {
    this.client = SupabaseServiceClient.getInstance();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = this.client.getClient();
    const { data, error } = await (supabase as any).rpc('get_dashboard_stats');

    if (error) {
      console.error('[DashboardAdapter] Error getting stats:', error);
      throw error;
    }

    return {
      pedidos: Number(data?.pedidos || 0),
      productos_bajo_stock: Number(data?.productos_bajo_stock || 0),
      clientes: Number(data?.clientes || 0),
      proveedores: Number(data?.proveedores || 0),
    };
  }
}
```

- [ ] **Step 2: Crear la ruta**

Crear `src/app/api/dashboard/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response-builder';
import { DashboardAdapter } from '@/lib/database/adapters/dashboard-adapter';

async function getDashboardHandler(_request: NextRequest) {
  const adapter = new DashboardAdapter();
  const stats = await adapter.getDashboardStats();
  return ApiResponse.success(stats);
}

export const GET = withErrorHandling(getDashboardHandler);
```

- [ ] **Step 3: Verificar la ruta manualmente**

Levantar el dev server, navegar en el navegador a `/api/dashboard`. Confirmar respuesta JSON `{ success: true, data: { pedidos, productos_bajo_stock, clientes, proveedores } }` con números reales (no `undefined`/`NaN`).

- [ ] **Step 4: Crear el hook**

Crear `src/hooks/useDashboardData.ts`:

```typescript
import { useEffect, useState } from 'react';
import type { DashboardStats } from '@/lib/database/adapters/dashboard-adapter';

interface UseDashboardDataResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setStats(result.data);
        else setError(result.error?.message || result.error || 'Error loading dashboard stats');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { stats, loading, error, refetch };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/database/adapters/dashboard-adapter.ts src/app/api/dashboard/route.ts src/hooks/useDashboardData.ts
git commit -m "feat: add dashboard adapter, route and hook backed by get_dashboard_stats"
```

---

### Task 7: Dashboard — conectar página (parcial, con placeholders "Próximamente")

**Files:**
- Modify: `src/app/(admin)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useDashboardData()` (Task 6), `useOrdersData({ limit: 5 })` (Task 1)

- [ ] **Step 1: Reemplazar el mock por datos reales y placeholders**

Editar `src/app/(admin)/dashboard/page.tsx` — reemplazar el archivo completo:

```typescript
"use client";

import React from "react";
import { TrendingUp, ShoppingCart, Package, Users, RefreshCw } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Fauna } from "@/components/ui/Fauna";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOrdersData } from "@/hooks/useOrdersData";

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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Skeleton className="xl:col-span-2 h-[400px] rounded-[2px]" />
          <Skeleton className="h-[400px] rounded-[2px]" />
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="w-full max-w-[1400px] mx-auto">
        <EmptyState
          title="Error cargando el dashboard"
          description={statsError}
          actionLabel="Reintentar"
          onAction={refetchStats}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 relative">

      <Fauna
        src="/brand/images/Jaguar-01.png"
        alt="Jaguar"
        className="w-[700px] right-[-10%] top-[40px] -z-10 opacity-40 mix-blend-luminosity transform -scale-x-100 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        mobileStrategy="hide"
      />

      <PageHeader
        label="Command Center"
        title="Dashboard"
        sub="Welcome back — here is your brand at a glance."
        actionLabel="Refresh"
        actionIcon={<RefreshCw size={14} />}
        onAction={refetchStats}
        bgImage="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&h=300&fit=crop&auto=format"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <FloraGlass
            key={label}
            className="p-6 transition-all hover:border-ember/40 relative group"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="font-fraunces text-3xl font-bold text-bone leading-none mb-2">{value}</p>
            <p className="text-xs text-bone/40 font-geist">{sub}</p>
          </FloraGlass>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <FloraGlass className="xl:col-span-2 p-6 flex flex-col items-center justify-center relative !overflow-visible min-h-[300px]">
          <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-2">Stock Burn Rate</p>
          <p className="font-fraunces text-2xl font-bold text-bone/40 uppercase tracking-tight">Próximamente</p>
          <p className="text-xs text-bone/30 font-geist mt-2 text-center max-w-sm">Requiere seguimiento histórico de consumo por SKU, no disponible en el backend actual.</p>
        </FloraGlass>

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
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en navegador**

Navegar a `/dashboard`. Confirmar: skeleton breve, luego KPIs reales para "Active Orders"/"Low Stock Alerts", tarjetas "Próximamente" para Revenue/New Customers, panel "Recent Orders" con pedidos reales, panel "Stock Burn Rate" muestra "Próximamente". Sin errores en consola. Forzar error de red y confirmar `EmptyState`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/dashboard/page.tsx"
git commit -m "feat: connect dashboard KPIs and recent orders to real data, mark unavailable widgets as coming soon"
```

---

### Task 8: Statistics — reemplazar por placeholder "Próximamente"

**Files:**
- Modify: `src/app/(admin)/statistics/page.tsx`

**Interfaces:** Ninguna — página estática, sin fetch de datos.

- [ ] **Step 1: Reemplazar la página completa**

Editar `src/app/(admin)/statistics/page.tsx` — reemplazar el archivo completo:

```typescript
"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";

export default function StatisticsPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Analytics"
        title="Statistics"
        sub="Métricas y tendencias del negocio."
        bgImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&auto=format"
      />

      <FloraGlass className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <BarChart3 size={48} className="text-bone/30 mb-6" />
        <h2 className="font-fraunces text-3xl font-bold text-bone mb-3">Próximamente</h2>
        <p className="font-geist text-sm text-bone/50 max-w-md leading-relaxed">
          Las estadísticas de tendencia de ingresos y desglose por estado de pedido requieren
          un reporte agregado que todavía no existe en el backend. Se construye como su propio
          proyecto cuando haya una arquitectura de procesamiento de datos definida.
        </p>
      </FloraGlass>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en navegador**

Navegar a `/statistics`. Confirmar que muestra el placeholder "Próximamente" sin errores de consola, sin llamadas a `recharts` ni fetch de datos.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/statistics/page.tsx"
git commit -m "chore: replace statistics page with coming-soon placeholder, defer chart aggregation SPs"
```

---

## Actualización final de FINDINGS.md

- [ ] **Step: Marcar como resueltos los hallazgos cubiertos por este plan**

Editar `FINDINGS.md` — en la sección "Frontend-Backend Integration Audit (2026-08-04)", marcar como resuelto (`[x]`) los ítems: "HTTP API layer dead code" (parcial — las 6 páginas del nav quedan conectadas; `customers`/`suppliers` siguen pendientes por estar fuera del nav), y agregar una nota indicando que `projectId` fue eliminado de los hooks/rutas/adapters tocados. Agregar un nuevo hallazgo: "`/api/inventory/grouped` estaba roto (parámetro y mapeo de campos incorrectos) — eliminado, reemplazado por `/api/inventory/items`". Agregar nota sobre el desglose de items de pedido mostrando solo SKU (sin nombre de producto) por limitación de `get_order_details`.

Commit:

```bash
git add FINDINGS.md
git commit -m "docs: update FINDINGS.md after frontend-backend integration iteration 1"
```
