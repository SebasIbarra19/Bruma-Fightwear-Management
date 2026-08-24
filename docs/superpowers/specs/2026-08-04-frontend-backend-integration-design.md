# Frontend-Backend Integration — Iteración 1 (Design)

**Fecha:** 2026-08-04
**Alcance:** Conectar las páginas admin que viven en la barra de navegación vertical (`NAV` en `src/components/navigation/belts.ts`) a datos reales, siguiendo un patrón consistente de hooks + API routes + adapters.

## Contexto

Auditoría previa (ver `FINDINGS.md`, sección "Frontend-Backend Integration Audit") encontró:
- 20 hooks definidos en `src/hooks/`, cero componentes los importan
- Todas las páginas admin conectadas hoy usan `supabase.rpc()` directo, bypassing hooks/API/middleware
- El schema single-project deployado en `supabase/migrations/20260710045923_initial_schema.sql` es el correcto (no confundir con `database/schema.sql`, viejo/descartado, multi-proyecto)
- Las 50 stored procedures del schema son `SECURITY DEFINER` → RLS sin políticas no es bloqueante (verificado 2026-08-04)

De las 10 páginas bajo `src/app/(admin)/`, solo 8 están en la barra de navegación (`NAV`). `customers` y `suppliers` existen pero son huérfanas (no están en `NAV`, solo alcanzables por URL directa) — **quedan fuera de esta iteración**.

De las 8 rutas del nav, `invoicing` y `reporting` (Activity Log) no tienen tabla ni stored procedure en el schema actual — son features nuevas desde cero, **fuera de esta iteración**. (Nota: si se construye invoicing más adelante, no requiere modificar las SPs de `pedido`/orders — sería una tabla nueva con FK hacia `pedido`, relación aditiva, no destructiva.)

**Alcance final: 6 rutas** — `dashboard`, `inventory`, `movements`, `orders`, `catalog`, `statistics` (statistics recortado a placeholder, ver Tier 3/sección dedicada).

## Prerrequisito: eliminar `projectId` fantasma

Los hooks `useOrdersData`, `useCatalogData`, `useInventory`, `useInventoryMovementsData` exigen un `projectId` que:
- No existe como concepto en el schema single-project actual (sin columna `project_id` en ninguna tabla)
- Llega a los adapters como `_projectId` (prefijo guion bajo = parámetro no usado, confirmado en `inventory-adapter.ts`)
- Bloquea cualquier página que intente usar estos hooks, porque no hay ningún `projectId` real que pasarles

**Acción:** eliminar el parámetro `projectId` de:
- Los 4 hooks mencionados (firma de función, query string del `fetch`)
- Las rutas API correspondientes (`/api/orders`, `/api/catalog`, `/api/inventory/*`, `/api/inventory-movements`) — dejar de leer `projectId` de `searchParams`
- Los adapters correspondientes (`orders-adapter.ts`, `catalog-adapter.ts`, `inventory-adapter.ts`, `inventory-movements-adapter.ts`) — quitar el parámetro `_projectId` de las firmas

No se deja como parámetro opcional sin usar — se borra completo (código muerto confirmado, sin caso de uso futuro definido).

## Patrón estándar por página

Cada página migrada sigue esta forma:

```
const { data, loading, error, refetch } = useXxxData(params)

if (loading) → <Skeleton />          // ya existe en las 6 páginas
if (error)   → <EmptyState title="Error" description={error} actionLabel="Reintentar" onAction={refetch} />
si no        → render normal con `data`
```

Reglas:
- `refetch` se agrega a los hooks que no lo tengan aún (una línea, expone la función interna de fetch)
- Se elimina cualquier fallback silencioso a mock/hardcoded data en error (ej. `FALLBACK_INVENTORY` en `inventory/page.tsx`) — si falla, se muestra el error real, no un dato falso disfrazado de real
- Se elimina cualquier gate vestigial de `getUserProject()` (usado hoy solo en `inventory/page.tsx`, resultado nunca llega a la llamada real)
- `EmptyState` (ya existente en `src/components/ui/EmptyState.tsx`) se reutiliza tal cual para error — no se crea componente nuevo

## Tier 1 — Orders & Catalog (wiring puro)

Hook y ruta API ya existen y funcionan (`useOrdersData` + `/api/orders`, `useCatalogData` + `/api/catalog`). Cero riesgo de regresión — hoy no hacen nada real.

Cambios por página:
- Reemplazar el array hardcodeado (`ORDERS`, `CATALOG`) por la llamada al hook correspondiente
- Aplicar el patrón estándar (loading/error/data)
- Verificar que los campos que la UI espera (`item.status`, `item.img`, etc.) existan en la respuesta real del adapter; si no coinciden, mapear en el componente — no modificar el hook ni el adapter para acomodar la UI

