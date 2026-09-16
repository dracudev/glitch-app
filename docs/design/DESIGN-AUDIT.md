# Glitch — Frontend Design & Consistency Audit

**Date:** 2026-09-16
**Scope:** `apps/frontend` (Astro 5.14 + React 19 + Tailwind CSS 4.1)
**Method:** full source read of every component/page/layout, plus live verification in Chrome
(Playwright) against `localhost:4321`, measuring computed styles and geometry at 1440×900 and 390×844.
**Verdict:** the frontend is functional and the visual language is *almost* there, but it is enforced by
convention rather than by a system. Roughly 30 style call sites are silently dead, the layout shell is
re-declared on every page, and there are five different answers to "what is a modal".

---

## 1. Reported issues — all confirmed, with root causes

### 1.1 Modals fully black out the background

Measured live on the Write-a-Review dialog:

| Property | Value |
|---|---|
| overlay class | `fixed inset-0 bg-black bg-opacity-50 z-40` |
| computed background | `rgb(0, 0, 0)` — **100% opaque** |
| `backdrop-filter` | `none` — **no blur** |

**Root cause:** `bg-opacity-50` is the Tailwind **v3** API, removed in v4. Glitch runs Tailwind 4.1.12.
The running stylesheet emits **zero rules** for it, so `bg-black` is the only class that lands.
Identical bug at `ReviewActions.tsx:319` (delete confirmation).

Two further defects in the same overlay:

- The backdrop is `z-40` while the navbar is `z-50`, so **the navbar paints on top of the black
  overlay and stays clickable while a modal is open.**
- The dialog has `role="dialog"` and `aria-labelledby` but **no `aria-modal` and no `aria-describedby`**.

Five different overlay treatments exist in the app:

| File | Overlay | Blur | Surface | z |
|---|---|---|---|---|
| `ReviewFormDialog.tsx:116` | `bg-black` + dead `/50` → solid black | no | `bg-secondary` | 40 |
| `ReviewActions.tsx:319` | `bg-black` + dead `/50` → solid black | no | `bg-card` | 60 |
| `FilterSidebar.tsx:217` | `bg-black/50` | yes | `bg-background`, `rounded-t-2xl` | 50 |
| `Navbar.tsx:222` | `bg-[var(--bg-primary)]/80` | yes | `bg-[var(--bg-secondary)]` | 60 |
| `EditProfileDialog.tsx:86` | `bg-black/50` | yes | `bg-card`, `rounded-lg` | 50 |

Every dialog also carries `data-[state=open]:animate-in fade-in-0 zoom-in-95`, but
**`tailwindcss-animate` is not installed**, so dialogs have no entrance transition at all.

### 1.2 Home page is a placeholder

`pages/index.astro` renders two elements — "Welcome to Glitch" and "Your Social Network for Gaming".
Measured: `<main>` is **531px tall in a 900px viewport**, so the footer's top edge is already visible at
y=596. No logo, no imagery, no links to `/games` or `/reviews`, no CTA. `/` is also unreachable from the
navbar, which points "Home" at `/feed`.

### 1.3 Navbar overlaps the `/games` filter sidebar

Measured at 1440×900, scrolled 500px:

| Probe | Result |
|---|---|
| navbar rect | top 0, height 65, `z-index: 50` |
| sidebar sticky rect | top **24px** (`top-6`), `z-index: auto` |
| "Filters" heading | top 49 → 69 (top 16px hidden) |
| `elementFromPoint(sidebar.left+20, sidebar.top+10)` | **`IMG.w-8 h-8`** — the navbar logo |

**Root cause:** the sidebar's sticky offset (`top-6` = 24px) never cleared the 64px navbar, and the
navbar's explicit `z-50` beats the sidebar's `z-index: auto`.

### 1.4 Navbar not aligned with page content

| Element | Left edge at 1440px |
|---|---|
| navbar inner row | **112px** |
| footer inner row | **112px** |
| `/games` page `h1` | **96px** |
| `/reviews` page `h1` | **96px** |

**Root cause:** page containers hard-code `px-4` and never scale, while navbar/footer use
`px-4 sm:px-6 lg:px-8`. At 390px both are 16px, so the misalignment appears **only from 640px up**.
Second layer: page max-widths disagree (`none` / `max-w-4xl` / `max-w-6xl` / `max-w-7xl` / `max-w-3xl`).

