---
name: BRUMA Fightwear
description: Estado real del sistema de diseño implementado en el código actual (fuente: globals.css, tailwind.config.js, ThemeContext, componentes UI y prototipo HTML).
colors:
  primary: "#ff4d1c"
  background: "#1a1208"
  foreground: "#f0e8d5"
  secondary: "#1a2e1a"
  accent: "#d4a017"
  muted: "#2c200e"
  border: "rgba(240, 232, 213, 0.15)"
  glass: "rgba(35, 26, 10, 0.4)"
  wall: "#120d06"
  surface: "#231a0a"
  moss: "#1a2e1a"
  ember_alt: "#F46734"   # variante usada solo en el prototipo HTML
  bone_alt: "#CEC19C"    # variante usada solo en el prototipo HTML
typography:
  display:
    fontFamily: "Fraunces, serif"   # --font-fraunces (next/font/google)
  body:
    fontFamily: "Geist, sans-serif" # --font-geist-sans (geist/font/sans)
  baseSize: "16px"                  # --font-size
radius: "4px"                       # --radius (shadcn)
---

# Sistema de Diseño: BRUMA Fightwear — ESTADO REAL IMPLEMENTADO

> Documento espejo. Describe exclusivamente lo que existe hoy en el código,
> sin objetivos ni sugerencias. Las secciones se corresponden con los archivos
> de implementación reales. Cualquier divergencia entre documentos está anotada
> en `FINDINGS.md`.

---

## 1. Dónde vive el sistema (fuentes reales)

El sistema de diseño está repartido hoy en varios lugares, todos vivos en el
repositorio:

- **Tokens CSS (tema base "canopy")** — `src/app/globals.css` (`:root`).
- **Colores/fuentes/animaciones de utilidad** — `tailwind.config.js`.
- **Sistema de temas alternos (contexto)** — `src/contexts/ThemeContext.tsx`
  (5 paletas: `light | dark | forest | ocean | warm`).
- **Abstracción de tema adicional** — `src/lib/theme/*` (spacing, layout, banner, navigation).
- **Componentes de marca** — `src/components/ui/{Fauna,FloraGlass,TacticalTable,EmptyState}.tsx`.
- **Primitivas** — `src/components/ui/` (shadcn/ui) + `@radix-ui/*` en `package.json`.
- **Prototipo independiente (Home/Login/Register)** — `design-demos/landing-final/bruma-final.html`.

---

## 2. Paleta de colores (valoración actual)

### 2.1 Tema base "canopy" (producido) — `globals.css:root`
```css
--background: #1a1208;           /* Obsidian negro-café */
--foreground: #f0e8d5;           /* Hueso marfil */
--primary:    #ff4d1c;           /* Ember naranja */
--primary-foreground: #0a0a08;
--secondary:  #1a2e1a;            /* Musgo verde */
--secondary-foreground: #7ddb7d;
--muted:      #2c200e;
--muted-foreground: #a0906c;
--accent:     #d4a017;            /* Dorado */
--border:     rgba(240, 232, 213, 0.15);
--bruma-glass: rgba(35, 26, 10, 0.4);
--bruma-wall: #120d06;
--destructive: #d4183d;
```
Variables de ambiente: `--bruma-blur-sm: 8px`, `--bruma-blur-md: 16px`, `--bruma-blur-lg: 20px`,
`--bruma-fog-light: rgba(240,232,213,0.15)`, `--bruma-fog-dark: rgba(240,232,213,0.08)`, `--radius: 4px`.

### 2.2 Clases de color Tailwind — `tailwind.config.js`
```js
obsidian: '#1a1208', bone: '#f0e8d5', ember: '#ff4d1c',
surface: '#231a0a', muted: '#2c200e', moss: '#1a2e1a',
bruma: { 50..900 } // escala de azul cielo (ver FINDINGS)
```
También aquí se declaran `obsidian/bone/ember/surface/muted/moss`.

### 2.3 Mapeo de tokens (shadcn → canopy)
`--card`, `--popover` → `--background`; `--ring` → `--primary`; `--radius: 4px`.

> **Nota (divergencia real, documentada en FINDINGS).** El **prototipo HTML**
> usa valores distintos para Ember (`#F46734`) y Bone (`#CEC19C`), que **no**
> coinciden con el `#ff4d1c`/`#f0e8d5` del tema base ni del resto del código.

---

## 3. Tipografía

Cargada en `src/app/layout.tsx`:
- **Fraunces** (serif) — `next/font/google`, variable `--font-fraunces`. Resolución `sans latin`.
- **Geist Sans** — `geist/font/sans`, variable `--font-geist-sans`.

Jerarquía aplicada en `globals.css` (base layer) **tal como está hoy**:
- `h1` → Fraunces, `clamp(2rem,5vw,4rem)`, 900, `line-height 1.1`, `-0.02em`.
- `h2` → Geist, `1.5rem`, 600, 1.3.
- `h3` → Geist, `1.25rem`, 600, 1.3.
- `h4` → Geist, `1rem`, 500, 1.5.
- `body` → Geist, `16px` (`--font-size`).

