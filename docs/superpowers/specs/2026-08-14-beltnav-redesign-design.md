# BeltNavigation Redesign — Design Spec

**Date:** 2026-08-14
**Status:** Approved by user, ready for implementation planning
**Scope:** `src/components/navigation/BeltNavigation.tsx`, `belts.ts`, `BeltImage.tsx` only. Does NOT cover the sitewide responsive/zoom pass — that is a separate, independent spec/plan by explicit user decision (the two were flagged as separable subsystems during brainstorming and the user chose to sequence them: BeltNav first).

## Problem

The sidebar's illustrated-belt navigation (`BeltNavigation.tsx`) needs a visual polish pass: the functional "panel" strip (the belt's own black/reinforced-tip section, where the physical BJJ belt design already places its rank-grade bar — this is real belt geometry, not a UI-drawn box) should read as more dominant within the frame, the sidebar column should be wider, and the blue belt's rendered color is a bit too bright/saturated relative to the others.

**Important disambiguation resolved during brainstorming:** "the black rectangle" the user described is not a UI element — it's the belt photo's own panel region (already measured per-belt in `belts.ts` as `panel: [start, end]`, a fraction of belt height). For the **black belt specifically** (the default belt on load), this region is actually a red bar framed in white, not black — the rest of the black belt's body is black everywhere, which is why it read as "a black rectangle" at a glance. For white/blue/purple/brown, the panel region genuinely is black fabric (the belt's reinforced tip). Either way, the fix is the same geometry lever: make the panel occupy more of the visible frame.

## Current mechanism (unchanged, for reference)

`belts.ts` already has a carefully measured, per-belt-calibrated system — real pixel-measured `bbox`/`panel`/`patch` fractions per belt PNG (documented in code comments, cross-checked by two independent measurement methods per the existing comments). This spec does not touch any of that measured data. It only changes:

- `beltScale(id) = Math.max(safetyScale(id), widthScale(id))` — the formula that turns those per-belt fractions into a render scale.
- The sidebar's fixed width.
- One belt's color filter.

Current computed values (for reference, verified by direct calculation from the live `belts.ts` constants, not estimated):

| Belt | `panel` height fraction | current `beltScale` | current panel % of frame |
|---|---|---|---|
| white | 0.336 | 1.4827 | 49.82% |
| blue | 0.294 | 1.6506 | 48.53% |
| purple | 0.332 | 1.4691 | 48.78% |
| brown | 0.298 | 1.5738 | 46.90% |
| black (default) | 0.335 | 1.4843 | 49.73% |

All five already sit in a tight ~47–50% band — this is a direct consequence of the 2026-08-04 width-normalization work (`docs/superpowers/specs/2026-08-04-belt-width-normalization.md`), which deliberately made `beltScale` differ per belt so that **rendered width is identical across all five belts** despite their differing photo aspect ratios. This spec must not regress that guarantee (confirmed explicitly with the user — see Decisions below).

## Decisions made during brainstorming

1. **Split from the sitewide responsive pass.** Two independent spec/plan/build cycles. This one is BeltNav only.
2. **"La parte negra" = the belt's own panel region**, not a UI-drawn rectangle, not the deleted `BrandPatch.tsx` (confirmed out of scope — restoring a branding patch was not requested).
3. **Panel prominence target: ~60% of frame height**, but width-matching across belts takes priority over hitting exactly 60% on every belt — see Mechanism below for how this is resolved without reintroducing the pre-2026-08-04 inconsistency.
4. **Sidebar width: 176px → 220px.** Confirmed as the only hardcoded reference to `176` in the navigation/layout components (verified by grep) — no other file needs updating for this change, since every other measurement in `belts.ts`/`BeltImage.tsx` works in `%` of the frame, not in pixels of the frame's width.
5. **Color polish scope: blue belt only, brightness reduction only.** The user explicitly said "sobretodo el azul" (mainly blue) when asked to clarify "pulir todos los colores" — no changes requested for white/purple/brown/black's rendered color, and no changes to swatch dots, text colors, or accent colors (those were reviewed during exploration and found already consistent with BRUMA's core tokens — ember/bone/obsidian — so "polish" here narrows to just this one concrete, explicitly-confirmed item, not a broader unrequested palette overhaul).

## Mechanism

### 1. Panel prominence: a single global multiplier, not a per-belt target

Initial approach (computing an independent `panelScale(id) = 0.60 / panel_fraction(id)` per belt and taking `Math.max` of three terms) was rejected after calculation showed it reintroduces ~6% width variance between belts (blue would render measurably wider than white/black) — because different belts have different panel-height fractions, hitting an identical 60% target per belt requires different absolute scale per belt, which breaks the width-equality that scale was already tuned to guarantee.

