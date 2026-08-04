# Diseño: Portar Home/Login/Register del prototipo HTML a Next.js

**Fecha:** 2026-08-03
**Agentes involucrados:** developer (rutas, lógica, navegación) + visual-designer (animaciones, componentes visuales, CSS)
**Fuente de verdad visual:** `design-demos/landing-final/bruma-final.html`

## Contexto

El flujo Home/Login/Register existe hoy SOLO como un prototipo HTML/CSS/JS
autocontenido en `design-demos/landing-final/bruma-final.html`. No está
portado a componentes React/Next.js reales. Las carpetas
`src/app/(landing)/auth/login/` y `src/app/(landing)/auth/register/`
existen pero están vacías (sin `page.tsx`).

El prototipo implementa el flujo login/register como un **portal overlay
fullscreen** (mismo documento, JS alterna clases CSS para mostrar/ocultar
paneles login/register con `history.pushState`). Este mecanismo fue
verificado leyendo el HTML directamente (líneas 644-994): existe un
`#portal-view` fijo que se superpone a `#home-view`, con paneles
`#login-panel`/`#register-panel` que se alternan vía clases
(`hidden`/`opacity-0`/`scale-95` etc.), NO mediante navegación de rutas.

**Decisión de diseño:** NO replicar el mecanismo de portal overlay.
Se reemplaza por rutas Next.js separadas y tradicionales
(`/`, `/auth/login`, `/auth/register`) por ser el enfoque correcto de
seguridad y arquitectura de software (fronteras claras entre páginas
públicas y flujo de autenticación, mejor cacheo, SSR/SEO más simple,
sin estado JS compartido innecesario entre vistas).

## Alcance

### Incluido
1. Home (`/`) — portada completa: hero, sección "Balance Perfecto"
   (filosofía), sección "Balance" (emblema circular), sección "Raíces"
   (accordion interactivo de 3 cards con CSS grid), sección contacto,
   header nav, footer.
2. `/auth/login` y `/auth/register` — páginas separadas y completas,
   sin nav/footer, con el diseño visual del prototipo (glass card,
   decoraciones Fauna, formulario).
3. Fidelidad visual media: se portan transiciones/hover principales y
   el accordion interactivo de Raíces (prioridad explícita del
   usuario). NO se portan scroll-reveal palabra-a-palabra ni otros
   efectos JS-vanilla de alta complejidad que no sean el accordion.
4. Eliminación de `SmartLogoCard` (componente roto, no existe en el
   prototipo, no se usa en ningún otro lugar).
5. Resolución de 4 ítems de FINDINGS.md (ver sección dedicada abajo).

### Excluido (fuera de este trabajo)
- Sección "Contacto" con lógica de envío real (solo layout visual,
  sin backend de formulario a menos que ya exista).
- Scroll-reveal palabra por palabra (JS vanilla del prototipo).
- Cualquier trabajo en `/dashboard` u otras rutas admin.

## Arquitectura de rutas

```
src/app/
  (landing)/
    layout.tsx          # Nav horizontal + footer + background layers (tactical-grid, bruma-wash)
    page.tsx             # Home: hero + filosofía + balance + raíces + contacto
  auth/
    layout.tsx           # Solo estilos base (bg obsidian, sin nav/footer)
    login/
      page.tsx           # LoginPage: wrapper visual + <LoginForm />
    register/
      page.tsx           # RegisterPage: wrapper visual + <RegisterForm />
```

Nota: las carpetas `(landing)/auth/login` y `(landing)/auth/register`
actualmente vacías se eliminan; el auth real vive en `src/app/auth/*`
(fuera del grupo `(landing)`, sin su nav/footer).

## División de trabajo (developer + visual-designer)

**developer:**
- Crear estructura de carpetas/rutas (`auth/layout.tsx`,
  `auth/login/page.tsx`, `auth/register/page.tsx`, actualizar
  `(landing)/page.tsx`).
- Conectar navegación real: nav del header → `/auth/login`; links
  login↔register vía `next/link` (reemplaza `history.pushState` del
  prototipo); submit exitoso → `router.push('/dashboard')`.
- Eliminar `SmartLogoCard` y su importación rota en `AuthContainer.tsx`.
- Verificar/ajustar `ProtectedRoute.tsx` si aplica a las nuevas rutas.
- Eliminar `NewAuthPage.tsx` (reemplazado por `LoginPage`/`RegisterPage`
  separadas) una vez migrada su lógica útil.

**visual-designer:**
- Construir `LandingLayout.tsx` (header nav transparente→sólido on
  scroll, footer, background layers).