Se hace primero porque valida que el patrón funciona end-to-end antes de tocar páginas que hoy sí funcionan (Tier 2).

## Tier 2 — Inventory & Movements (refactor)

Páginas que hoy llaman `supabase.rpc()` directo y sí muestran datos reales. Se refactoriza la plomería sin cambiar el comportamiento visible.

- **Inventory**: reemplazar `supabase.rpc('list_inventory_items', ...)` + `getUserProject()` + fallback `FALLBACK_INVENTORY` por `useInventory()` (evaluar en implementación si mapea mejor a `/api/inventory/items` o `/api/inventory/grouped` según la forma de datos que consume la tabla actual)
- **Movements**: reemplazar `supabase.rpc('get_inventory_movements', ...)` por `useInventoryMovementsData()`
- Ambas pierden su `createClient()`/`supabase` local — ya no hablan directo a Supabase desde el componente
- Se hace después de Tier 1 para minimizar riesgo de romper funcionalidad que hoy sí opera

## Tier 3 — Dashboard (parcial, backend nuevo)

Hoy: 100% mock (`kpis`, `ORDERS`, `STOCK_BURN` hardcodeados; `createClient()` importado pero sin uso real, solo un `checkAuth` vacío).

Backend disponible: `get_dashboard_stats()` → `{ pedidos, productos_bajo_stock, clientes, proveedores }`. Sin parámetros, sin filtro de fecha.

**Nuevo:**
- `src/lib/database/adapters/dashboard-adapter.ts` → llama `get_dashboard_stats()`
- `src/hooks/useDashboardData.ts`
- `src/app/api/dashboard/route.ts`

**Mapeo de KPIs:**
- Active Orders ← `pedidos` (conectado, real)
- Inventory low-stock ← `productos_bajo_stock` (conectado, real)
- Revenue (mes) → **sin SP que calcule esto acotado a un mes** → tarjeta reemplazada por copy "Próximamente", no fetch, no número falso
- New Customers (mes) → **sin SP que calcule "nuevos este mes"** (solo total histórico vía `clientes`) → tarjeta "Próximamente"

**Widgets:**
- Lista de órdenes recientes → reutiliza `useOrdersData({ limit: 5 })`, ya construido en Tier 1, cero trabajo nuevo
- Stock Burn (consumo inicial vs. restante) → sin SP que lo respalde → reemplazado por "Próximamente", se elimina el mock `STOCK_BURN`

## Statistics — fuera de esta iteración

De los 3 gráficos actuales (`REVENUE_TREND`, `CATEGORY_STOCK`, `ORDER_STATUS`), solo `CATEGORY_STOCK` tiene SP directa (`get_inventory_valuation` ya trae `category_breakdown[]`). Los otros dos requieren agregación temporal/por-estado que no existe hoy como stored procedure.

Decisión explícita del usuario: no vale la pena conectar parcialmente una página con 2/3 de sus widgets sin datos reales. La página completa se reemplaza por un placeholder simple ("Estadísticas — Próximamente"), sin adapter/hook/ruta nueva en esta iteración. Se elimina el mock (`REVENUE_TREND`, `CATEGORY_STOCK`, `ORDER_STATUS`) y el uso de `recharts` en esta página específica (no se toca `package.json`; si `recharts` queda sin otros consumidores tras esto, es un finding aparte, no se borra la dependencia en esta iteración).

## Verificación

Por cada página migrada, usando el navegador del entorno de desarrollo:
1. Cargar la ruta, confirmar que `Skeleton` aparece brevemente
2. Confirmar que se renderizan datos reales (no el mock/hardcode anterior)
3. Forzar un error (parar la red, o simular una respuesta no-2xx) y confirmar que aparece `EmptyState` con botón "Reintentar" — no un `console.error` silencioso
4. Sin errores nuevos en la consola del navegador

No se agregan tests automatizados en esta iteración — no existe suite de tests en el proyecto hoy, fuera de alcance.

## Explícitamente fuera de alcance

- `customers`, `suppliers` (no están en la barra de navegación)
- `invoicing`, `reporting` (Activity Log) — requieren tabla + SP nueva desde cero
- Cualquier RLS policy — no bloqueante, confirmado que las SPs son `SECURITY DEFINER`
- Bug de `adjust_inventory` (typo de variable), RPC faltante `get_inventory_movement_stats`, limpieza de `database/schema.sql` — quedan documentados en `FINDINGS.md`, son sub-proyectos independientes
- Tests automatizados
