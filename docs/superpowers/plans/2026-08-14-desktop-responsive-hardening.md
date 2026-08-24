# Desktop Responsive Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the admin panel's desktop layout (8 admin pages + `BeltNavigation`) from visually breaking in the 1024–1280px effective-CSS-pixel-width band — the zone real browser zoom (125–200% on typical 1280–1920px monitors) actually lands in — without building any mobile layout or attempting to restrict zoom itself.

**Architecture:** One trivial, fully-specified task (add the missing Next.js `viewport` export), followed by three audit-and-fix tasks that each cover a subset of the 8 pages (grouped by layout similarity) plus a final task covering the two stub pages and `BeltNavigation`. Each audit task follows the same concrete, scriptable procedure — resize to three specific widths, run the same overflow/clipping checks, fix only what's actually found broken, re-verify.

**Tech Stack:** Next.js 14 (App Router `viewport` export), Tailwind CSS, no new dependencies, no test framework (none exists in this repo).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-14-desktop-responsive-hardening-design.md` — read it before starting, it has the full rationale.
- Target range: 1024px–1920px of **effective** CSS-pixel viewport width. The three widths every audit task must check are **1024px, 1100px, 1280px** (all at 900px height, matching this session's established reference height) — this is the actual danger zone, not an arbitrary sample.
- Out of scope, do not attempt: any mobile/stacked layout for `BeltNavigation` or any page, lowering the `lg` (1024px) breakpoint, blocking or restricting browser zoom (impossible for desktop browsers, and would be an accessibility regression).
- Fix only what you actually reproduce and confirm broken at one of the three target widths. Do not preemptively rewrite `lg:` classes or convert `px` values that render correctly — this is a targeted hardening pass, not a redesign.
- When a fix is needed for a fixed-`px` Tailwind arbitrary value, convert it to the `rem` equivalent using this repo's root `font-size: 16px` (i.e. `Npx → (N/16)rem`, e.g. `10px → 0.625rem`, `12px → 0.75rem`). Do not introduce new breakpoints, new CSS files, or a design-token system — this is a mechanical unit conversion on the specific value(s) implicated in a reproduced failure.
- No test framework exists in this repo. Verification is via the Browser pane's resize + JS-execution tooling — every audit step below gives the exact JS check to run, not a vague "look at it."
- No screenshot verification is available in this session's tooling (the Browser pane doesn't composite frames for screenshots here) — verify via `document.documentElement.scrollWidth`/`clientWidth` comparisons and `getBoundingClientRect()`, not visual judgment.
- Do NOT run `git stash`, `git reset`, `git checkout --`, `git clean`, or any git command that discards/hides changes — only read-only git commands (`status`, `diff`, `log`) are safe (an earlier plan this session had a `git stash` incident that briefly reverted the whole repo).
- Do NOT run `git add` or `git commit`. Leave everything uncommitted — the user reviews and commits everything themselves at the end.

---

## Task 1: Add the missing Next.js viewport export

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks — this is pure baseline hygiene, independent of the audit tasks.

- [ ] **Step 1: Read the current file**

Read `src/app/layout.tsx` in full first. Find its existing `export const metadata` (or similar top-level export) to know where to add the new export in the same style/location.

- [ ] **Step 2: Add the viewport export**

Next.js 14's App Router has a dedicated `viewport` export, separate from `metadata` (putting viewport fields inside `metadata` is deprecated and produces a build warning). Add this export at the top level of the file, alongside whatever `metadata` export already exists:

```typescript
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}
```

Do NOT add `maximumScale` or `userScalable: false` — the spec is explicit that zoom must not be restricted (both because it's not actually achievable for desktop browsers, and because it would be an accessibility regression if it were).

If `layout.tsx` already imports from `'next'` for other types (e.g. `Metadata`), add `Viewport` to that same import line instead of a separate one.

- [ ] **Step 3: Verify**

Run `npm run type-check` — zero new errors.

Start the dev server if not running, open any admin page, and confirm in the Browser pane's JS execution:
```javascript
document.querySelector('meta[name="viewport"]')?.content
```
Expected: a string containing `width=device-width` and `initial-scale=1` (Next.js renders the `viewport` export into an actual `<meta>` tag — confirm it's really there, not just that the export compiles).

---

## Task 2: Audit + fix — Dashboard, Catalog, Inventory

**Files:**
- Modify (only if a failure is reproduced): `src/app/(admin)/dashboard/page.tsx`, `src/app/(admin)/catalog/page.tsx`, `src/app/(admin)/inventory/page.tsx`, and/or any component they import that's implicated in a specific reproduced failure (e.g. `AddProductModal.tsx`, `EditProductModal.tsx`, `StockMovementModal.tsx` if a failure traces into one of them).

**Interfaces:**
- Consumes: nothing from Task 1 (independent).
- Produces: nothing consumed by later tasks (Tasks 2–4 are independent of each other and can run in any order).

- [ ] **Step 1: Ensure the dev server is running**

`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 60` — if not 200, start it (`npm run dev` in the background, wait ~10s).

- [ ] **Step 2: Run the overflow check at all 3 widths, on all 3 pages**

For each width in `[1024, 1100, 1280]` (height fixed at 900), for each page in `['/dashboard', '/catalog', '/inventory']`:

1. Resize the Browser pane to `{width, 900}`.
2. Navigate to the page.
3. Run this JS check:

```javascript
(() => {
  const html = document.documentElement;
  const overflowing = [];
  document.querySelectorAll('main *').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth + 1 && rect.width > 0) {
      overflowing.push({ tag: el.tagName, className: el.className, right: Math.round(rect.right), viewportWidth: window.innerWidth, text: el.textContent?.slice(0, 40) });
    }
  });
  return {
    hasHorizontalScroll: html.scrollWidth > html.clientWidth + 1,
    scrollWidth: html.scrollWidth,
    clientWidth: html.clientWidth,
    overflowingElementsCount: overflowing.length,
    firstFewOverflowing: overflowing.slice(0, 5),
  };
})()
```

This finds two independent failure signatures: page-level horizontal scroll (`hasHorizontalScroll: true`), and any individual element inside `<main>` whose right edge extends past the viewport (which can happen without triggering page-level scroll if the element is inside an `overflow-hidden` ancestor — still a real visual bug, content gets silently clipped).

- [ ] **Step 3: For each failure found, identify root cause and fix**

For each entry in `firstFewOverflowing` (or a page-level `hasHorizontalScroll: true`), read the actual JSX for that element (use the `className` reported to locate it in the page's source — grep the page file and its imported components for the className string). Identify whether the cause is:
- A fixed-`px` Tailwind arbitrary value (e.g. `w-[900px]`, `min-w-[600px]`) that doesn't shrink at the tested width — convert it to `rem` per the Global Constraints formula, or if the design intent is clearly "this should shrink," change it to a percentage/`flex-1`/`min-w-0` pattern matching how sibling elements in the same file already handle responsive sizing (follow the existing pattern in that file, don't invent a new one).
- A `grid-cols-N`/`flex` layout that doesn't have an `lg:`-appropriate column count for the narrower end of the range — only adjust if genuinely needed at 1024–1280px; do not add breakpoints below `lg` (out of scope).

Apply the fix, then re-run the exact Step 2 check for that specific page at that specific width to confirm `overflowingElementsCount` drops to 0 (or the specific element is no longer in the list) and `hasHorizontalScroll` is `false`.

- [ ] **Step 4: Re-run the full matrix after all fixes**

Once all reproduced failures for these 3 pages are fixed, re-run Step 2's check across all 3 widths × all 3 pages one more time, confirming zero failures across the whole matrix (9 checks total: 3 pages × 3 widths).

- [ ] **Step 5: `npm run type-check`**

Zero new errors in any file touched.

---

## Task 3: Audit + fix — Orders, Invoicing, Movements

**Files:**
- Modify (only if a failure is reproduced): `src/app/(admin)/orders/page.tsx`, `src/app/(admin)/invoicing/page.tsx`, `src/app/(admin)/movements/page.tsx`, and/or any component they import that's implicated in a specific reproduced failure (e.g. `NewOrderModal.tsx`).

**Interfaces:**
- Consumes: nothing from Task 1 or Task 2 (independent).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Ensure the dev server is running**

Same check as Task 2, Step 1.

- [ ] **Step 2: Run the overflow check at all 3 widths, on all 3 pages**

Identical procedure to Task 2's Step 2 — same JS check verbatim, applied to `['/orders', '/invoicing', '/movements']` at widths `[1024, 1100, 1280]`.

These three pages share a list-plus-detail-panel layout (`grid-cols-1 lg:grid-cols-5` or similar split) — pay particular attention to whether the detail panel's content (order line items, invoice line items, movement filter sidebar) stays within its column at the narrow end of the range, since split-panel layouts are more prone to one side overflowing than the single-column list layouts in Task 2's pages.

- [ ] **Step 3: For each failure found, identify root cause and fix**

Same fix procedure as Task 2's Step 3 (identify the fixed-`px` or grid-column cause, convert to `rem` or an existing responsive pattern already used elsewhere in the same file, re-verify that specific check).

- [ ] **Step 4: Re-run the full matrix after all fixes**

Same as Task 2's Step 4, for these 3 pages (9 checks total).

- [ ] **Step 5: `npm run type-check`**

Zero new errors in any file touched.

---

## Task 4: Audit + fix — Reporting, Statistics, BeltNavigation

**Files:**
- Modify (only if a failure is reproduced): `src/app/(admin)/reporting/page.tsx`, `src/app/(admin)/statistics/page.tsx`, `src/components/navigation/BeltNavigation.tsx`, `src/components/navigation/belts.ts`.

**Interfaces:**
- Consumes: nothing from Tasks 1–3 (independent). Note: if Task 1's `BeltNavigation` prior redesign work (from earlier this session — `PANEL_BOOST`, the 220px width, the `TAPE_HEIGHT_PCT` fix) is still uncommitted when this task runs, that's expected and unrelated — don't revert or question it, just don't re-touch those specific mechanisms unless THIS task's own audit finds a NEW failure in the 1024–1280px range that traces to them.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Ensure the dev server is running**

Same check as Task 2, Step 1.

- [ ] **Step 2: Run the overflow check on the two stub pages**

`reporting` and `statistics` are both small, static "Próximamente" placeholder pages (confirmed earlier this session — no dynamic data, minimal markup). Run the same JS check from Task 2's Step 2 against `['/reporting', '/statistics']` at widths `[1024, 1100, 1280]`. Given their simplicity, a clean result (zero failures) is the expected and likely outcome — don't invent work if the check is clean.

- [ ] **Step 3: Check `BeltNavigation` specifically**

`BeltNavigation` renders on every admin page (it's part of `AdminLayout`), so it's already been rendered during Tasks 2–3's checks incidentally — but this step checks it directly and specifically, since it's the one surface in this plan that isn't a page.

At each of the 3 widths, with any admin page loaded, run:

```javascript
(() => {
  const aside = document.querySelector('aside');
  const nav = document.querySelector('nav[aria-label="Navegación principal"]');
  const belt = document.querySelector('aside img:not([src*="Tape"])');
  return {
    windowInnerWidth: window.innerWidth,
    asideWidth: aside.getBoundingClientRect().width,
    asideRight: aside.getBoundingClientRect().right,
    navButtonsOverflow: Array.from(nav.querySelectorAll('a[href]')).some(a => {
      const r = a.getBoundingClientRect();
      return r.right > aside.getBoundingClientRect().right + 1 || r.left < aside.getBoundingClientRect().left - 1;
    }),
    beltVisible: belt ? belt.getBoundingClientRect().width > 0 : false,
  };
})()
```

At 1024px and above, `BeltNavigation` should be in its `lg:` desktop state (fixed 220px sidebar) — confirm `asideWidth` is `220` (or very close, allowing for scrollbar-width variance) at all 3 widths, `navButtonsOverflow` is `false` (nav buttons/links don't spill outside the sidebar's own bounds), and `beltVisible` is `true`. Since 1024px is exactly the `lg` breakpoint threshold, pay special attention to that specific width — confirm the sidebar is genuinely in its desktop (not stacked/mobile) state there, not flickering between states.

- [ ] **Step 4: Fix anything found, following the same procedure as Task 2's Step 3**

If a genuine failure is found (e.g. `BeltNavigation` not rendering in its `lg:` state exactly at 1024px due to an off-by-one in a breakpoint, or `navButtonsOverflow: true`), trace it to the specific class/value in `BeltNavigation.tsx` or the geometry math in `belts.ts`, fix minimally, re-verify with the same check.

- [ ] **Step 5: Re-run the full matrix after all fixes**

Re-run Step 2 (2 pages × 3 widths = 6 checks) and Step 3 (3 widths = 3 checks) one more time, confirming zero failures across all 9.

- [ ] **Step 6: `npm run type-check`**

Zero new errors in any file touched.

---

## Self-Review Notes

- **Spec coverage:** Component 1 (viewport meta) → Task 1. Component 2 (audit-and-fix per surface) → Tasks 2–4, covering all 8 pages + `BeltNavigation`. Component 3 (targeted rem conversion) → folded into Tasks 2–4's Step 3/4 fix procedure, not a separate task, per the spec's own framing ("only values implicated in an actually-reproduced failure get touched" — there's no way to pre-enumerate which values those are before the audit runs, so it can't be its own task with pre-written diffs).
- **No placeholders:** every audit task gives the exact JS check to run (not "look for issues"); the *fix* content genuinely can't be pre-written (that's the nature of an audit), but the spec's self-review already justified this and the fix *procedure* (identify root cause category, apply the specific conversion formula, re-verify with the same script) is concrete.
- **Task independence:** Tasks 2, 3, and 4 touch disjoint sets of page files and can be reviewed/executed in any order (Task 1 has no dependents either) — if a subagent-driven session wants to run them out of order or in parallel review, that's safe.
- **Type consistency:** all three audit tasks use the identical overflow-check script (copy-pasted verbatim between Task 2 and Task 3, adapted with the extra `BeltNavigation`-specific check added in Task 4) — a reviewer comparing tasks will see the same verification methodology applied consistently, not three different ad-hoc approaches.
