# BRUMA Fightwear — Project Memory

## What this project is
BRUMA Fightwear — Costa Rican martial arts / streetwear apparel brand.
Full-stack app: public storefront + internal admin/management panel
("smart-admin"), built on Next.js 14 + Tailwind + Supabase.

## Source of truth — READ THESE FIRST, every session
- `DESIGN.md` — current design system (palette, typography, patterns,
  components). Kept as an accurate mirror of what's actually implemented,
  not aspirational.
- `PRODUCT.md` — product register/principles (brand vs product register
  distinction, guiding principles).
- `design.json` — machine-readable design tokens (Impeccable sidecar).
- `FINDINGS.md` — known inconsistencies, loose ends, and open issues found
  during the last documentation pass. Treat this as your starting backlog.

Do not assume these are stale — they were refreshed deliberately before
Claude Code was set up. If something in the live code contradicts them,
flag it rather than silently trusting one source over the other.

## Sub-agents available
- **visual-designer** — any UI/visual/styling/animation work. Auto-triggers
  on relevant requests; see `.claude/agents/visual-designer.md` for its
  full ruleset (which design skill to use when).
- **developer** — backend logic, API routes, database/Supabase queries,
  bug fixes, refactors, and non-visual code work. See
  `.claude/agents/developer.md`.
- **content-voice** — copy, taglines, product descriptions, microcopy, and
  tone-of-voice work. Owns the official brand phrases list. See
  `.claude/agents/content-voice.md`.
- **explorer** — read-only codebase mapping/search. Use before large
  refactors to understand blast radius.

## Design prototype — important context
The Home/Login/Register flow currently exists ONLY as a standalone
prototype at `design-demos/landing-final/bruma-final.html` — NOT yet
ported to real Next.js components. See visual-designer's agent file for
full detail on what it contains and how to port it faithfully.

## Skills installed
Superpowers, claude-mem, skill-creator, Impeccable, Huashu Design,
emil-design-eng, Graphify, ponytail. (brand-guidelines and taste-skill:
pending evaluation, not yet installed.)

## Workflow conventions
- Use Superpowers' `/superpowers:brainstorm` → `/superpowers:write-plan` →
  `/superpowers:execute-plan` flow for any non-trivial multi-step task.
- Prefer sequential subagent delegation over parallel — this project runs
  on a Claude Pro plan with shared, limited usage; avoid firing multiple
  subagents simultaneously unless the task genuinely requires it.
- After structural changes to `src/`, consider whether
  `/graphify ./src --update --force` should run to keep the code map
  current.
- Keep FINDINGS.md updated: log new inconsistencies you discover, and
  check off/remove items once resolved.

## Excluded from design scope (unless explicitly re-requested)
- `/setup`, `/project-diagnostic`, `/debug-project`, `/test-data`,
  `/get-project-id`, `/modern-table`, `/dashboard-custom` — internal dev
  utility pages, not part of the polished product.
- AI-generated belt imagery (`brand/elements/belt/`) — deferred to the
  admin/system phase, not for storefront use yet.