Additionally the nav links are **not centred on the page**: at 1440px they occupy x=511–742
(centre **626**) against a viewport centre of **720**. They are centred in the leftover flex space of a
`justify-between` row, not on the page axis.

---

## 2. Additional findings

### 2.1 Dead utility classes — the largest single inconsistency

Verified by checking the live stylesheet for emitted rules and by injecting nodes and reading computed
style. **All of the following generate zero CSS and are silent no-ops.**

| Class pattern | Call sites | Actual render |
|---|---|---|
| `bg-opacity-50` | `ReviewFormDialog`, `ReviewActions` | solid opaque black |
| `bg-state-error` `text-state-error` `border-state-error` (+ `/10` `/20` `/80`) | `LoginForm`, `RegisterForm`, `ReviewContent`, `ReviewActions` | plain unstyled text |
| `bg-state-warning` `text-state-warning` `border-state-warning/20` | `NoScriptFallback`, `ReviewContent` | unstyled |
| `bg-state-info` `text-state-info` `border-state-info` | `ReviewContent` | unstyled |
| `bg-error` `text-error` `border-error` `bg-success` `text-success` `border-success` | `EditProfileDialog`, both `ReviewList`s | unstyled |
| `border-tertiary` / `border-tertiary/50` | `Footer` ×2, `Card` | falls back to `currentColor` → measured `rgb(75,85,99)`, a heavy dark grey rule |
| `z-tooltip` `z-toast` `fill-popover` | `ReviewActions`, `Notifications` | nothing |
| `text-brand-accent` `ring-brand-accent` | `ThemeToggle` ×4, `Navbar` | nothing — theme-toggle and avatar focus rings are invisible |
| `text-h2` | `ReviewContent` | nothing |
| `border-[var(--accent-error)]` | `FollowButton` | nothing — `--accent-error` is never defined |

Consequence: **every error message, warning banner, spoiler notice, unpublished-review banner and
validation error in the app renders unstyled.**

### 2.2 Token layer

- `--color-secondary` maps to `--bg-secondary` (a *surface*) while `--text-secondary` is the *ink*.
  So Tailwind `text-secondary` = near-white and `bg-primary` = saturated purple.
  `BaseLayout.astro:130` is `<body class="… bg-primary text-secondary">` and only renders correctly
  because the **unlayered** `body` rule in `global.css` outranks Tailwind's `@layer utilities`.
  Move that rule into a layer and the entire site's background and ink break.
- `--radius-*`, `--space-*` and `--z-*` are declared and **never referenced**.
- Dark mode yields **two different values for `--bg-tertiary` depending on the OS setting**:
  the `.dark` block sets `#45413b` (warm brown), the
  `@media (prefers-color-scheme: dark) { :root:not(.light) }` block sets `#3b3e45` (cool blue-grey),
  and the media block also matches `.dark`. Measured: OS-light + `.dark` → `#45413b`;
  OS-dark (with or without `.dark`) → `#3b3e45`.
- The warm-brown tertiary fights the cool-charcoal base (`#16161a` / `#242629`).

### 2.3 Shape language

Radius usage across the app: `rounded` **61** · `rounded-lg` **56** · `rounded-md` **39** ·
`rounded-full` **29** · `rounded-t` **1**. The same "pill" concept renders three different ways:
`rounded-full` (FilterSidebar count badge), `rounded-md` (GameHeader platform pills),
`rounded-lg` (GameCard badges).

Shadows: 30 shadow utilities, **all** default symmetric all-around blooms
(`shadow-lg` ×15, `shadow-sm` ×6, `shadow-md` ×4, `shadow-xl` ×3).

Hover: five different interactions for the same "card" idea —
`hover:border-primary` + `hover:shadow-lg` (ReviewCard), `hover:border-accent` (FollowList),
`hover:scale-[1.02]` + image `group-hover:scale-105` (GameCard, a doubled boop),
`hover:shadow-md` (FeedItem), `hover:opacity-90` (Button).

### 2.4 Colour