> **Nota.** h2/h3 y el body usan Geist; Fraunces queda reservado a `h1`/marca
> (y no coincide con una "Jerárquía Fraunces en headlines" descrita en otra doc).

---

## 4. Patrones de fondo y ambiente (implementados en `globals.css`)

- `.bruma-wash` — niebla radial basada en `--bruma-fog-light/dark`.
- `.tactical-grid` — rejilla lineal `rgba(240,232,213,0.04)`, 60px.
- `.flora-glass` — panel esmerilado: `background var(--bruma-glass)`, `backdrop-filter blur(20px)`,
  borde `var(--border)`, `border-radius var(--radius)`, `::before` con imagen
  `--flora-bg-image` (default `/brand/brackgrounds/Rainfores-02.jpg`) `mix-blend-mode overlay`,
  opacidad 0.15 → 0.3 en hover. Reflejado en `<FloraGlass>` (`src/components/ui/FloraGlass.tsx`).
- `.nav-horizontal-wall` — muro sólido `--bruma-wall` con `Bruma-Pattern-01.png` (color-dodge, 0.15).
- `.nav-vertical-glass` — columna flotante esmerilada (blur-md).
- `.fauna-anchored` + `<Fauna>` — assets decorativos posicionados; estrategias móviles
  `hide | scale-down | reposition`; usan `next/image`, `drop-shadow-2xl`, `quality=85`.
- `.scrollbar-none`, `.tactical-scrollbar` (scrollbar de 4px con hover ember).

---

## 5. Componentes implementados

### 5.1 Primitivas (shadcn/ui) — `src/components/ui/`
Accordion, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card,
carousel, chart (recharts), checkbox, collapsible, command (cmdk), context-menu, crud-modal,
dialog, drawer (vaul), dropdown-menu, form, hover-card, index.ts («barrel»), input, input-otp,
label, layout, menubar, modern-table, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch,
table, tabs, textarea, theme-selector, toggle, tooltip, typography, use-mobile,
user-profile-popup, utils. (Dependencias Radix en `package.json`.)

### 5.2 Sistema de marca BRUMA — `src/components/ui/`
- `FloraGlass.tsx` — envoltorio de tarjeta esmerilada.
- `Fauna.tsx` — fauna decorativa responsive.
- `TacticalTable.tsx`, `EmptyState.tsx` — patrones de tabla/estados vacíos.
- `Typography.tsx`, `layout.tsx` (PageContainer, Flex), `index.ts`, `forms-index.ts`.

### 5.3 Layered de aplicación — `src/components/layout/`
`GlobalHeader`, `GlobalBackground`, `AppLayout`, `AdminLayout`, `DashboardLayout`,
`ProjectPageLayout`, `UnifiedHeader`, `VerticalNav`.
- **`GlobalHeader`** (producción): barra `nav-horizontal-wall` con los enlaces
  **Armory** (`/catalog`), **Philosophy** (`/philosophy`), **Logistics** (`/logistics`),
  botón busqueda, `Cart [0]` y botón **Initialize**.
- **`AdminLayout`** (zona admin): sidebar `nav-vertical-glass` con nav Dashboard/Inventory/
  Movements/Orders/Invoicing/Catalog/Reporting/Statistics + señal **Admin HUD**
  y logout → `/auth/login`.

### 5.4 Auth (producción) — `src/components/auth/`
`AuthPage`, `AuthContainer`, `LoginForm`, `RegisterForm`, `ProtectedRoute`, `NewAuthPage`.
`AuthContainer` es de **layout centrado / cards de cristal** (pantalla completa) y usa
`ThemeContext` + `ThemeSelector`. Importa `SmartLogoCard` desde
`@/components/common/SmartLogo`, ruta que **no existe en el repo** (ver FINDINGS).

### 5.5 Contextos — `src/contexts/`
`ThemeContext` (5 temas), `AuthContext` (Supabase), `NavigationContext`.

---

## 6. Mecánica de animaciones (real)

### 6.1 En Tailwind/globals — `tailwind.config.js` y `globals.css`
- Keyframes `accordion-down/up` (Radix), `bruma-pulse` (`2s cubic-bezier(0.4,0,0.6,1)`),
  `shimmer` (`translateX(100%)`).
- Transiciones de componentes: hover de `.flora-glass` (opacidad del `::before`, `0.5s ease`),
  hover de `.nav-horizontal-wall`.
- En el código Next.js actual **no existe** animación de landing/página de bienvenida
  (no hay landing implementada en `src/`).

### 6.2 En el prototipo HTML (`bruma-final.html`) — los siguientes easings y motion sí existen allí:
- `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- `portal-transition` (`550ms`) y `portal-form-transition` (`450/400ms`) para abrir/cerrar Login/Register.
- `animate-rotate-slow` (`rotateSlow 30s linear infinite`) → texto circular SVG.
- `fadeInUp` + `animate-fade-in-up` (hero/tagline/CTA, `translateY(24px)`, delays 0/300/500ms).
- `sweep` (`1s ease-out`, `skewX(-15deg)`) → barrido de botón en hover.
- Scroll listener header: transparente → sólido (`#120d06`) cuando `scrollY > 80`.
- Accordion de Raíces: CSS grid con variables `--grid-cols/--grid-rows` transicionadas `500ms`.
- `scroll-reveal` palabra a palabra según scroll (JS puro).
- Portal: overlay dim (home `opacity-30`) + `setTimeout` 400/50ms para abrir/cerrar/cambiar login↔register.

