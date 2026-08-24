# Desktop Responsive Hardening — Design Spec

**Date:** 2026-08-14
**Status:** Approved by user, ready for implementation planning

## Problem

The admin panel breaks visually above ~175% browser zoom. Root cause,
confirmed by investigation (not assumed): browser zoom shrinks the
*effective* CSS-pixel viewport (e.g. a real 1280px-wide monitor at 175%
zoom behaves like a ~731px-wide CSS viewport). Every admin page uses
Tailwind's `lg:` prefix (1024px) as the single breakpoint separating the
real desktop layout from a mobile-style stacked fallback — and
`BeltNavigation` has **no working mobile fallback** (a prior, deliberate,
documented decision — `FINDINGS.md`: "Un cinturón vertical ahí produciría
slots de ~17px de alto, inusables… Decisión consciente, no omisión"). So
once zoom pushes the effective viewport below 1024px, the sidebar collapses
into an unusable sliver instead of gracefully degrading.

Separately, `src/app/layout.tsx` has no `viewport` export at all — a
missing baseline that Next.js apps are expected to set.

## Explicitly out of scope

User confirmed (2026-08-14, during brainstorming): **no mobile/small-screen
support**. `BeltNavigation`'s desktop-first decision stands unchanged — this
work does not build a mobile nav, does not lower the `lg` breakpoint, and
does not attempt to make the app usable below ~1024px of effective width.
Trying to block browser zoom itself is not possible — zoom is a
browser-level accessibility guarantee no website can override — so this
work is entirely about the app tolerating the zoom/monitor range users
actually hit, not restricting it.

## Target range (the acceptance bar for "done")

The desktop layout (all 8 admin pages + `BeltNavigation`) must render
without visual breakage — no horizontal scroll, no cut-off text, no
overlapping elements — across **1024px–1920px of effective CSS-pixel
viewport width**, treating "effective width" as the single governing
dimension (real monitor width ÷ zoom factor), rather than treating monitor
size and zoom as two separate variables to sweep independently. 1024px is
the existing `lg` breakpoint — the floor is "never break while still above
your own breakpoint," not "work below it." The danger zone this work
actually targets is the narrow band just above that floor (1024–1280px
effective width), since that's where real desktop zoom levels (125%–200%
on typical 1280–1920px monitors) land — confirmed to be exactly where the
user hit the bug (175% zoom on their laptop).

## Components

**1. Baseline viewport meta.** `src/app/layout.tsx` gains a Next.js 14
`viewport` export (`width: 'device-width', initialScale: 1`) — the missing
baseline every Next.js app is expected to set. This does not and cannot
restrict zoom (`maximumScale`/`userScalable: false` are deliberately NOT
set — blocking zoom is both impossible for desktop browsers and would be
an accessibility regression if it worked). This is hygiene, not the fix for
the reported bug — included because it's the correct, currently-missing
baseline, not because it solves the zoom problem itself.

**2. Audit-and-fix pass, per surface.** For each of the 8 admin pages
(`dashboard`, `inventory`, `movements`, `orders`, `invoicing`, `catalog`,
`reporting`, `statistics`) and `BeltNavigation`, render at 1024px, 1100px,
and 1280px effective width (via the Browser pane's resize tool — these
three points bracket the actual danger zone), and inspect for concrete
failure signatures: horizontal scrollbar/overflow, text visibly clipped or
overlapping its container, interactive elements (buttons, inputs) rendered
partially outside their visible area, or a `TacticalTable`/grid whose
columns compress to the point of overlapping content. This is real
per-surface QA work, not a blanket rewrite — most surfaces will likely need
zero changes (the existing `lg:grid-cols-*` patterns already documented by
the earlier investigation are reasonable), and fixes are applied only where
an actual failure is observed and reproduced, never speculatively.

**3. Targeted `rem` conversion.** Where the audit finds a genuine failure
traceable to a fixed-`px` Tailwind arbitrary value (e.g. `text-[10px]`,
`w-[280px]`) that doesn't reflow sensibly, convert that specific value to
its `rem` equivalent (`10px → 0.625rem`, given this codebase's root
`font-size: 16px` per `globals.css`). This is not a blanket sweep of the
~150 arbitrary-px occurrences the earlier investigation counted — only
values implicated in an actually-reproduced failure get touched. `rem`
doesn't itself respond to browser zoom any differently than `px` does (both
scale uniformly with real zoom) — the reason this matters is structural,
not zoom-specific: deeply nested fixed-`px` chains (e.g. a badge whose
padding, font-size, and border-radius are all separately hardcoded `px`
values) are more prone to disproportionate clipping/overlap when the
*layout* they sit inside gets squeezed (by the effective-width shrinkage
zoom causes) than values expressed as `rem`, which stay proportional to the
root font size as a group.

## Testing

No automated test framework exists in this repo. Verification is: resize
the Browser pane to each of the three target widths (1024/1100/1280px),
navigate to each surface, and use `read_page`/`get_page_text`/computed-style
inspection to confirm no failure signature is present — the same
technique already used successfully earlier this session for the
`BeltNavigation` work. Screenshots are not available this session (the
Browser pane doesn't composite frames for screenshots in this environment)
— verification is DOM/computed-style based, not visual.

## Self-Review

- **Placeholder scan:** no TBD/TODO; the audit step is inherently
  discover-fixes-as-you-go (that's the nature of a visual QA pass), but the
  *procedure* for finding and confirming failures is concrete, not vague.
- **Scope check:** appropriately bounded to one plan — 8 pages + 1
  component, one shared mechanism (viewport meta) plus one shared technique
  (targeted rem conversion) applied only where evidence justifies it.
- **Ambiguity check:** "effective width" defined explicitly as the single
  governing variable instead of leaving monitor-size and zoom as two
  independently-swept axes, which was the real ambiguity surfaced during
  brainstorming (a literal reading of "1024px+ monitors at up to 200% zoom"
  would imply supporting ~512px effective width, contradicting the explicit
  no-mobile decision — resolved by treating effective width as the one
  quantity that matters).
