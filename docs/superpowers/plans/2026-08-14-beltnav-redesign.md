# BeltNavigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sidebar's illustrated-belt navigation panel read as more visually dominant (a single global scale multiplier, width-equality across belts fully preserved), widen the sidebar column from 176px to 220px, and slightly reduce the blue belt's rendered brightness/saturation.

**Architecture:** Three small, independent changes to the existing, already-measured belt-geometry system in `belts.ts` — no new components, no new image assets, no re-measurement of any belt's pixel data. `beltScale()` gains one multiplicative constant; `BeltNavigation.tsx`'s width class changes; `BeltSpec`/`BeltImage.tsx` gain an optional CSS filter used by exactly one belt.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS (arbitrary-value classes), no new dependencies.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-14-beltnav-redesign-design.md` — read it before starting, it has the full rationale and the calculated tables this plan's numbers come from.
- Do not re-measure or change any belt's `bbox`/`panel`/`patch` values in `belts.ts` — those stay exactly as they are.
- Do not touch the sitewide responsive/zoom work — that is a separate, independent plan by explicit user decision.
- Do not add a mobile-specific layout for `BeltNavigation` — explicitly out of scope (pre-existing conscious decision, documented in `FINDINGS.md`).
- No test framework exists in this repo (`package.json` has no `jest`/`vitest`). Verification uses `npm run type-check` and direct DOM/computed-style inspection via the Browser pane's JS execution — not automated tests.
- No visual screenshot verification is available in this session's tooling (the Browser pane does not composite frames for screenshots). Verify numerically (computed style values, inline style percentages) — never claim a visual judgment ("looks right") that wasn't actually checked this way.
- This project keeps code comments in Spanish, matching the existing dense, precise commenting style already in `belts.ts` (see its existing comments for tone/format) — match that style for any new comment you add, don't switch to English.

---

## Task 1: Panel prominence boost + sidebar width

**Files:**
- Modify: `src/components/navigation/belts.ts` (the `beltScale` function and its constants, ~lines 168–211)
- Modify: `src/components/navigation/BeltNavigation.tsx` (the `<aside>` className and its adjacent comment, ~lines 48–52)

**Interfaces:**
- Consumes: nothing new — `beltScale(id: BeltId): number` already exists and is called only from `beltGeometry(id)` in the same file; no other file calls `beltScale` directly (confirm this with a grep before changing its behavior, so you know the blast radius is exactly this one file).
- Produces: `beltScale(id)` now returns ~20% larger values than before for all five belts. `beltGeometry(id).panel.{top,height}` (consumed by `NavigationItems.tsx`, unchanged interface — same shape, different numbers) will reflect the larger panel. No exported function signature changes.

- [ ] **Step 1: Add the `PANEL_BOOST` constant and apply it in `beltScale`**

In `src/components/navigation/belts.ts`, find:

```typescript
export const TOP_CROP = 0.1
```

Add a new constant right after it:

```typescript
export const TOP_CROP = 0.1

/**
 * Multiplicador global aplicado a `beltScale` para que el panel de grados
 * (la franja funcional donde van los botones de navegación) ocupe más
 * proporción del marco visible.
 *
 * Es un factor único compartido por los cinco cinturones, no un objetivo
 * independiente por cinturón — así el ancho renderizado sigue siendo
 * idéntico entre los cinco (la garantía que `WIDTH_TARGET` ya construye),
 * en vez de romperla. Con este valor, el panel pasa de ~47–50% a ~56–60%
 * del alto del marco según el cinturón (ver
 * docs/superpowers/specs/2026-08-14-beltnav-redesign-design.md para la
 * tabla completa por cinturón).
 */
