# Port Home/Login/Register to Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the BRUMA Home/Login/Register experience from the standalone
prototype (`design-demos/landing-final/bruma-final.html`) into real
Next.js routes: `/` (home), `/auth/login`, `/auth/register` — replacing
the prototype's portal-overlay mechanism with separate, secure routes.

**Architecture:** Next.js App Router with route-group layouts:
`(landing)/layout.tsx` owns the marketing header/footer, `auth/layout.tsx`
is a bare pass-through (no nav/chrome). `LoginForm`/`RegisterForm` (existing
Supabase-backed logic) are reused unchanged inside new visual wrapper
components. The interactive "Raíces" 3-card accordion is ported from
vanilla-JS DOM manipulation to React state driving CSS custom properties.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS (+ `@layer`
custom utilities in `globals.css`), Supabase client (existing, untouched),
`next/image`, `next/link`.

## Global Constraints

- Canonical palette (verbatim, already unified in `design.json`/
  `globals.css`/`ThemeContext.tsx` by prior work): Ember `#F46734`,
  Bone `#CEC19C`, Obsidian `#1a1208`. This plan additionally fixes
  `tailwind.config.js`, which still hardcodes the old values — see Task 1.
- No test framework is installed in this project (`package.json` has no
  jest/vitest/testing-library/playwright). Verification steps use
  `npm run type-check` and manual browser checks via the dev server, per
  project convention for UI work — not fabricated unit tests.
- Routes are separate (`/`, `/auth/login`, `/auth/register`), not a portal
  overlay — this was an explicit user decision for security/architecture
  reasons.
- Fidelity target: media — port the Raíces accordion (explicit priority)
  and primary transitions/hover states; skip word-by-word scroll-reveal
  JS.
- `SmartLogoCard` and every file that only exists to serve it
  (`AuthContainer.tsx`, `AuthPage.tsx`) are deleted, not patched.
  `NewAuthPage.tsx` is deleted, superseded by the new `LoginPage`/
  `RegisterPage` components.

---

### Task 1: Fix `tailwind.config.js` color tokens (visual-designer)

**Why this task exists:** the earlier palette-unification pass updated
`design.json`, `globals.css`, and `ThemeContext.tsx`, but missed
`tailwind.config.js`, which hardcodes literal `ember`/`bone` hex values
used by Tailwind utility classes (`bg-ember`, `text-bone`, etc.) already
used throughout `LoginForm.tsx`, `RegisterForm.tsx`, `AdminLayout.tsx`,
and every component this plan creates. Without this fix, none of the new
pages would render the correct palette.

**Files:**
- Modify: `tailwind.config.js:64-66`

**Interfaces:**
- Produces: Tailwind utility classes `bg-ember`/`text-ember`/`border-ember`
  → `#F46734`; `bg-bone`/`text-bone`/`border-bone` → `#CEC19C`. Every later
  task's JSX uses these classes and relies on this fix being in place.

- [ ] **Step 1: Update the color tokens**

In `tailwind.config.js`, replace:

```js
        obsidian: '#1a1208',
        bone: '#f0e8d5',
        ember: '#ff4d1c',
```

with:

```js
        obsidian: '#1a1208',
        bone: '#CEC19C',
        ember: '#F46734',
```

- [ ] **Step 2: Add the `fade-in-up` keyframe/animation used by the hero**

In the same file, inside `theme.extend.keyframes`, add (alongside the
existing `accordion-down`/`accordion-up`/`bruma-pulse`/`shimmer` entries):

```js
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
```

Inside `theme.extend.animation`, add:

```js
        "fade-in-up": "fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
```

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: no errors (this file isn't type-checked directly, but confirms
nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "fix: correct ember/bone tailwind tokens to canon palette, add fade-in-up"
```

---

### Task 2: Fix root layout — remove global nav, fix theme crash (developer)

**Why this task exists:** `src/app/layout.tsx` currently renders
`<GlobalHeader />` unconditionally above `{children}` for every route in
the app, which conflicts with the approved design (auth pages must have
no header; the new landing header replaces `GlobalHeader` for the home
route). It also passes `defaultTheme="canopy"` to `ThemeProvider`, but
`"canopy"` is not a valid `ThemeName` — `themes['canopy']` is `undefined`,
so `applyThemeToDOM` throws `TypeError` reading `.colors` on first client
render without a saved theme. This crashes the app before any of this
plan's pages can render.

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `ThemeProvider` from `@/contexts/ThemeContext` (existing,
  `ThemeName = 'light' | 'dark' | 'forest' | 'ocean' | 'warm'`).
- Produces: root layout no longer renders a header; route groups
  ((landing), auth, (admin)) each own their own chrome.

- [ ] **Step 1: Remove the `GlobalHeader` import and usage**

In `src/app/layout.tsx`, remove line:
```tsx
import { GlobalHeader } from '@/components/layout/GlobalHeader'
```

And remove the `<GlobalHeader />` line inside the JSX, so the body reads:

```tsx
        <ThemeProvider defaultTheme="warm">
          <AuthProvider>
            <NavigationProvider>
              <GlobalBackground />
              <div id="root" className="relative z-10 flex flex-col min-h-screen">
                {children}
              </div>
            </NavigationProvider>
          </AuthProvider>
        </ThemeProvider>
```

- [ ] **Step 2: Fix the invalid `defaultTheme` value**

Change `defaultTheme="canopy"` to `defaultTheme="warm"` (as shown above —
`"warm"` is the theme whose `displayName` was already updated to "BRUMA"
in the prior palette-unification work).

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: PASS, no errors.

Run dev server and load any existing route (e.g. `/dashboard` if
reachable, or check the terminal for a clean compile with no runtime
`TypeError` from `ThemeContext.tsx`).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "fix: remove global header from root layout, fix invalid canopy theme default"
```

---

### Task 3: Delete dead auth files, resolve SmartLogoCard import (developer)

**Files:**
- Delete: `src/components/auth/AuthContainer.tsx`
- Delete: `src/components/auth/AuthPage.tsx`
- Delete: `src/components/auth/NewAuthPage.tsx`
- Delete (empty dirs): `src/app/(landing)/auth/login`,
  `src/app/(landing)/auth/register`, `src/app/(landing)/auth`
- Modify: `FINDINGS.md`

**Interfaces:**
- Produces: no remaining reference to `SmartLogoCard` or
  `@/components/common/SmartLogo` anywhere except the pre-existing,
  separately-tracked `SmartLogoNavbar` usage in `src/app/profile/page.tsx`
  (out of scope — different export, different finding, untouched).

- [ ] **Step 1: Verify nothing outside these three files imports them**

Run:
```bash
grep -rn "AuthContainer\|NewAuthPage\|from '@/components/auth/AuthPage'" "D:\TEC\BRUMA\src" --include="*.tsx" --include="*.ts"
```
Expected: matches only inside `AuthContainer.tsx`, `AuthPage.tsx`,
`NewAuthPage.tsx` themselves (self-declarations). If anything else
matches, stop and investigate before deleting.

- [ ] **Step 2: Delete the three files**

```bash
rm "D:/TEC/BRUMA/src/components/auth/AuthContainer.tsx"
rm "D:/TEC/BRUMA/src/components/auth/AuthPage.tsx"
rm "D:/TEC/BRUMA/src/components/auth/NewAuthPage.tsx"
```

- [ ] **Step 3: Remove the empty, unused `(landing)/auth` folders**

```bash
rm -rf "D:/TEC/BRUMA/src/app/(landing)/auth"
```

- [ ] **Step 4: Confirm no broken imports remain**

Run: `npm run type-check`
Expected: PASS. If any file still imports the deleted components, fix
that import (it would indicate Step 1's grep missed a caller — investigate
before proceeding).

- [ ] **Step 5: Mark the FINDINGS.md item resolved**

In `FINDINGS.md`, under "Componentes / componentes faltantes" section,
change:
```
- [ ] **Importación rota de SmartLogo** — AuthContainer en `src/components/auth/AuthContainer.tsx` importa `SmartLogoCard` desde `@/components/common/SmartLogo`. La ruta `src/components/common/` **no existe** y no hay ningún `SmartLogoCard` en ningún otro lugar.
```
to:
```
- [x] **Importación rota de SmartLogo** — RESUELTO: `AuthContainer.tsx` (único consumidor de `SmartLogoCard`) fue eliminado junto con `AuthPage.tsx` (su único consumidor) y `NewAuthPage.tsx` (superseded), como parte del port de Home/Login/Register a rutas reales.
```

Note: this finding item lives under "Admin & Auth" in the original file, not
"Componentes / componentes faltantes" — locate it by its exact text
(`**Importación rota de SmartLogo**`) rather than by section heading,
since section boundaries may have shifted from earlier edits.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/auth/AuthContainer.tsx src/components/auth/AuthPage.tsx src/components/auth/NewAuthPage.tsx "src/app/(landing)/auth" FINDINGS.md
git commit -m "refactor: delete dead auth components (AuthContainer, AuthPage, NewAuthPage)

Resolves the broken SmartLogoCard import by removing its only consumer
instead of patching it. NewAuthPage.tsx is superseded by LoginPage/
RegisterPage built later in this plan."
```

---

### Task 4: Port missing prototype CSS to `globals.css` (visual-designer)

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces new CSS classes consumed by later tasks:
  `.nav-horizontal-wall` (+ `.scrolled` modifier), `.header-btn` (+
  `.active`), `.raices-grid` (reads `--grid-cols`/`--grid-rows` custom
  properties), `.vertical-text`, `.raices-card` (+ `.active`),
  `.tactical-grid-dark`, `.color-grade-bruma`, `.ease-out-expo`,
  `.portal-form-transition`, `.animate-rotate-slow`, `@keyframes sweep`,
  `.btn-bruma-primary`, `.btn-bruma-ghost`, `.input-bruma`,
  `.label-bruma`.

**Note:** `globals.css:181-209` already defines `.nav-horizontal-wall`
and `.header-btn` with an "always solid" admin-style behavior. This task
**replaces** that block with the prototype's "transparent by default,
solid when `.scrolled`" behavior, since `GlobalHeader.tsx` (the only
other consumer) is no longer rendered anywhere after Task 2 — there is no
other current consumer of these two classes to preserve compatibility
with.

- [ ] **Step 1: Replace the existing `.nav-horizontal-wall`/`.header-btn` block**

In `src/app/globals.css`, find this existing block (around line 180-215):

```css
  /* Nav Glasses */
  .nav-horizontal-wall {
    background-color: var(--bruma-wall);
    border-bottom: 1px solid var(--border);
    position: relative;
  }
  .nav-horizontal-wall::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/brand/patterns/Bruma-Pattern-01.png');
    background-size: 200px;
    opacity: 0.15;
    mix-blend-mode: color-dodge;
    z-index: -1;
  }