**Chosen mechanism:** multiply the *existing*, already-width-matched `beltScale(id)` by one shared constant, `PANEL_BOOST`:

```typescript
const PANEL_BOOST = 1.2

function beltScale(id: BeltId): number {
  const safetyScale = (1 + TOP_CROP) / BELTS[id].patch[0]
  const widthScale = WIDTH_TARGET / beltAspect(id)
  return Math.max(safetyScale, widthScale) * PANEL_BOOST
}
```

Because every belt is multiplied by the *same* `PANEL_BOOST`, and their base `Math.max(safety, width)` values already render at identical width (that's what `WIDTH_TARGET` guarantees), multiplying all of them by one shared constant scales every belt up **together, proportionally** — width-equality is preserved exactly, not approximately. `safetyScale` also still holds as a true floor: `PANEL_BOOST` only ever scales up (never down), so patch-hiding never becomes less safe than today.

Resulting panel-% of frame (computed directly, `PANEL_BOOST = 1.2`):

| Belt | New panel % of frame | Change |
|---|---|---|
| white | 59.77% | +9.95pp |
| blue | 58.24% | +9.71pp |
| purple | 58.52% | +9.74pp |
| brown | 56.28% | +9.38pp |
| black (default) | 59.67% | +9.94pp |

Range 56.3–59.8% — close to the ~60% target on every belt, width-equality fully intact, single-constant change.

**Side effect worth confirming during implementation (not a new requirement, just noting it):** a `+20%` scale increase also proportionally increases the 8-item nav slot height. The black belt's slot height was previously measured (per this session's own memory/observation log) at ~40.6px, below the 44px accessibility minimum — under this change it becomes `40.6 × 1.2 ≈ 48.7px`, which clears the minimum. Verify this during implementation rather than assuming it's still exactly 40.6px pre-change (re-derive from the actual current geometry function, don't hardcode this arithmetic).

### 2. Sidebar width

`BeltNavigation.tsx:52`: `lg:w-[176px]` → `lg:w-[220px]`. Update the adjacent comment (currently says "176px" explaining the `h-screen` sticky reasoning) to say 220px. No other file requires a change — confirmed via grep that `176` appears nowhere else in `src/components/navigation/` or `AdminLayout.tsx`, and all of `belts.ts`'s geometry is expressed in `%` of the frame's own dimensions, not the frame's absolute pixel width.

### 3. Blue belt brightness

Add a per-belt optional CSS `filter` to `BeltSpec` (new field, default absent for white/purple/brown/black — do not invent filter values for belts that weren't flagged), applied to the `<Image>` in `BeltImage.tsx`:

```typescript
// belts.ts — BeltSpec gains:
filter?: string

// blue's entry gains:
filter: 'brightness(0.9) saturate(0.88)',
```

```tsx
// BeltImage.tsx — style object gains:
filter: BELTS[belt].filter,
```

Starting values (`brightness(0.9) saturate(0.88)`, a ~10–12% pull-back) are a reasonable first pass, not a pixel-measured target — unlike the geometry work above, "less bright" has no single correct number. Flag to the user after implementation that this is tunable by editing one line if it needs to go further or less far; this cannot be visually verified via screenshot in the current tooling environment (a known limitation this session — the Browser pane doesn't composite frames for screenshots here), so implementation should verify the CSS actually applies (computed `filter` style, same technique already used elsewhere this session for the Bruma pattern background) rather than claiming a visual judgment it can't make.

## Explicitly out of scope

- The sitewide responsive/zoom pass (separate spec).
- Restoring `BrandPatch.tsx` or any branding-patch UI element.
- Any color changes beyond blue's brightness/saturation (white/purple/brown/black colors, swatch dots, nav text/icon colors, ember accent — all reviewed, none flagged as needing change).
- Re-measuring any belt's `bbox`/`panel`/`patch` pixel data — those stay exactly as currently measured.
- Mobile solution for BeltNavigation (already an explicit, documented non-goal in `FINDINGS.md` — desktop-first by prior conscious decision, not something this spec reopens).

## Verification approach

No visual screenshot verification is available in this session's tooling (documented limitation, hit repeatedly this session). Verification instead via:
- `npm run type-check` — zero new errors.
- Direct computation/inspection of the geometry function's output (e.g. logging or reading `beltGeometry(id)` results) to confirm the panel-% figures above are actually produced by the code, not just claimed.
- `getComputedStyle` inspection (via the Browser pane's JS execution, which does work even though visual screenshots don't) to confirm the new width (220px) and the blue belt's `filter` are genuinely applied in the rendered DOM.
- Confirm no other admin page/component references the old `176` value or assumes the old panel-%% figures.