- Construir `HomePage.tsx` con las secciones del prototipo (hero,
  Balance Perfecto, Balance/emblema circular con texto rotante SVG,
  Raíces).
- Construir `RaicesAccordion.tsx`: accordion interactivo de 3 cards
  con CSS grid dinámico (`grid-template-columns`/`rows` vía CSS
  custom properties controladas por estado React `useState`, no JS
  vanilla) — replica el comportamiento exacto verificado en el
  prototipo (líneas 217-233, 435+).
- Construir `LoginPage.tsx`/`RegisterPage.tsx`: layout visual (glass
  card, decoraciones Fauna, crosshairs decorativos) que envuelve los
  componentes `LoginForm`/`RegisterForm` existentes sin modificar su
  lógica interna.
- Portar a `globals.css`/Tailwind los estilos necesarios que falten:
  `.nav-horizontal-wall` (+ `.scrolled`), `.raices-grid`,
  `.vertical-text`, `.portal-form-transition` (reutilizado como
  transición de entrada de las auth pages, no como portal),
  `.btn-bruma-primary`, `.btn-bruma-ghost`, `.input-bruma`,
  `@keyframes rotateSlow`, `@keyframes sweep`.
- Verificar que todos los colores usados sean Ember/Bone/Obsidian
  (paleta ya unificada en design.json/globals.css/ThemeContext).

## Componentes reutilizados vs. nuevos vs. eliminados

**Reutilizados (sin cambios de lógica):**
- `LoginForm`, `RegisterForm` (src/components/auth/) — solo se
  ajustan clases/estilos si es necesario para encajar visualmente,
  la lógica de submit/validación no se toca.
- `FloraGlass`, `Fauna` (src/components/ui/) — se usan tal cual en
  los nuevos wrappers.

**Nuevos:**
- `LandingLayout.tsx`, `HomePage.tsx`, `RaicesAccordion.tsx`,
  `LoginPage.tsx`, `RegisterPage.tsx`.

**Eliminados:**
- `SmartLogoCard` (componente + import roto en `AuthContainer.tsx`).
- `NewAuthPage.tsx` (una vez migrada su lógica relevante a
  `LoginPage`/`RegisterPage`).
- Carpetas vacías `(landing)/auth/login`, `(landing)/auth/register`.

## Flujo de navegación

- Home nav / hero CTA → `/auth/login` (`next/link` o `router.push`).
- `LoginForm`: link "¿No tienes cuenta?" → `/auth/register`
  (`next/link`).
- `RegisterForm`: link "¿Ya tienes cuenta?" → `/auth/login`
  (`next/link`).
- Submit exitoso (login o register) → `router.push('/dashboard')`.
- No hay estado de "modo" compartido entre login/register (cada uno
  es su propia ruta/page, sin el toggle `isLogin` de `NewAuthPage.tsx`).

## Resolución de FINDINGS.md

Se marcan como resueltos, **uno por uno conforme se completen**
(no todos al final):

1. **Rutas Auth faltantes** — resuelto al crear
   `src/app/auth/login/page.tsx` y `src/app/auth/register/page.tsx`
   funcionales y conectadas.
2. **Importación rota de SmartLogo** — resuelto al eliminar
   `SmartLogoCard` y su import en `AuthContainer.tsx`.
3. **Animaciones en JS/CSS no implementadas** — resuelto (para el
   subconjunto de fidelidad media acordado) al portar las
   animaciones/transiciones principales y el accordion de Raíces a
   CSS/React real en `globals.css` + `RaicesAccordion.tsx`.
4. **Rutas de prototipo no conectadas** — resuelto al reemplazar los
   anchors internos del prototipo (`#catalog`, `#philosophy`, etc.)
   por navegación real: header nav apunta a `/auth/login` y a
   secciones ancla dentro de `/` (`#filosofia`, `#raices`,
   `#contacto`), que sí existen en `HomePage.tsx`.

## Testing / verificación

- Verificar visualmente en navegador: Home carga con todas las
  secciones, nav transparente→sólido al hacer scroll, accordion
  Raíces responde a click/hover, paleta Ember/Bone/Obsidian aplicada
  consistentemente.
- Verificar navegación: `/` → click login → `/auth/login` → click
  "Regístrate" → `/auth/register` → click "Inicia Sesión" →
  `/auth/login`.
- Verificar que no queden referencias rotas a `SmartLogoCard` (grep
  post-eliminación).
- Verificar que `NewAuthPage.tsx` ya no se importe desde ningún lugar
  antes de eliminarlo.