```

Replace it with:

```css
  /* Nav Glasses — transparent by default, solid when scrolled (Home) */
  .nav-horizontal-wall {
    position: relative;
    background-color: transparent;
    border-bottom: 1px solid transparent;
    box-shadow: none;
    transition: background-color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
  }
  .nav-horizontal-wall::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/brand/patterns/Bruma-Pattern-01.png');
    background-size: 180px;
    opacity: 0;
    mix-blend-mode: color-dodge;
    z-index: 1;
    pointer-events: none;
    transition: opacity 0.5s ease;
  }
  .nav-horizontal-wall.scrolled {
    background-color: #120d06;
    border-bottom: 1px solid rgba(206, 193, 156, 0.15);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  }
  .nav-horizontal-wall.scrolled::before {
    opacity: 0.12;
  }

  .header-btn {
    background-color: #2c200e !important;
    color: #CEC19C !important;
    border-radius: 999px !important;
    padding: 10px 22px !important;
    border: 2px solid transparent !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .header-btn.active {
    border: 2px solid #F46734 !important;
  }
  .header-btn:hover {
    transform: scale(1.05) !important;
  }
  .nav-horizontal-wall.scrolled .header-btn {
    background-color: #CEC19C !important;
    color: #1a1208 !important;
    border: 1px solid rgba(26, 18, 8, 0.15) !important;
  }
  .nav-horizontal-wall.scrolled .header-btn.active {
    border: 2px solid #F46734 !important;
  }
  .nav-horizontal-wall.scrolled .header-btn:hover {
    background-color: #1a1208 !important;
    color: #CEC19C !important;
    border-color: rgba(240, 232, 213, 0.2) !important;
  }
```

- [ ] **Step 2: Add the remaining prototype utilities**

Still inside `src/app/globals.css`, inside the existing `@layer utilities {
... }` block (append before its closing `}`, after `.fauna-anchored`),
add:

```css

  /* BRUMA prototype-ported utilities (Home/Auth port) */
  .color-grade-bruma {
    filter: sepia(0.4) saturate(0.55) contrast(1.15) brightness(0.8) hue-rotate(-5deg);
    transition: filter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tactical-grid-dark {
    background-image: linear-gradient(rgba(26, 18, 8, 0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(26, 18, 8, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  .ease-out-expo {
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  .portal-form-transition {
    transition: transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes rotateSlow {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  .animate-rotate-slow {
    animation: rotateSlow 30s linear infinite;
  }

  @keyframes sweep {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
  }

  /* Raíces interactive accordion grid */
  .raices-grid {
    display: grid;
    gap: 0.75rem;
    width: 100%;
    transition: grid-template-columns 500ms cubic-bezier(0.16, 1, 0.3, 1), grid-template-rows 500ms cubic-bezier(0.16, 1, 0.3, 1);
    grid-template-rows: var(--grid-rows, 5fr 1fr 1fr);
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .raices-grid {
      grid-template-rows: 1fr;
      grid-template-columns: var(--grid-cols, 5fr 1fr 1fr);
    }
  }
  .vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }
  .raices-card img {
    filter: grayscale(1) contrast(1.25) brightness(0.7);
    transition: filter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .raices-card.active img {
    filter: sepia(0.4) saturate(0.55) contrast(1.15) brightness(0.8) hue-rotate(-5deg);
  }
  .raices-card.active:hover img {
    filter: sepia(0.3) saturate(0.75) contrast(1.2) brightness(0.92) hue-rotate(-5deg);
  }
  .raices-card::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 45%;
    background: linear-gradient(to top, rgba(18, 13, 6, 0.85), transparent);
    z-index: 10;
    pointer-events: none;
  }
  .raices-card.active::after {
    height: 30%;
    background: linear-gradient(to top, rgba(18, 13, 6, 0.55), transparent);
  }

  /* Bruma form controls (auth + contact) */
  .btn-bruma-primary {
    @apply bg-ember text-obsidian px-8 py-3 rounded-[4px] font-bold hover:bg-ember/90 transition-all uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(244,103,52,0.25)] hover:shadow-[0_0_30px_rgba(244,103,52,0.4)] focus:outline-none focus:ring-1 focus:ring-ember/50 active:scale-[0.98] duration-300;
  }
  .btn-bruma-ghost {
    @apply text-bone/70 hover:text-bone border border-bone/20 hover:border-bone/50 px-6 py-2.5 rounded-[4px] transition-all uppercase text-[10px] tracking-widest focus:outline-none duration-300 active:scale-[0.98];
  }
  .input-bruma {
    @apply bg-obsidian/80 border border-bone/15 rounded-[2px] px-4 py-3 text-bone placeholder:text-bone/30 focus:outline-none focus:border-ember/60 focus:ring-1 focus:ring-ember/30 transition-all text-xs tracking-wider font-light w-full;
  }
  .label-bruma {
    @apply block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2;
  }
```

(Shadow color uses `rgba(244,103,52,...)` — the RGB of canon Ember
`#F46734` — rather than the prototype's own inconsistent
`rgba(255,77,28,...)`, since the unified palette is the single source of
truth per prior work.)

- [ ] **Step 3: Verify**

Run: `npm run type-check` (CSS isn't type-checked, but confirms nothing
else broke). Visually verify once Task 5 renders a header using these
classes.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: port prototype CSS utilities to globals.css (nav scroll state, raices grid, bruma form controls)"
```

---

### Task 5: Build `LandingHeader.tsx` (visual-designer)

**Files:**
- Create: `src/components/layout/LandingHeader.tsx`

**Interfaces:**
- Consumes: `.nav-horizontal-wall`/`.header-btn` CSS from Task 4.
- Produces: `LandingHeader` component, default export not used (named
  export `LandingHeader`), consumed by Task 7's `(landing)/layout.tsx`.

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '#filosofia', label: 'Filosofía' },
  { href: '#raices', label: 'Raíces' },
  { href: '#contacto', label: 'Contacto' },
]

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`nav-horizontal-wall fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center${scrolled ? ' scrolled' : ''}`}
    >
      <Link
        href="/"
        className="font-fraunces font-black text-2xl tracking-tighter uppercase cursor-pointer hover:text-ember transition-colors duration-300 relative z-10 text-bone"
      >
        BRUMA
      </Link>

      <nav className="hidden md:flex gap-3 relative z-10">
        <a href="#" className="header-btn active font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block">
          Inicio
        </a>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="header-btn font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4 md:gap-6 relative z-10">
        <button
          onClick={() => router.push('/auth/login')}
          className="header-btn font-geist text-[9px] uppercase tracking-[0.2em] font-bold select-none block"
        >
          Iniciar Sesión
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/LandingHeader.tsx
git commit -m "feat: add LandingHeader with scroll-aware transparent-to-solid nav"
```

---

### Task 6: Build `LandingFooter.tsx` (visual-designer)

**Files:**
- Create: `src/components/layout/LandingFooter.tsx`

**Interfaces:**
- Produces: `LandingFooter` named export, consumed by Task 7's
  `(landing)/layout.tsx`.

- [ ] **Step 1: Create the component**

```tsx
export function LandingFooter() {
  return (
    <footer className="bg-ember text-obsidian py-16 md:py-24 px-6 md:px-12 relative overflow-hidden select-none border-t border-ember/20 z-10">
      <div className="max-w-[1600px] mx-auto flex flex-col items-center justify-center text-center">
        <h2 className="font-fraunces font-black text-7xl md:text-[11rem] lg:text-[14rem] tracking-tighter uppercase leading-none">
          BRUMA
        </h2>
        <p className="font-geist text-sm md:text-xl lg:text-2xl font-black uppercase tracking-[0.6em] -mt-2 md:-mt-5 mb-8">
          fightwear
        </p>
        <div className="w-full h-[1px] bg-obsidian/10 my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-[10px] uppercase tracking-[0.2em] font-black text-obsidian/65">
          <div>© 2026 BRUMA Fightwear. Todos los derechos reservados.</div>
          <div>Cerrando el círculo. Forjado en Costa Rica.</div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/LandingFooter.tsx
git commit -m "feat: add LandingFooter with giant ember wordmark"
```

---

### Task 7: Build `(landing)/layout.tsx` (developer)

**Files:**
- Create: `src/app/(landing)/layout.tsx`

**Interfaces:**
- Consumes: `LandingHeader` (Task 5), `LandingFooter` (Task 6).
- Produces: layout wrapping any page inside the `(landing)` route group.

- [ ] **Step 1: Create the layout**

```tsx
import { LandingHeader } from '@/components/layout/LandingHeader'
import { LandingFooter } from '@/components/layout/LandingFooter'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingHeader />
      {children}
      <LandingFooter />
    </>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS. (There is no `page.tsx` in `(landing)` yet — Task 13 adds
it — so this layout won't render anything visible until then, but it must
compile cleanly now.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/(landing)/layout.tsx"
git commit -m "feat: add (landing) route group layout with header/footer"
```

---

### Task 8: Build `HomeHero.tsx` (visual-designer)

**Files:**
- Create: `src/components/marketing/HomeHero.tsx`

**Interfaces:**
- Produces: `HomeHero` named export, consumed by Task 13.

- [ ] **Step 1: Create the component**

```tsx
import Image from 'next/image'
import Link from 'next/link'

export function HomeHero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/brand/photography/costa-rica/opt3.jpg"
          alt="Cascada Aérea Costa Rica"
          fill
          priority
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent z-10 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center -mt-12 md:-mt-20">
        <div
          className="mb-16 md:mb-24 transform translate-y-4 opacity-0 animate-fade-in-up flex flex-col items-center"
        >
          <h1 className="font-fraunces font-black text-7xl md:text-[11rem] lg:text-[13rem] tracking-tighter uppercase text-bone select-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.98)] leading-none">
            BRUMA
          </h1>
          <p className="font-geist text-sm md:text-2xl lg:text-3xl text-bone/50 uppercase tracking-[0.55em] font-black -mt-2 md:-mt-4">
            fightwear
          </p>
        </div>

        <p
          className="font-fraunces italic font-light text-2xl md:text-3xl text-bone/85 tracking-wide mb-10 max-w-2xl leading-relaxed transform translate-y-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          &ldquo;Ante la bruma, mente serena.&rdquo;
        </p>

        <div
          className="transform translate-y-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '500ms' }}
        >
          <Link
            href="/auth/login"
            className="bg-ember text-obsidian px-8 py-4 rounded-[2px] font-bold uppercase text-xs tracking-[0.2em] hover:bg-ember/90 transition-all shadow-[0_0_20px_rgba(244,103,52,0.3)] duration-300 inline-block"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40 animate-pulse">
        <span className="text-[8px] uppercase tracking-[0.25em] text-bone">Explorar</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/HomeHero.tsx
git commit -m "feat: add HomeHero section"
```

---

### Task 9: Build `PhilosophySection.tsx` — Balance Perfecto (visual-designer)

**Files:**
- Create: `src/components/marketing/PhilosophySection.tsx`

**Interfaces:**
- Produces: `PhilosophySection` named export, renders `id="filosofia"`
  (the anchor `LandingHeader`'s "Filosofía" link points to), consumed by
  Task 13.

- [ ] **Step 1: Create the component**

```tsx
import Image from 'next/image'

export function PhilosophySection() {
  return (
    <section id="filosofia" className="relative py-12 md:py-16 px-6 md:px-12 bg-obsidian border-y border-bone/5 overflow-hidden">
      <div className="absolute -right-32 top-10 w-[500px] h-[500px] bg-ember/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto bg-surface/20 border border-bone/10 p-6 md:p-10 rounded-[12px] shadow-2xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-stretch">
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <Image
              src="/brand/logos/balance-negative.png"
              alt="Balance Perfecto - Dos Jaguares"
              width={450}
              height={450}
              className="w-full max-w-[390px] md:max-w-[450px] object-contain relative z-10 transition-transform duration-700 ease-out-expo filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <h3 className="font-fraunces text-4xl md:text-5xl font-black text-bone tracking-tight mb-5 leading-tight">
              Balance <span>Perfecto</span>
            </h3>

            <p className="font-fraunces text-lg md:text-xl text-bone/85 font-light leading-relaxed italic mb-4">
              &ldquo;Dos jaguares en posición de pelea: un homenaje al balance del camino marcial.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
```

(The prototype's "Conoce el origen" link pointed to `href="#"` — a dead
anchor. It is dropped here rather than ported as another broken link;
substantive copy is preserved.)

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/PhilosophySection.tsx
git commit -m "feat: add PhilosophySection (Balance Perfecto)"
```

---

### Task 10: Build `EmblemSection.tsx` — Balance rotating emblem (visual-designer)

**Files:**
- Create: `src/components/marketing/EmblemSection.tsx`

**Interfaces:**
- Consumes: `.tactical-grid-dark`, `.animate-rotate-slow` (Task 4).
- Produces: `EmblemSection` named export, consumed by Task 13.

- [ ] **Step 1: Create the component**

```tsx
import Image from 'next/image'

export function EmblemSection() {
  return (
    <section className="relative py-12 md:py-16 px-6 overflow-hidden border-t border-obsidian/10 bg-bone text-obsidian">
      <div className="absolute inset-0 tactical-grid-dark opacity-[0.06] pointer-events-none" />

      <div className="max-w-[1800px] mx-auto text-center relative flex flex-col items-center">
        <div className="relative w-full max-w-[1100px] min-h-[420px] md:min-h-[680px] flex items-center justify-center mb-10 select-none">
          <div className="absolute z-10 w-[390px] h-[340px] md:w-[640px] md:h-[640px] flex items-center justify-center animate-rotate-slow pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path id="circlePath" d="M 100,16 A 84,84 0 1,1 99.99,16 Z" fill="none" />
              <text className="font-geist text-[5.0px] md:text-[7.1px] uppercase tracking-[0.24em] fill-obsidian font-black" style={{ fillOpacity: 0.65 }}>
                <textPath href="#circlePath" startOffset="0%">
                  En la niebla se esconde una silueta  •  Invisible para muchos, inevitable para quien lo ve
                </textPath>
              </text>
            </svg>
          </div>

          <div className="relative z-20 w-[310px] h-[310px] md:w-[480px] md:h-[480px] flex items-center justify-center transition-transform duration-1000 ease-out-expo hover:scale-105">
            <Image
              src="/brand/logos/logo-circle-original-no-background.png"
              alt="Emblema Circular BRUMA"
              width={480}
              height={480}
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(26,18,8,0.12)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/EmblemSection.tsx
git commit -m "feat: add EmblemSection with rotating circular text"
```

---

### Task 11: Build `RaicesSection.tsx` — interactive accordion (visual-designer, PRIORITY)

**Why this is the priority component:** the user explicitly called out
the Raíces grid accordion as important to preserve. The prototype drives
it with vanilla JS that reads `window.innerWidth` at click/hover time and
writes `gridTemplateRows`/`gridTemplateColumns` directly. This port uses
React state (`activeIndex`) to set **both** `--grid-cols` and
`--grid-rows` CSS custom properties on every change; the CSS media query
already added in Task 4 picks whichever one applies at the current
viewport width. This is equivalent in every render but doesn't go stale
on window resize the way the prototype's snapshot-at-interaction-time
approach does.

**Files:**
- Create: `src/components/marketing/RaicesSection.tsx`

**Interfaces:**
- Consumes: `.raices-grid`, `.raices-card`, `.vertical-text` (Task 4).
- Produces: `RaicesSection` named export, renders `id="raices"` (the
  anchor `LandingHeader`'s "Raíces" link points to), consumed by Task 13.

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'

const CARDS = [
  {
    tag: 'CONCENTRACIÓN',
    title: 'Ritual de Combate',
    description:
      'No hacemos prendas desechables. Forjamos armaduras biológicas preparadas para resistir las sesiones de entrenamiento más demandantes, inspirados en la persistencia de la fauna costarricense.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-01.PNG',
  },
  {
    tag: 'PRESENCIA',
    title: 'Mente Serena',
    description: 'Representamos el balance de la naturaleza: la calma y el caos en perfecta armonía.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-02.png',
  },
  {
    tag: 'DETALLE',
    title: 'Identidad Forjada',
    description:
      'Nacidos de las montañas de Cartago, nuestro equipamiento absorbe la humedad y resiste la torsión extrema, protegiendo al atleta bajo las condiciones más adversas.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-03.png',
  },
] as const

const GRID_VALUES = ['5fr 1fr 1fr', '1fr 5fr 1fr', '1fr 1fr 5fr']

export function RaicesSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const gridStyle = {
    '--grid-cols': GRID_VALUES[activeIndex],
    '--grid-rows': GRID_VALUES[activeIndex],
  } as CSSProperties

  return (
    <section id="raices" className="relative pt-12 md:pt-14 pb-12 md:pb-16 px-6 md:px-12 w-full overflow-hidden bg-obsidian">
      <div className="max-w-[1100px] mx-auto relative z-10 w-full">
        <div className="max-w-4xl mb-6">
          <h3 className="font-fraunces text-[1.95rem] md:text-[2.65rem] font-black text-bone tracking-tight mb-3 leading-tight">
            Más que una marca
          </h3>
          <p className="font-fraunces text-xl md:text-[1.55rem] text-bone/90 font-light leading-relaxed italic">
            &ldquo;Una forma de ser auténticos, firmes y conectados a nuestras raíces.&rdquo;
          </p>
        </div>

        <div className="raices-grid min-h-[385px] md:h-[505px] select-none mt-4" style={gridStyle}>
          {CARDS.map((card, index) => {
            const isActive = index === activeIndex
            return (
              <div
                key={card.title}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`raices-card group relative rounded-[8px] overflow-hidden border border-bone/10 cursor-pointer flex flex-col justify-between bg-[#120d06] shadow-xl min-w-0 min-h-0${isActive ? ' active' : ''}`}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover object-top transition-all duration-700 ease-out-expo z-0"
                />

                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 opacity-0 group-[.active]:opacity-100 transition-opacity duration-500 ease-out-expo pointer-events-none" />

                <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end pointer-events-none">
                  <div className="translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-75 pointer-events-none">
                    <span className="text-[9px] font-bold text-ember uppercase tracking-[0.2em] mb-1.5 block">
                      {card.tag}
                    </span>
                  </div>

                  <h4 className="font-fraunces text-2xl md:text-3xl font-black text-bone leading-tight mb-3 translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-100 pointer-events-none">
                    {card.title}
                  </h4>

                  <p className="font-geist text-xs md:text-sm text-bone/75 font-light leading-relaxed max-w-sm translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-150 pointer-events-none">
                    {card.description}
                  </p>
                </div>

                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">
                  <span className="font-fraunces text-4xl font-black text-bone/20 group-[.active]:opacity-0 transition-opacity duration-300">
                    .0{index + 1}
                  </span>

                  <div className="hidden md:flex mt-auto group-[.active]:opacity-0 transition-opacity duration-300 origin-top-left vertical-text ml-4 mb-4">
                    <span className="font-fraunces text-base font-bold text-bone/80 tracking-wide whitespace-nowrap">
                      {card.title}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

Once Task 13 wires this into the home page, verify in the browser: click
each card → the active card expands to `5fr` in its row/column, the other
two collapse to `1fr`, with a 500ms smooth transition; hovering also
switches the active card (matches prototype behavior of
`click`/`mouseenter` both calling `activateCard`).

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/RaicesSection.tsx
git commit -m "feat: add RaicesSection interactive 3-card grid accordion"
```

---

### Task 12: Build `ContactSection.tsx` (visual-designer)

**Files:**
- Create: `src/components/marketing/ContactSection.tsx`

**Interfaces:**
- Consumes: `.flora-glass` (existing), `.input-bruma`, `.label-bruma`,
  `.btn-bruma-primary` (Task 4).
- Produces: `ContactSection` named export, renders `id="contacto"` (the
  anchor `LandingHeader`'s "Contacto" link points to), consumed by
  Task 13.

- [ ] **Step 1: Create the component**

```tsx
export function ContactSection() {
  return (
    <section id="contacto" className="relative py-28 md:py-36 px-6 md:px-12 border-t border-bone/10 bg-[#120d06] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.06] mix-blend-color-dodge pointer-events-none"
        style={{ backgroundImage: "url('/brand/patterns/Bruma-Pattern-01.png')", backgroundSize: '200px' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />

      <div className="max-w-[1300px] mx-auto relative z-10 grid grid-cols-12 gap-12 items-start">
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <div className="font-fraunces font-black text-2xl tracking-tighter uppercase text-bone mb-8 select-none">
              BRUMA
            </div>
            <h4 className="font-fraunces text-3xl font-light italic text-bone mb-6">
              Ante la bruma, mente serena.
            </h4>

            <div className="space-y-6 font-geist text-xs tracking-wider font-light text-bone/60">
              <div className="flex items-start gap-4">
                <svg className="text-ember shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span className="text-bone/80 font-semibold block mb-0.5">Ubicación</span>
                  <span>Cartago, Costa Rica (9.8601° N, 83.9178° W)</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="text-ember shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <div>
                  <span className="text-bone/80 font-semibold block mb-0.5">Comunidad</span>
                  <a href="https://www.instagram.com/brumafightwear/" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">
                    @brumafightwear
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-bone/10 text-bone/35 text-[9px] uppercase tracking-[0.25em] leading-loose">
            © 2026 BRUMA Fightwear.
            <br />
            Cerrando el círculo. Forjado en Costa Rica.
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="flora-glass rounded-[4px] p-6 md:p-10 shadow-2xl">
            <h4 className="font-fraunces text-2xl font-bold text-bone mb-2">Conéctate al Manto</h4>
            <p className="font-geist text-xs text-bone/50 tracking-wide font-light mb-8">
              Escríbenos para unirte a la legión del balance.
            </p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-bruma" htmlFor="contact-name">Nombre</label>
                  <input type="text" id="contact-name" className="input-bruma" placeholder="TU NOMBRE" required />
                </div>
                <div>
                  <label className="label-bruma" htmlFor="contact-email">Correo Electrónico</label>
                  <input type="email" id="contact-email" className="input-bruma" placeholder="EMAIL@DIRECCION.COM" required />
                </div>
              </div>

              <div>
                <label className="label-bruma" htmlFor="contact-message">Mensaje</label>
                <textarea id="contact-message" rows={4} className="input-bruma !resize-none" placeholder="REVELA TU MENSAJE..." required />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-bruma-primary">
                  Enviar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
```

Note: form `onSubmit` only calls `preventDefault()` — per the approved
spec, contact-form backend wiring is explicitly out of scope for this
port (visual layout only).

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/ContactSection.tsx
git commit -m "feat: add ContactSection"
```

---

### Task 13: Assemble `(landing)/page.tsx`, resolve 2 FINDINGS items (developer)

**Files:**
- Create: `src/app/(landing)/page.tsx`
- Modify: `FINDINGS.md`

**Interfaces:**
- Consumes: `HomeHero` (Task 8), `PhilosophySection` (Task 9),
  `EmblemSection` (Task 10), `RaicesSection` (Task 11), `ContactSection`
  (Task 12).

- [ ] **Step 1: Create the home page**

```tsx
import { HomeHero } from '@/components/marketing/HomeHero'
import { PhilosophySection } from '@/components/marketing/PhilosophySection'
import { EmblemSection } from '@/components/marketing/EmblemSection'
import { RaicesSection } from '@/components/marketing/RaicesSection'
import { ContactSection } from '@/components/marketing/ContactSection'

export default function HomePage() {
  return (
    <div className="relative z-10">
      <HomeHero />
      <PhilosophySection />
      <EmblemSection />
      <RaicesSection />
      <ContactSection />
    </div>
  )
}
```

- [ ] **Step 2: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/`.

Expected:
- Hero renders full-bleed with Costa Rica cascade background, BRUMA
  wordmark fades in.
- Scrolling past 80px triggers the header to switch from transparent to
  solid (`.scrolled`).
- Nav anchors `Filosofía` → `#filosofia`, `Raíces` → `#raices`,
  `Contacto` → `#contacto` all scroll to their sections (no more dead
  `/catalog` `/philosophy` `/logistics` links on this page — those only
  ever existed in the now-unrendered `GlobalHeader`).
- Clicking "Iniciar Sesión" (nav or hero button) navigates to
  `/auth/login`.
- Raíces accordion responds to click/hover on each of the 3 cards.
- Footer renders with giant Ember wordmark.

- [ ] **Step 3: Mark two FINDINGS.md items resolved**

In `FINDINGS.md`, under "Animaciones/mecanismos", change:
```
- [ ] **Animaciones en JS/CSS no implementadas** — El prototipo HTML en `design-demos/landing-final/bruma-final.html` define `accordion-down`, `shimmer`, `scroll-reveal`, `portal-transition`, `portal-form-transition`, `balance-accordion`, `scroll-reveal-text`, `nav-horizontal-wall.scrolled`, etc., pero **no hay componentes React ni CSS en src/** que implementen esos nombres de clase (`.balance-accordion-item`, `#scroll-reveal-text`, `.nav-horizontal-wall.scrolled`, etc.).
```
to:
```
- [x] **Animaciones en JS/CSS no implementadas** — RESUELTO (fidelidad media, según decisión explícita del usuario): `nav-horizontal-wall.scrolled`, `raices-grid`/accordion interactivo, `portal-form-transition`, `rotateSlow`, `sweep` y los estilos `btn-bruma-*`/`input-bruma` fueron portados a `globals.css` + componentes React reales. `scroll-reveal-text` (palabra por palabra) fue explícitamente excluido del alcance.
```

Under "Prototipo vs implementación", change:
```
- [ ] **Rutas de prototipo no conectadas** — El prototipo HTML apunta a anchors internos (`#catalog`, `#philosophy`, `#logistics`, `#raices`, `#contacto`), pero el código Next.js actual NO tiene estos IDs de navegación (el header solo enlaza a `/catalog`, `/philosophy`, `/logistics` que no existen).
```
to:
```
- [x] **Rutas de prototipo no conectadas** — RESUELTO: `LandingHeader` enlaza a `#filosofia`/`#raices`/`#contacto`, que ahora existen como IDs reales en `HomePage` (`PhilosophySection`, `RaicesSection`, `ContactSection`), más un botón real a `/auth/login`. `GlobalHeader.tsx` (con los enlaces rotos `/catalog` `/philosophy` `/logistics`) ya no se renderiza en ningún layout — queda como archivo sin uso, fuera del alcance de este trabajo (finding separado: "Rutas globales rotas").
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(landing)/page.tsx" FINDINGS.md
git commit -m "feat: assemble Home page from sections, connect prototype anchors to real routes"
```

---

### Task 14: Build `LoginPage.tsx` / `RegisterPage.tsx` (visual-designer)

**Deviation from the original design spec, found during verification:**
the spec listed `FloraGlass` and `Fauna` as reused inside these wrappers,
carried over from `NewAuthPage.tsx`'s decorative style. Re-reading the
actual prototype's portal markup (`bruma-final.html:644-772`, verified
during brainstorming) shows the real login/register visual is a plain
two-column split — solid Bone-colored panel with the circular emblem on
the left (desktop only), plain Obsidian panel with the form on the right
— with **no** `FloraGlass` glassmorphism and **no** `Fauna` jaguar/lapa
decorations anywhere in that view. Since `bruma-final.html` is the
declared source of truth and `NewAuthPage.tsx` is being deleted (Task 3)
rather than adapted, this task follows the verified prototype markup, not
the spec's assumption. `FloraGlass` is still used elsewhere (Contact
section, Task 12); `Fauna` is not used anywhere in this ported flow.

**Files:**
- Create: `src/components/auth/LoginPage.tsx`
- Create: `src/components/auth/RegisterPage.tsx`

**Interfaces:**
- Consumes: `LoginForm` / `RegisterForm` (existing,
  `src/components/auth/LoginForm.tsx` / `RegisterForm.tsx`, unchanged —
  signature `{ onSuccess: () => void; onToggleMode: () => void }`).
  `onToggleMode` is passed a no-op since these are now separate routes;
  switching is a real `next/link` navigation rendered outside the form.
- Produces: `LoginPage` / `RegisterPage` named exports, consumed by
  Task 15's route files.

- [ ] **Step 1: Create `LoginPage.tsx`**

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex bg-obsidian">
      <div className="hidden lg:flex relative w-1/2 h-full bg-bone items-center justify-center select-none">
        <div className="absolute inset-0 tactical-grid-dark opacity-[0.06] pointer-events-none" />
        <Image
          src="/brand/logos/logo-circle-original-no-background.png"
          alt="Emblema Circular BRUMA"
          width={384}
          height={384}
          className="relative z-10 w-64 md:w-80 lg:w-96 object-contain drop-shadow-[0_20px_50px_rgba(26,18,8,0.12)]"
        />
      </div>

      <div className="w-full lg:w-1/2 h-full relative flex items-center justify-center bg-obsidian border-l border-bone/5 overflow-y-auto">
        <div className="relative w-full max-w-md px-6 py-12">
          <div className="flex flex-col items-center mb-8">
            <span className="font-fraunces font-black text-3xl tracking-tighter uppercase text-bone select-none">
              BRUMA
            </span>
            <span className="text-[8px] text-ember uppercase tracking-[0.3em] font-bold mt-1">
              Inicia la Expedición
            </span>
          </div>

          <LoginForm onSuccess={() => router.push('/dashboard')} onToggleMode={() => {}} />

          <div className="mt-8 pt-6 border-t border-bone/10 text-center">
            <span className="text-[10px] text-bone/40 font-light tracking-wide">¿Aún sin credenciales?</span>
            <Link
              href="/auth/register"
              className="text-[10px] text-ember font-bold hover:underline tracking-widest uppercase ml-2"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `RegisterPage.tsx`**

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex bg-obsidian">
      <div className="hidden lg:flex relative w-1/2 h-full bg-bone items-center justify-center select-none">
        <div className="absolute inset-0 tactical-grid-dark opacity-[0.06] pointer-events-none" />
        <Image
          src="/brand/logos/logo-circle-original-no-background.png"
          alt="Emblema Circular BRUMA"
          width={384}
          height={384}
          className="relative z-10 w-64 md:w-80 lg:w-96 object-contain drop-shadow-[0_20px_50px_rgba(26,18,8,0.12)]"
        />
      </div>

      <div className="w-full lg:w-1/2 h-full relative flex items-center justify-center bg-obsidian border-l border-bone/5 overflow-y-auto">
        <div className="relative w-full max-w-md px-6 py-12">
          <div className="flex flex-col items-center mb-6">
            <span className="font-fraunces font-black text-3xl tracking-tighter uppercase text-bone select-none">
              BRUMA
            </span>
            <span className="text-[8px] text-ember uppercase tracking-[0.3em] font-bold mt-1">
              Únete a la Legión
            </span>
          </div>

          <RegisterForm onSuccess={() => router.push('/dashboard')} onToggleMode={() => {}} />

          <div className="mt-6 pt-5 border-t border-bone/10 text-center">
            <span className="text-[10px] text-bone/40 font-light tracking-wide">¿Ya eres parte?</span>
            <Link
              href="/auth/login"
              className="text-[10px] text-ember font-bold hover:underline tracking-widest uppercase ml-2"
            >
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/LoginPage.tsx src/components/auth/RegisterPage.tsx
git commit -m "feat: add LoginPage/RegisterPage visual wrappers around existing LoginForm/RegisterForm"
```

---

### Task 15: Wire `/auth/login` and `/auth/register` routes, resolve final FINDINGS item (developer)

**Files:**
- Create: `src/app/auth/layout.tsx`
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/register/page.tsx`
- Modify: `FINDINGS.md`

**Interfaces:**
- Consumes: `LoginPage` / `RegisterPage` (Task 14).

- [ ] **Step 1: Create the bare auth layout**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

(No header/footer — `LoginPage`/`RegisterPage` each render a full-viewport
`fixed inset-0` panel, matching the approved design's requirement that
auth pages have no nav chrome.)

- [ ] **Step 2: Create the login route**

```tsx
import { LoginPage } from '@/components/auth/LoginPage'

export default function Page() {
  return <LoginPage />
}
```

- [ ] **Step 3: Create the register route**

```tsx
import { RegisterPage } from '@/components/auth/RegisterPage'

export default function Page() {
  return <RegisterPage />
}
```

- [ ] **Step 4: Verify the full navigation flow in the browser**

Run: `npm run dev` (if not already running).

Walk through:
1. `http://localhost:3000/` → click "Iniciar Sesión" in nav → lands on
   `/auth/login`, no header/footer visible, two-column layout (Bone panel
   + emblem on desktop, form on Obsidian panel).
2. On `/auth/login`, click "Regístrate" → navigates to `/auth/register`
   (real page navigation, not a client-side toggle).
3. On `/auth/register`, click "Inicia Sesión" → navigates back to
   `/auth/login`.
4. Confirm `AdminLayout`'s existing logout button
   (`src/components/layout/AdminLayout.tsx:39`,
   `router.push('/auth/login')`) and `ProtectedRoute`'s existing redirect
   (`src/components/auth/ProtectedRoute.tsx:15`,
   `redirectTo = '/auth/login'`) both now resolve to a real, working page
   instead of a 404 — no code change needed there, this is confirmation
   that the pre-existing redirect targets are now correct.

- [ ] **Step 5: Mark the last FINDINGS.md item resolved**

In `FINDINGS.md`, under "Admin & Auth", change:
```
- [ ] **Rutas Auth faltantes** — NewAuthPage.tsx y AuthPage.tsx reference `/auth/login` y `/auth/register`, pero `src/app/auth/(login|register)` **no existe**. La ruta `/auth/login` que cierra sesión con el botón "Disconnect" en AdminLayout es una referencia rota.
```
to:
```
- [x] **Rutas Auth faltantes** — RESUELTO: `src/app/auth/login/page.tsx` y `src/app/auth/register/page.tsx` existen y funcionan, renderizando `LoginPage`/`RegisterPage`. El logout de `AdminLayout` y el redirect de `ProtectedRoute` (ambos ya apuntaban a `/auth/login`) ahora resuelven correctamente.
```

- [ ] **Step 6: Full project type-check**

Run: `npm run type-check`
Expected: PASS with zero errors across the whole project.

- [ ] **Step 7: Commit**

```bash
git add src/app/auth FINDINGS.md
git commit -m "feat: wire /auth/login and /auth/register routes

Resolves the last of the 4 FINDINGS.md items closed by this port: rutas
auth faltantes, importación rota de SmartLogo, animaciones no portadas,
rutas de prototipo no conectadas."
```

---

## Post-plan state check (not a task — a note for the executor)

After Task 15, `GlobalHeader.tsx` and `GlobalBackground.tsx` remain as
files but `GlobalHeader` is no longer imported/rendered anywhere (its
broken `/catalog` `/philosophy` `/logistics` links are the pre-existing,
separately-tracked "Rutas globales rotas" FINDINGS item — explicitly out
of this plan's scope, left untouched, still `[ ]` open). `GlobalBackground`
remains rendered globally from root `layout.tsx` and is still correct to
keep (tactical-grid + bruma-wash apply cleanly under both the landing and
auth experiences).