---

## 7. El prototipo Home / Login / Register — diagnóstico explícito

**Ruta:** `design-demos/landing-final/bruma-final.html`

**Estado:** es un **prototipo HTML/CSS/JS vanilla autocontenido y completo**, ya iterado
a satisfacción (`HTML` estático, fuentes + Tailwind desde CDN, assets locales relativos).
Incluye layout, micro-interacciones y la animación de transición de vistas (Home ↔ Portal).

**Integración: NO portado a Next.js/React.** No existe como código de producción en `src/`:
- No hay `src/app/page.tsx` (la landing no es app-router).
- No existen rutas `/catalog`, `/philosophy`, `/logistics` (a donde enlaza el header).
- No existen rutas/`src/app/auth/(login|register)` — el auth en producción (`AuthContainer`)
  es una implementación distinta, no este prototipo.
- `src/app/home-redirect.tsx` está **vacío** (`0` líneas).
  Es un archivo HTML aislado bajo `design-demos/`.

### Qué contiene exactamente (secciones, mecánicas, assets)
Estructura 1 HTML, CSS (Tailwind CDN) y JS de ~1023 líneas:

1. **Capas base fijas** — fondo obsidiano, `tactical-grid`, `bruma-wash`.
2. **Header/nav** — logo texto `BRUMA` (Fraunces), nav `Inicio/Filosofía/Raíces/Contacto`,
   botón `Iniciar Sesión`. Transición transparente→sólido con patrón `Bruma-Pattern-01`.
3. **Hero** — wordmark gigante `BRUMA` (`text-7xl..text-[13rem]`), tagline
   *"«Ante la bruma, mente serena. »"* (Fraunces italic), CTA `Iniciar Sesión`, chevron *Explorar*.
   - Asset: `public/brand/photography/costa-rica/opt3.jpg` (cascada), con degradado.
4. **Filosofía (Balance Perfecto)** — tarjeta superficie con imagen de dos jaguares
   (`public/brand/logos/balance-negative.png`), quote y enlace *Conoce el origen*.
5. **Balance (light)** — panel claro `#CEC19C` con **emblema circular** central
   (`logo-circle-original-no-background.png`) y **texto circular giratorio SVG** (`rotate 30s`).
6. **Raíces (Identidad)** — accionario interactivo de 3 tarjetas (Ritual de Combate /
   Mente Serena / Identidad Forjada) con fotos `Nogi-set-model-0{1,2,3}`:
   escala de grises ↔ color-grade, texto vertical cuando colapsada, expande fila/columna
   del grid según activación.
7. **Contacto (Conéctate al Manto)** — formulario (`Nombre/Correo/Mensaje`) dentro de
   `flora `glass (con `Rainfores-02.jpg`), patrón de fondo `Bruma-Pattern-01`. Envío = `alert`
   placeholder.
8. **Footer** — wordmark gigante `BRUMA` sobre `bg-ember` invertido.
9. **Portal Login/Register** — overlay cover, columna izquierda crema (`#CEC19C`) con emblema,
   columna derecha con paneles `Login`/`Register` que se cruzan (fade+scale, close="reset"),
   inputs con **radio-radial de glare ember** que sigue al ratón (`--x`), botones con
   **barrido** (`sweep`), enlaces *¿Olvidaste tu acceso?*, *Regístrate*/*Inicia Sesión*,
   cierre por `Escape`. Envíos = `alert` placeholder (no autentican).

**JS** (en `DOMContentLoaded`, vanilla): scroll header, activación del accordion de Raíces,
apertura del portal, cierre, cambio de panel, `scroll-reveal`.
`balance-accordion` y `scroll-reveal-text` existen en JS/CSS pero **no** tienen contraparte
actual en el DOM (código inactivo).

---

## 8. Assets utilizados (referenciados en el prototipo, bajo `public/brand/`)
- `photography/costa-rica/opt.jpg`
- `logos/balance-negative.png`, `logos/logo-circle-original-no-background.png`
- `photography/jiu-jitsu/Nogi-set-model-{01,02,03}` (solo `01`, `02`, ` 03`)
- `patterns/Bruma-Pattern-01.png`
- `brackgrounds/Rainfores-02.jpg` (también default de `.flora-glass`)

---

## Nota sobre el alcance de este documento
No define ningún sistema "recomendado" ni plantea mejoras. Cada item describe lo que
*está implementado* hoy (con su ubicación de archivo). Las divergencias (paleta del
prototipo vs. base, doble sistema de temas, enrutado no conectado, imports rotos) se
listan como hallazgos `- [ ]` en `FINDINGS.md`, no como correcciones aquí.