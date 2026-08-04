# Producto — Estado real implementado

> Documento espejo del producto tal como existe hoy en el código (`src/`,
> `package.json`, API routes, adaptadores de datos, middleware).

## Identidad

- **Nombre de paquete:** `smart-admin` (`package.json`).
- **Nombre de marca/marca en UI:** BRUMA Fightwear.
- **Meta título/config:** "BRUMA Fightwear - Sistema de Gestión" (`src/app/layout.tsx`).
- **Framework:** Next.js `14.0.3`, React `18`, TypeScript, Tailwind CSS `3.3.5`.

## Plataforma

web

## Usuarios

Buscar el lado del negocio: dueños/mánager de negocios marciales. Hoy la app es un
panel de administración (admin) — no hay landing de registro de marca externa.

## Estado real del flujo de pantallas

- **Landing / Home pública:** **no implementada**. No existe `src/app/page.tsx`.
  `src/app/home-redirect.tsx` está vacío (0 líneas). El header global enlaza a
  `/catalog`, `/philosophy`, `/logistics` — **rutas que no existen**.
- **Auth:** componentes `LoginForm`/`RegisterForm`/`AuthContainer`/`AuthPage` existen,
  pero **no hay** rutas `src/app/auth/*` conectadas. El intento de logout de `AdminLayout`
  redirige a `/auth/login` (inexistente). El auth de Supabase está disponible via provider.
- **Sistema de autenticación (middleware):** `src/middleware.ts` hace **`NextResponse.next()`
  siempre** (BYPASS TOTAL PARA DESARROLLO); no protege rutas.
- **Zona admin (contenido real de producción):** enrutador `src/app/(admin)/` con las
  vistas: Dashboard, Inventory, Movements, Orders, Invoicing, Catalog, Reporting,
  Statistics. Además `Customers` y `Suppliers` bajo `(admin)`. `AdminLayout` ofrece el
  sidebar de navegación.
- **APIs (route handlers)** en `src/app/api/`: catalog, categories, customers,
  inventory (adjust/alerts/grouped/items/movement-stats/movements/report/stats/valuation),
  inventory-movements, orders, products, suppliers. Todos siguiendo `src/lib/api/*`
  (client, middleware `withErrorHandling`, response-builder, error-handler).
- **Capa de datos:** adapters en `src/lib/database/adapters/` para catalog, categories,
  customers, inventory, inventory-movements, orders, product-lines, products,
  purchase-order-detail, purchase-orders, suppliers, variants. Cliente Supabase en
  `src/lib/supabase/*`.
- **Páginas de utilidad/dev** en `src/app/`: `dashboard-custom`, `modern-table`,
  `profile`, `setup`, `test-data`, `project-diagnostic`, `get-project-id`,
  `debug-project`, `home-redirect`.

## Usuario final (target)

Business owner / manager que administra inventario, órdenes y métricas del negocio.
Busca utilidad profesional con identidad de marca vibrante.

## Propósito

Plataforma de administración apuntando a gestión inteligente/automatizada: reduce
carga cognitiva, ofrece insights de datos y una interfaz de uso diario.

## Posicionamiento

Plataforma de gestión moderna e inteligente donde el diseño vibrante se combina con
automatización.

## Personalidad de marca

Vibrante y audaz; rechaza el SaaS genérico; confiable y autoritativo.

## Anti-referencias

- **Enterprise estéril:** evitar el SaaS azul/gris genérico.
- **Glass excesivo:** sin blurs/glassmorphism que dañen la legibilidad.
- **Densidad saturada**: evitar vistas tipo hoja de cálculo sin jerarquía ni espacio.

## Principios de diseño (intenciones)

- **Brand-First Utility**, **Intentional Vibrancy**, **Expert Confidence**.
  > Como intención declarativa, no todas se verifican en el código (ver FINDINGS).

## Accesibilidad

- **WCAG 2.1 AA** como base declarada; atención al contraste de la paleta vibrante.