export const PANEL_BOOST = 1.2
```

Then find:

```typescript
function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale)
}
```

Change the `return` line only:

```typescript
function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale) * PANEL_BOOST
}
```

- [ ] **Step 2: Widen the sidebar**

In `src/components/navigation/BeltNavigation.tsx`, find the comment block right before the `return` statement (it currently mentions "176px"):

```typescript
    // `sticky` (no `fixed`) para que la columna siga en el flujo y reserve sus
    // 176px. Con `h-screen` mide exactamente el viewport, que es la condición
    // que faltaba: un elemento más alto que la pantalla nunca llega a mostrar
    // su mitad inferior al fijarse.
    <aside className="z-40 h-screen w-full shrink-0 lg:sticky lg:top-0 lg:w-[176px]">
```

Change both the comment and the class:

```typescript
    // `sticky` (no `fixed`) para que la columna siga en el flujo y reserve sus
    // 220px. Con `h-screen` mide exactamente el viewport, que es la condición
    // que faltaba: un elemento más alto que la pantalla nunca llega a mostrar
    // su mitad inferior al fijarse.
    <aside className="z-40 h-screen w-full shrink-0 lg:sticky lg:top-0 lg:w-[220px]">
```

- [ ] **Step 3: Verify the geometry math actually changed as expected**

Run `npm run type-check` — expect zero new errors (this is a pure numeric/className change, should not affect types at all).

Start the dev server if it isn't already running, open `/dashboard` (or any admin page) in the Browser pane, and inspect the rendered `<nav aria-label="Navegación principal">` element's inline style — React renders `top`/`height` as literal percentage strings from `NavigationItems.tsx`'s `style={{ top: \`${panel.top}%\`, height: \`${panel.height}%\` }}`, so you can read them directly:

```javascript
(() => {
  const nav = document.querySelector('nav[aria-label="Navegación principal"]');
  return { top: nav.style.top, height: nav.style.height };
})()
```

The default belt on load is `black` (per `DEFAULT_BELT` in `belts.ts`) — expect `height` to read approximately `"59.6%"` to `"59.7%"` (the spec's table gives 59.67% for black; small rounding differences are fine, but it must be meaningfully larger than the pre-change value of ~49.73%, not the same number).

Then switch belts via the `BeltPicker` UI (visible at the bottom of the sidebar) and re-run the same check for at least one more belt (e.g. blue) — expect `height` around `"58.2%"` (spec table: 58.24%), confirming the boost applies per-belt as calculated, not just to the default.

Also verify the width change: `document.querySelector('aside').getBoundingClientRect().width` should read `220` (at a viewport ≥ 1024px wide, where the `lg:` breakpoint is active — resize the Browser pane to desktop width first if it isn't already).

- [ ] **Step 4: Verify width-equality across belts is still exact (this is the property this plan must not regress)**

For at least three different belts (e.g. white, blue, black), read the rendered belt `<img>`'s actual pixel width:

```javascript
(() => {
  const img = document.querySelector('aside img');
  return img.getBoundingClientRect().width;
})()
```

Switch belts via `BeltPicker`, re-check each time. All five should render at the *same* pixel width (within a fraction of a pixel — floating point/rounding, not a real difference). If any belt's width visibly differs from the others by more than ~1px, something is wrong — the whole point of multiplying by a single shared `PANEL_BOOST` constant instead of computing an independent per-belt panel target was to keep this guarantee exact; stop and re-read Step 1 of the design spec's "Mechanism" section if this check fails, don't just proceed.

- [ ] **Step 5: Confirm the pre-existing accessibility note, don't just assume it**

The design spec notes that the black belt's per-item nav slot height was previously below the 44px accessibility minimum (~40.6px) and that this boost should push it comfortably above that floor. Verify this directly rather than trusting the arithmetic in the spec:

```javascript
(() => {
  const buttons = document.querySelectorAll('nav[aria-label="Navegación principal"] a, nav[aria-label="Navegación principal"] button');
  // hay 8 items de nav + posiblemente el marker; filtra a los que tengan href (los NavigationButton reales)
  const navLinks = Array.from(document.querySelectorAll('nav[aria-label="Navegación principal"] a[href]'));
  return navLinks.map(el => el.getBoundingClientRect().height);
})()
```

(Adjust the selector if `NavigationButton` doesn't render as an `<a>` — check `NavigationButton.tsx` first to confirm what element/selector actually reaches the 8 clickable nav rows.) With the black belt selected (the default), every value should be ≥ 44px. If any read below 44px, report this as a concern rather than silently proceeding — it would mean the accessibility improvement the spec expected didn't actually materialize and needs investigation before this task is considered done.

---

## Task 2: Blue belt brightness/saturation reduction

**Files:**
- Modify: `src/components/navigation/belts.ts` (the `BeltSpec` interface and the `blue` entry in `BELTS`, ~lines 66–79 and ~115–133)
- Modify: `src/components/navigation/BeltImage.tsx` (the `<Image>` style object, ~lines 38–44)

**Interfaces:**
- Consumes: `BELTS[id].filter` (new optional field this task adds).
- Produces: `BeltSpec.filter?: string` — an optional field. Every other belt (`white`, `purple`, `brown`, `black`) leaves this field absent (do not add a `filter: undefined` line to them — just don't add the field at all to those four entries, TypeScript's optional-field semantics make this the same as explicitly `undefined`).

- [ ] **Step 1: Add the optional `filter` field to `BeltSpec`**

In `src/components/navigation/belts.ts`, find the `BeltSpec` interface:

```typescript
interface BeltSpec {
  src: string
  /** Dimensiones del PNG completo. */
  canvas: readonly [number, number]
  /** Recorte del cinturón dentro del canvas: [x0, y0, x1, y1], inclusivo. */
  bbox: readonly [number, number, number, number]
  /** Panel de grados (zona funcional), como fracción de la altura del cinturón. */
  panel: readonly [number, number]
  /** Parche de branding inferior, como fracción de la altura del cinturón. */
  patch: readonly [number, number]
  /** Color del punto en el selector de grado. */
  swatch: string
  label: string
}
```

Add one optional field:

```typescript
interface BeltSpec {
  src: string
  /** Dimensiones del PNG completo. */
  canvas: readonly [number, number]
  /** Recorte del cinturón dentro del canvas: [x0, y0, x1, y1], inclusivo. */
  bbox: readonly [number, number, number, number]
  /** Panel de grados (zona funcional), como fracción de la altura del cinturón. */
  panel: readonly [number, number]
  /** Parche de branding inferior, como fracción de la altura del cinturón. */
  patch: readonly [number, number]
  /** Color del punto en el selector de grado. */
  swatch: string
  label: string
  /**
   * Filtro CSS opcional aplicado a la foto. Hoy solo lo usa `blue` (color
   * percibido como demasiado brillante/saturado) — no es un mecanismo
   * genérico de "corrección de color" para los cinco, es un ajuste puntual.
   * Valor de partida, no medido a píxel como bbox/panel/patch — ajustable
   * editando esta única línea si hace falta más o menos.
   */
  filter?: string
}
```

- [ ] **Step 2: Set the filter on the `blue` entry only**

In the same file, find the `blue` entry in `BELTS`:

```typescript
  blue: {
    src: '/brand/BJJ-belts/Bluebelt-Photoroom.png',
    // Reemplazada 2026-08-04 por una foto landscape (1627x967), similar a la
    // blanca en formato — la vieja era portrait (841x1264).
    //
    // panel/patch: se probó copiar los valores de `white` (a simple vista el
    // patrón parecía igual), pero un barrido de píxeles fila por fila mostró
    // que el final del panel de blanco (f=0.527) cae en tela azul pura
    // (rgb 10,72,183), no en negro — esta foto tiene el panel más corto. Se
    // volvió a la medición directa de esta imagen, confirmada por dos
    // métodos independientes (detección por bloque + barrido fila a fila):
    // negro entre f=0.169-0.463 (panel) y f=0.783-0.978 (parche).
    canvas: [1627, 967],
    bbox: [724, 30, 846, 925],
    panel: [0.169, 0.463],
    patch: [0.783, 0.978],
    swatch: '#2F4E9E',
    label: 'Cinturón azul',
  },
```

Add the `filter` line (don't touch anything else in this entry — the bbox/panel/patch measurements and comment explaining them are unrelated to this change):

```typescript
  blue: {
    src: '/brand/BJJ-belts/Bluebelt-Photoroom.png',
    // Reemplazada 2026-08-04 por una foto landscape (1627x967), similar a la
    // blanca en formato — la vieja era portrait (841x1264).
    //
    // panel/patch: se probó copiar los valores de `white` (a simple vista el
    // patrón parecía igual), pero un barrido de píxeles fila por fila mostró
    // que el final del panel de blanco (f=0.527) cae en tela azul pura
    // (rgb 10,72,183), no en negro — esta foto tiene el panel más corto. Se
    // volvió a la medición directa de esta imagen, confirmada por dos
    // métodos independientes (detección por bloque + barrido fila a fila):
    // negro entre f=0.169-0.463 (panel) y f=0.783-0.978 (parche).
    canvas: [1627, 967],
    bbox: [724, 30, 846, 925],
    panel: [0.169, 0.463],
    patch: [0.783, 0.978],
    swatch: '#2F4E9E',
    label: 'Cinturón azul',
    filter: 'brightness(0.9) saturate(0.88)',
  },
```

- [ ] **Step 3: Apply the filter in `BeltImage.tsx`**

In `src/components/navigation/BeltImage.tsx`, find the `style` object passed to `<Image>`:

```tsx
      style={{
        height: `${imageHeight}%`,
        width: 'auto',
        top: `${imageTop}%`,
        transform: `translateX(${imageShiftX}%)`,
      }}
```

Add the filter, reading it off the current belt's spec (you'll need `BELTS[belt]` in scope — check the top of the file, `const { src, canvas } = BELTS[belt]` already destructures from it, so add `filter` to that same destructure):

```tsx
  const { src, canvas, filter } = BELTS[belt]
```

and:

```tsx
      style={{
        height: `${imageHeight}%`,
        width: 'auto',
        top: `${imageTop}%`,
        transform: `translateX(${imageShiftX}%)`,
        filter,
      }}
```

(When `filter` is `undefined` for the other four belts, React omits the CSS property entirely — this is safe, don't add a fallback default.)

- [ ] **Step 4: Verify**

Run `npm run type-check` — zero new errors.

In the Browser pane, select the blue belt via `BeltPicker`, then inspect the rendered image's computed filter:

```javascript
(() => {
  const img = document.querySelector('aside img');
  return getComputedStyle(img).filter;
})()
```

Expect something like `"brightness(0.9) saturate(0.88)"` (browsers may reformat this slightly, e.g. as `brightness(0.9) saturate(0.88)` verbatim or with different whitespace — confirm both functions are present with approximately these values, don't require an exact string match).

Switch to any other belt (e.g. white) and confirm its image's computed `filter` is `"none"` — confirming the filter is genuinely scoped to blue only, not leaking to the other four.

---

## Self-Review Notes

- Both tasks touch a disjoint or minimally-overlapping set of lines within the same 2-3 files (`belts.ts` is touched by both, but Task 1 only touches `TOP_CROP`/`beltScale`/the width comment, Task 2 only touches `BeltSpec`/the `blue` entry — no line overlap), so they can be done in either order, but Task 1 is listed first since it's the higher-impact change the user asked about first.
- Every numeric claim in this plan (panel-%, pixel widths, slot heights) is either taken directly from the design spec's calculated tables or explicitly marked as "verify this yourself, don't assume" — no invented placeholder numbers.
- No task requires touching `NavigationItems.tsx`, `NavigationButton.tsx`, `BeltMarker.tsx`, `BeltPicker.tsx`, or `AdminLayout.tsx` — confirmed by tracing each change's actual consumers (the `panel` shape consumed by `NavigationItems.tsx` is unchanged in structure, only its numeric values change at runtime; the width change is fully internal to `BeltNavigation.tsx`'s own className).