- **Three star colours for one concept:** green `text-accent` (ReviewCard), hardcoded
  `fill-yellow-400` (GameCard), purple `--brand-primary` (StarRating).
- **Two red families for errors:** the `--state-error` token vs raw `red-50/500/600/700/900`
  in `pages/games/index.astro` and `ReviewFormDialog`.
- Saturated purple sprayed across text links, focus rings, buttons, stars and badges.
- Off-token hardcodes: `text-white` (MobileFilterButton), `bg-white` (EditProfileDialog switch knob),
  `bg-black/50`.

### 2.5 Typography

- Inter carries the entire type system with no display face.
- Page `h1` uses **six** treatments: `text-3xl` (×5 — the same "Your Feed" heading duplicated
  verbatim five times in `ActivityFeedPage`), `text-4xl`, `text-3xl tracking-tight lg:text-4xl`,
  `text-2xl md:text-3xl lg:text-4xl`, `text-2xl lg:text-3xl`, `text-5xl`.
- Four idioms for the same dim-text role: `text-muted-foreground`, `text-[var(--text-muted)]`,
  `text-[var(--text-secondary)]`, `text-muted`.

### 2.6 Components

- **`Card.tsx` is used by only two files** (LoginForm, RegisterForm). Every other card is hand-rolled
  `bg-card rounded-lg border border-border`, and `Card` itself uses the older `bg-secondary` token.
- Hand-rolled buttons remain in ReviewActions (Share), StarRating (stars), EditProfileDialog
  (switch + close), Navbar (nav items) and all Tabs triggers.
- **`Footer.tsx` is styled with 16 inline style objects and 11 `onMouseEnter`/`onMouseLeave` JS style
  mutations** instead of `hover:` classes, so keyboard users get no feedback parity.
- Var-driven inline styles dominate `FeedItem` (18), `FeedItemSkeleton` (11), `ActivityFeedList` (10),
  `StarRating` (2), `Notifications` (1) — those islands bypass Tailwind entirely.

### 2.7 Routing & content

- **"Home" in the navbar points to `/feed`, not `/`.** The real home page is only reachable via the logo.
  `isActiveRoute` contains an `href === '/'` branch that can never match.
- `/settings` is linked from the navbar twice and the route does not exist.
- Footer links to `/about`, `/blog`, `/help`, `/support`, `/privacy`, `/terms` — placeholders.
  `pages/indie/` and `pages/users/` are empty directories.
- `MainLayout` / `BaseLayout` / `AuthLayout` have **no `<slot name="head" />`**, so the
  `slot="head"` metas passed by `pages/feed/index.astro` are silently discarded.
- `pages/feed/index.astro` wraps the page in `min-h-screen` inside a layout that already provides
  `min-h-screen` + `flex-1`.
- The footer grid is `md:grid-cols-4` with the brand spanning 2, leaving a ~128px dead gulf.

### 2.8 Accessibility

- No `<img>` in the app sets `width`/`height`/`decoding` → layout shift on every cover image.
  `loading="lazy"` appears only in `ReviewCard`; `ReviewHeader` and `GameHeader` lack even that.
- The delete-confirmation "modal" is a plain `<div>`: no focus trap, no Escape, no focus restore,
  no dialog role.
- Three competing focus treatments: `outline-none` ×32, `ring-2` ×21, `border-primary` ×6.
- The active nav item is the **same purple** as inactive, distinguished only by a faint surface tint.

---

## 3. Root causes

1. **The theme layer is half-migrated.** Tokens the code never uses are declared; tokens the code
   *does* use are missing. One Tailwind v3 API (`bg-opacity-50`) survived the v4 upgrade.
2. **No shared page shell.** Eight page containers each hand-declare gutter, max-width and rhythm.
3. **No shared overlay/dialog contract.** Five hand-rolled overlays, one of which is not a dialog.

---

## 4. Remediation

Delivered in this repository:

- `apps/frontend/src/styles/global.css` — rebuilt as a complete token system; the missing colour tokens
  now exist, so the dead classes resolve without editing every call site.
- `docs/design/DESIGN-SYSTEM.md` — the specification for the system.
- `/DESIGN.md` — the machine-readable design contract for this project.

See `/DESIGN.md` for the current palette, type scale, radius and elevation scale.
