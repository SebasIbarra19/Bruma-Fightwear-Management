# Belt Width Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global `BELT_SCALE` constant in `belts.ts` with a
per-belt scale so all five grados render at the same visual width (blue and
brown currently render thinner, due to genuinely narrower source-photo
aspect ratios), and correct brown's stale metadata (its source file was
replaced 2026-08-04 but `belts.ts` still measured the old photo).

**Architecture:** `beltScale(id)` computes each belt's height-to-frame
ratio as `max(safetyScale, widthScale)` — the crop-safety requirement
(tapes the patch, as today) and the width-matching requirement (matches
white's current visual width), both expressed as fractions of frame
height so the crop-safety guarantee holds at any viewport height. No
React component changes — all of them already consume `beltGeometry(id)`
without knowing whether the scale is global or per-belt.

**Tech Stack:** TypeScript, no new dependencies.

## Global Constraints

- Never deform a belt photo on either axis independently — `beltScale`
  scales width and height together, uniformly, for every belt.
- Crop-safety (top edge hidden, patch hidden below the frame) must hold at
  any viewport height, not just the ones tested — this is why the design
  computes `beltScale` as fractions of frame height, never fixed pixels.
- White, purple, black must not visibly change (target: <1% scale delta
  each) — they're the already-approved reference belts.
- No test framework is installed (`package.json` has no
  jest/vitest/testing-library/playwright). Verification is
  `npm run type-check` + browser measurement via the dev server, per
  project convention.

---

### Task 1: Correct brown's stale metadata

**Files:**
- Modify: `src/components/navigation/belts.ts:143-151` (the `brown` entry
  in `BELTS`)

**Interfaces:**
- Produces: `BELTS.brown` with data matching the current
  `Brownbelt-Photoroom.png` file (1619×972), consumed by Task 2's
  `beltScale()` and by the existing `beltGeometry()`.

- [ ] **Step 1: Replace the brown entry**

In `src/components/navigation/belts.ts`, replace:

```ts
  brown: {
    src: '/brand/BJJ-belts/Brownbelt-Photoroom.png',
    canvas: [1334, 800],
    bbox: [611, 27, 727, 784],
    panel: [0.191, 0.520],
    patch: [0.790, 0.979],
    swatch: '#5A3A24',
    label: 'Cinturón marrón',
  },
```

with:

```ts
  brown: {
    src: '/brand/BJJ-belts/Brownbelt-Photoroom.png',
    // Reemplazada 2026-08-04 (mismo nombre de archivo, foto nueva): pasó de
    // 1334x800 a 1619x972. Los valores de abajo son de la foto actual,
    // medidos por decodificación PNG + barrido fila a fila (negro entre
    // f=0.164-0.462 para el panel, f=0.778-0.976 para el parche),
    // confirmados visualmente contra la imagen.
    canvas: [1619, 972],
    bbox: [721, 34, 848, 922],
    panel: [0.164, 0.462],
    patch: [0.778, 0.976],
    swatch: '#5A3A24',
    label: 'Cinturón marrón',
  },
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/belts.ts
git commit -m "fix: update brown belt metadata to match replaced source photo"
```

---

### Task 2: Replace global `BELT_SCALE` with per-belt scale

**Files:**
- Modify: `src/components/navigation/belts.ts:163-218`

**Interfaces:**
- Consumes: `BELTS` (Task 1's corrected `brown` entry), `BeltId`,
  `TOP_CROP` (unchanged, stays `0.1`).
- Produces: `beltGeometry(id: BeltId): BeltGeometry` — same exported
  signature as today, so `BeltImage.tsx` and `NavigationItems.tsx` (which
  already call `beltGeometry(belt)`) need no changes. `BELT_SCALE` and the
  module-level `EARLIEST_PATCH` are removed — confirmed unused outside
  this file.

- [ ] **Step 1: Replace the scale section**

In `src/components/navigation/belts.ts`, replace:

```ts
export const DEFAULT_BELT: BeltId = 'black'

/** Fracción del alto del marco que se recorta del borde superior del cinturón. */
export const TOP_CROP = 0.1

/** El parche que empieza antes de los cinco. Marca el corte inferior. */
const EARLIEST_PATCH = Math.min(...BELT_IDS.map((id) => BELTS[id].patch[0]))

/**
 * Alto del cinturón en múltiplos del alto del marco.
 *
 * Derivado del parche que empieza antes, así que un único valor sirve para los
 * cinco grados: garantiza que ningún parche entre en la ventana visible, y que
 * quede `TOP_CROP` de cinturón por encima del borde superior.
 *
 * Que la altura sea idéntica en los cinco es también lo que mantiene los slots
 * consistentes entre grados.
 */
export const BELT_SCALE = (1 + TOP_CROP) / EARLIEST_PATCH
```

with:

```ts
export const DEFAULT_BELT: BeltId = 'black'

/** Fracción del alto del marco que se recorta del borde superior del cinturón. */
export const TOP_CROP = 0.1

function beltAspect(id: BeltId): number {
  const [x0, y0, x1, y1] = BELTS[id].bbox
  return (x1 - x0 + 1) / (y1 - y0 + 1)
}

/**
 * Ancho de referencia, fijado una única vez a partir de `white` tal como se
 * ve hoy. Antes de este cambio, blanco no tenía una escala propia: heredaba
 * la de negro (el cinturón cuyo parche empieza más temprano) por ser
 * BELT_SCALE una constante global compartida por los cinco. Esta constante
 * reproduce ese mismo ancho, ahora como referencia explícita.
 */
const WIDTH_TARGET = ((1 + TOP_CROP) / BELTS.black.patch[0]) * beltAspect('white')

/**
 * Escala del cinturón `id`: alto del cinturón en múltiplos del alto del
 * marco. Es el máximo entre dos requisitos, ambos expresados en fracción de
 * la altura del marco —nunca en píxeles absolutos, para que la garantía de
 * recorte se mantenga a cualquier altura de viewport:
 *
 *   safetyScale: lo mínimo para que el parche de ESTE cinturón quede tapado
 *   (mismo mecanismo que antes, ahora por cinturón en vez de un peor-caso
 *   global — nunca puede violar la seguridad de recorte de otro cinturón,
 *   porque cada uno usa su propio patch[0]).
 *
 *   widthScale: lo necesario para que el ancho renderizado de este cinturón
 *   iguale WIDTH_TARGET. Fotos con aspect ratio más angosto (blue: 0.1373
 *   vs. 0.1527-0.1542 de white/purple/black) necesitan más escala para
 *   llegar al mismo ancho — y al escalar sube proporcionalmente también su
 *   alto, nunca se deforma un eje solo.
 *
 * Ver docs/superpowers/specs/2026-08-04-belt-width-normalization.md para
 * los valores medidos y la tabla de resultados por cinturón.
 */
function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale)
}
```

- [ ] **Step 2: Update `beltGeometry` to use the per-belt scale**

In the same file, replace:

```ts
export function beltGeometry(id: BeltId): BeltGeometry {
  const { canvas, bbox, panel } = BELTS[id]
  const [canvasW, canvasH] = canvas
  const [x0, y0, x1, y1] = bbox
  const bboxH = y1 - y0 + 1
  const crop = TOP_CROP * 100
  const belt = BELT_SCALE * 100
```

with:

```ts
export function beltGeometry(id: BeltId): BeltGeometry {
  const { canvas, bbox, panel } = BELTS[id]
  const [canvasW, canvasH] = canvas
  const [x0, y0, x1, y1] = bbox
  const bboxH = y1 - y0 + 1
  const crop = TOP_CROP * 100
  const belt = beltScale(id) * 100
```

(The rest of `beltGeometry` — `imageHeight`, `imageTop`, `imageShiftX`,
`panel` — is unchanged; it already just consumes the local `belt`
variable.)

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: PASS, no errors. Confirm no remaining references to
`BELT_SCALE` or `EARLIEST_PATCH`:

```bash
grep -n "BELT_SCALE\|EARLIEST_PATCH" src/components/navigation/belts.ts
```
Expected: no matches.

- [ ] **Step 4: Verify in the browser — all 5 grados**

Run `npm run dev` (if not already running), open any admin route (e.g.
`/invoicing`) at a 1440×900 viewport, and for each of the 5 grados in the
picker, measure:

- Rendered belt width (`frame`'s child `img`'s rect width scaled by the
  belt's own `bboxW` fraction — or simpler: compare the visible cropped
  belt width across grados by eye, they should look the same).
- `renderedAspect ≈ naturalAspect` (undeformed) — compare
  `img.getBoundingClientRect().width / height` against
  `img.naturalWidth / img.naturalHeight`.
- Slot height (`nav > a` rect height) ≥ 44px.
- Panel fully contains all 8 `<a>` items (`slotsInPanel`).
- Patch stays outside the frame (not visible).

Expected, per the spec's computed table:
- white: scale ≈1.4825 (unchanged from before this task)
- purple: scale ≈1.4693 (<1% change, visually identical)
- black: scale ≈1.4836 (<1% change, visually identical)
- blue: scale ≈1.6501 (now visibly as wide as white)
- brown: scale ≈1.5733 (now visibly as wide as white, using corrected data)

- [ ] **Step 5: Verify route state and animation didn't regress**

Load a route directly (e.g. navigate straight to `/statistics`) and
confirm the tape marker is already aligned on first render (no
click needed). Then click a different nav item and confirm the marker
slides (via `element.getAnimations()` in the browser console, since the
preview tab may not compose frames for a visual screenshot) rather than
jumping.

- [ ] **Step 6: Update FINDINGS.md**

Two open items in `FINDINGS.md` are resolved by this task — locate them by
their exact bold text (not by assumed line number, since the file has
been edited repeatedly this session):

Find the line starting with `- [ ] **Slot del cinturón azul bajo el
mínimo de accesibilidad`, and replace the entire bullet (checkbox through
end of that paragraph) with:

```
- [x] **Slot del cinturón azul bajo el mínimo de accesibilidad** — RESUELTO como efecto colateral de la normalización de ancho entre grados (ver `2026-08-04-belt-width-normalization.md`): azul pasó de escala 1.4825 a 1.6501 para igualar el ancho de blanco, lo que también subió su slot muy por encima de 44px.
```

Find the line starting with `- [ ] **\`Brownbelt.png\` sin usar junto a
\`Brownbelt-Photoroom.png\`**`, and replace it with:

```
- [x] **`Brownbelt.png` sin usar junto a `Brownbelt-Photoroom.png`** — RESUELTO: `Brownbelt-Photoroom.png` (el archivo que ya usa `belts.ts`) fue confirmado como el reemplazo real — `belts.ts` ahora mide esa foto actual, no la vieja. `Brownbelt.png` (sin fondo recortado) queda como el archivo fuente sin procesar, no se usa desde código.
```

- [ ] **Step 7: Commit**

```bash
git add src/components/navigation/belts.ts FINDINGS.md
git commit -m "feat: normalize belt width across grados with per-belt scale

Replaces the global BELT_SCALE constant with a per-belt scale that's the
max of crop-safety and width-matching requirements, both expressed as
fractions of frame height so the crop-safety guarantee holds at any
viewport height. Fixes blue/brown rendering thinner than white/purple
(genuinely narrower source-photo aspect ratios) and resolves blue's
sub-44px slot height as a side effect."
```

---

## Self-Review

**Spec coverage:** Task 1 covers "Datos de marrón" and the brown half of
"Cambios de código". Task 2 covers the `beltScale`/`beltGeometry` change,
`WIDTH_TARGET` derivation, and all 7 verification points from the spec
(width match, undeformed, crop-safety, slots ≥44px, brown pixels-on-black,
route state, animation).

**Placeholder scan:** none found — every step has literal code or a
literal shell command.

**Type consistency:** `beltGeometry(id: BeltId): BeltGeometry` signature
unchanged from the current file, matches what `BeltImage.tsx` and
`NavigationItems.tsx` already call. `beltScale(id: BeltId): number` and
`beltAspect(id: BeltId): number` are new, both file-local (not exported),
so no consumer outside `belts.ts` needs updating — confirmed via grep that
`BELT_SCALE`/`EARLIEST_PATCH` (the symbols being removed) aren't imported
anywhere else.
