# Glitch — Design System

**Scope:** `apps/frontend` (Astro 5 + React 19 + Tailwind CSS 4)
**Source of truth:** `apps/frontend/src/styles/global.css`
**Brand rationale:** `/DESIGN.md` · **Historical findings:** `/DESIGN-AUDIT.md`

This is the engineering reference. If you are adding a page or a component and need to
know which token to use, it is here. Every value in this document is read from
`global.css`; if a component disagrees, `global.css` wins and the component is wrong.

---

## 1. Purpose and scope

This document governs the visual layer of the web app: colour, type, spacing, shape,
depth, motion, z-index and the shared UI primitives.

**The one rule:**

> Components use token utilities only. They never name a raw colour, never use an
> arbitrary `var(--x)` class, and never use inline `style` except for a genuinely
> computed value.

```tsx
// Correct — tokens only
<div className="bg-card border border-border text-foreground" />

// Banned — raw colour
<div className="bg-[#161a11] border border-[#2c3324]" />

// Banned — arbitrary custom property in a class
<div className="bg-[var(--surface-raised)]" />

// Banned — inline style for something a utility can express
<div style={{ backgroundColor: 'var(--surface-raised)' }} />
```

The only sanctioned inline styles in the migrated tree are computed geometry that no
utility can express: `StarRating.tsx` sets `style={{ width: size, height: size }}` and the
per-star fill clip `style={{ width: `${fillPercent}%` }}`; `index.astro`'s progress-less
cover images and the `GameCard` fallback rely on classes, not styles.

Why the rule exists: the previous codebase declared tokens the code never used and used
tokens that were never declared, so roughly 30 style call sites were silent no-ops
(`DESIGN-AUDIT.md` §2.1). Token-only utilities make a missing token a build-visible
problem instead of an invisible one.

---

## 2. Architecture of `global.css`

The file is four numbered parts, in this order:

| Part | What it is | Why |
|---|---|---|
| `@theme` | Registers design decisions as Tailwind utilities | `--color-card` becomes `bg-card`; `--radius-lg` becomes `rounded-lg` |
| `:root` | **Dark** values for every brand/surface/ink token | Dark is the product default |
| `:root.light` | Light values for the **same variable names** | Light is opt-in, no second source of truth |
| `@layer base` | Element defaults for `body`, headings, `img`, focus, selection, `hr` | Layered so utilities always win |

Plus a `@keyframes` block and a `@utility` block (the custom utilities in §9).

### 2.1 Dark is the default, light is opt-in

`BaseLayout.astro` ships `<html lang="en" class="dark">`. An inline script in `<head>`
reads `localStorage.theme` and toggles `.light` / `.dark` **before first paint**, so an
absent or unreadable preference resolves to dark, never to the OS setting.

```html
<!-- BaseLayout.astro -->
<html lang="en" class="dark">
```

`ThemeToggle.tsx` only reads the class back and flips it plus the stored preference; it
does not own theme resolution.

### 2.2 There is no colour-scheme media query

`global.css` contains **no** `@media (prefers-color-scheme: …)` block. This is deliberate
and it fixed a real bug: the previous stylesheet had both a `.dark` block and a
`@media (prefers-color-scheme: dark) { :root:not(.light) }` block, so `--bg-tertiary`
resolved to `#45413b` (warm brown) on an OS set to light, and `#3b3e45` (cool blue-grey)
on an OS set to dark. One token, two values, neither written by the user. Because both
themes now set the **same variable names**, a token cannot disagree with itself depending
on how the theme was reached.

The only `prefers-color-scheme` in the app is the pair of `theme-color` meta tags in
`BaseLayout.astro`, which set the browser chrome colour and are correct as-is. Reduced
motion, by contrast, *is* handled in `global.css` (`@media (prefers-reduced-motion: reduce)`
collapses animation and transition durations to `0.01ms`).

### 2.3 `@custom-variant dark`

```css
@custom-variant dark (&:where(.dark, .dark *));
```

`dark:` follows the `.dark` class, not the OS. Because dark is the default and the tokens
re-theme themselves, **components should not need `dark:` colour variants at all** — and
the migrated tree contains none. The variant exists only for the rare element that must
differ when light is *explicitly* set.

### 2.4 `@layer base` — layered on purpose

The base element rules live inside `@layer base`. Previously they were unlayered, which
made them silently outrank every Tailwind utility. `BaseLayout`'s `<body>` class list only
rendered correctly by accident; moving the rule into a layer would have broken the whole
site. Layering the base rules restores the normal cascade: base is the floor, utilities
win.

---

## 3. The palette

Two hues carry the brand. This is deliberate, not a default:

- **Green is the primary/action colour.** Filled buttons, active nav, selected state,
  focused controls, star ratings.
- **Green is the accent/focus colour.** Links, the `outline` button hover, the
  `:focus-visible` ring, portrait and interactive edges.

They are near-complementary, so they read as a chosen pair rather than two unrelated
accent swatches. The surfaces between them are a **green-cast near-black** — not literal
black, and not the cool blue-charcoal most dark SaaS ships.

### 3.1 Brand hues

| Role | Token | Dark | Light | Intent |
|---|---|---|---|---|
| Primary | `--brand-primary` | `#a6f53a` | `#457f07` | Radioactive acid green. Actions and active state |
| Primary hover | `--brand-primary-hover` | `#baff5e` | `#3a6b05` | One step up (dark) / darker (light) |
| Primary ink | `--brand-primary-foreground` | `#0c1105` | `#ffffff` | Ink on a green fill |
| Accent | `--brand-accent` | `#a6f53a` | `#457f07` | Brand green. Links, focus, interactive edges |
| Accent hover | `--brand-accent-hover` | `#baff5e` | `#3a6b05` | Second accent step |
| Accent ink | `--brand-accent-foreground` | `#0c1105` | `#ffffff` | Ink on a green fill |
| Secondary | `--brand-secondary` | `#22281c` | `#eef1e8` | Muted surface: quiet chips, secondary buttons |
| Secondary hover | `--brand-secondary-hover` | `#2b3223` | `#e2e7d8` | Hover step for the muted surface |
| Secondary ink | `--brand-secondary-foreground` | `#eef3e6` | `#1a2010` | Ink on the muted surface |

Dark's acid green is a **signature**, not a semantic success colour by accident — but note
that `--state-success` also resolves to `#a6f53a` in dark, so green reads as both action
and success. In light they separate: `--brand-primary` is `#457f07`, `--state-success`
`#3f7a00`.

### 3.2 Surfaces (darkest → lightest)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--surface-sunken` | `#0a0c07` | `#ffffff` | Inputs, wells, anything recessed |
| `--surface-base` | `#0e1009` | `#f7f9f4` | Page background |
| `--surface-raised` | `#161a11` | `#ffffff` | Cards and page-level panels |
| `--surface-overlay` | `#1d2317` | `#ffffff` | Popovers, menus, dialog panels |
| `--surface-muted` | `#22281c` | `#edf1e6` | Muted chips, skeleton fills, quiet blocks |

### 3.3 Borders

| Token | Dark | Light | Role |
|---|---|---|---|
| `--border-default` | `#2c3324` | `#dfe5d5` | The hairline on every surface |
| `--border-strong` | `#414a34` | `#c3ccb4` | Emphasised outline, unchecked control, star track |
| `--border-hover` | `#55603f` | `#9aa886` | Border state on hover |

### 3.4 Ink

| Token | Dark | Light | Role |
|---|---|---|---|
| `--ink-primary` | `#f2f6ec` | `#14180f` | Headings and high-emphasis text |
| `--ink-secondary` | `#b7c0aa` | `#454d3c` | Body text (the `body` default) |
| `--ink-muted` | `#87917c` | `#5f6852` | Meta, captions, placeholders, dim labels |
| `--ink-inverse` | `#0e1009` | `#ffffff` | Ink that must invert against a surface |

### 3.5 State colours

The bare token is the state colour **as ink or as an `/opacity` tint**. The
`-foreground` companion is the **ink placed on that colour as a fill**.

| State | Token | Dark | `-foreground` | Light | `-foreground` |
|---|---|---|---|---|---|
| Error | `--state-error` | `#ff7d8d` | `#2a0509` | `#b3243c` | `#ffffff` |
| Success | `--state-success` | `#a6f53a` | `#0c1105` | `#3f7a00` | `#ffffff` |
| Warning | `--state-warning` | `#ffc44d` | `#2b1a00` | `#8a5a00` | `#ffffff` |
| Destructive | `--state-destructive` | `#e5484d` | `#ffffff` | `#c81e3c` | `#ffffff` |

Dark state foregrounds are very dark (tinted toward the state hue) because dark fills are
light; light foregrounds are white because light fills are dark.

**There is deliberately no `info` state.** It existed briefly and was removed: once the brand
collapsed to a single green, `--state-info` resolved to exactly the same value as
`--state-success` and `--brand-primary`, so an "info" banner rendered green and read as
either a success message or a primary action. A semantic token that resolves to another
token's value is worse than no token, because it silently lies. Informational notices use
the neutral treatment instead: `border-border bg-muted` with `text-foreground` for the
heading and `text-muted-foreground` for the body. Do not reintroduce an `info` colour; if a
genuinely distinct informational hue is ever needed, that is a brand decision, not a token
addition.

---

## 4. Full token tables

The `Utility` column lists the Tailwind v4 classes generated from the token. `+` means a
family (e.g. `bg-` / `text-` / `border-`).

### 4.1 Theme colour tokens → utilities

| Token | Utility | Use it for |
|---|---|---|
| `--color-primary` | `bg-primary` `text-primary` `border-primary` | Filled actions, active state, filled controls |
| `--color-primary-hover` | `bg-primary-hover` | Hover step on a primary fill |
| `--color-primary-foreground` | `text-primary-foreground` | Ink on primary |
| `--color-accent` | `text-accent` `border-accent` `fill-accent` | Links, focus ring, interactive edges |
| `--color-accent-hover` | `text-accent-hover` | Hover step for accent ink |
| `--color-accent-foreground` | `text-accent-foreground` | Ink on accent |
| `--color-secondary` | `bg-secondary` | Muted surface / secondary button |
| `--color-secondary-hover` | `bg-secondary-hover` | Hover step on muted surface |
| `--color-secondary-foreground` | `text-secondary-foreground` | Ink on muted surface |
| `--color-background` | `bg-background` | Page background |
| `--color-card` | `bg-card` | Card / panel surface |
| `--color-card-foreground` | `text-card-foreground` | Ink on a card |
| `--color-popover` | `bg-popover` | Menus, dialogs, poppers |
| `--color-popover-foreground` | `text-popover-foreground` | Ink on a popover |
| `--color-muted` | `bg-muted` | Quiet blocks, skeleton fills |
| `--color-muted-foreground` | `text-muted-foreground` | Dim text |
| `--color-input` | `bg-input` | Input background where it differs from the page |
| `--color-foreground` | `text-foreground` | Primary ink |
| `--color-foreground-secondary` | `text-foreground-secondary` | Body ink |
| `--color-border` | `border-border` | Default hairline |
| `--color-border-strong` | `border-border-strong` | Emphasised outline |
| `--color-border-hover` | `border-border-hover` | Hover border |
| `--color-ring` | `ring-ring` | Focus ring colour |
| `--color-ring-offset` | — | Feeds `--tw-ring-offset-color` in `@layer base` |
| `--color-error` / `-foreground` | `bg-error` `text-error` `border-error` | Error text, tint, fill |
| `--color-success` / `-foreground` | `bg-success` `text-success` | Success text, tint, fill |
| `--color-warning` / `-foreground` | `bg-warning` `text-warning` | Warning text, tint, fill |
| `--color-destructive` / `-foreground` | `bg-destructive` `text-destructive-foreground` | Destructive fill |

Do not use `text-secondary` as ink — `--color-secondary` is a **surface** (`#22281c`). Ink
lives on `--color-foreground`, `--color-foreground-secondary` and `--color-muted-foreground`.

### 4.2 Type scale

| Token | Utility | Value | Line height | Tracking |
|---|---|---|---|---|
| `--text-xs` | `text-xs` | 0.75rem / 12px | 1.4 | — |
| `--text-sm` | `text-sm` | 0.875rem / 14px | 1.5 | — |
| `--text-base` | `text-base` | 1rem / 16px | 1.6 | — |
| `--text-lg` | `text-lg` | 1.125rem / 18px | 1.55 | — |
| `--text-xl` | `text-xl` | 1.375rem / 22px | 1.4 | — |
| `--text-2xl` | `text-2xl` | 1.75rem / 28px | 1.25 | -0.015em |
| `--text-3xl` | `text-3xl` | 2.125rem / 34px | 1.15 | -0.02em |
| `--text-4xl` | `text-4xl` | 2.75rem / 44px | 1.08 | -0.025em |
| `--text-5xl` | `text-5xl` | 3.5rem / 56px | 1.03 | -0.03em |
| `--text-6xl` | `text-6xl` | 4.5rem / 72px | 1 | -0.035em |

Only `2xl` and above carry tracking, so display type stays composed instead of loose.
Note that `tracking-tight` is therefore often redundant on `text-2xl`+; the type-scale
recipe in §7 writes it only where the scale does not already supply it.

### 4.3 Radius

Tailwind's names are remapped, so existing `rounded-*` call sites inherit the system.

| Token | Utility | Value | Use it for |
|---|---|---|---|
| `--radius-xs` | `rounded-xs` | 4px | Micro chips |
| `--radius-sm` | `rounded-sm` | 7px | Small controls |
| `--radius-md` | `rounded-md` | 10px | **Default control** (buttons, inputs, nav items, badges) |
| `--radius-lg` | `rounded-lg` | 14px | **Surfaces** (cards, cover frames, menus) |
| `--radius-xl` | `rounded-xl` | 18px | **Panels** (centred dialogs) |
| `--radius-2xl` | `rounded-2xl` | 24px | Sheets (bottom placement) |
| `--radius-3xl` | `rounded-3xl` | 2rem | Rare, very large surfaces |
| — | `rounded-full` | 9999px | **Pills** (tags, avatars, count badges) |

### 4.4 Elevation

Directional and tinted, never a symmetric black bloom. Dark shadows are black-tinted;
light shadows are tinted with the light ink (`rgb(20 24 15 / …)`) rather than pure black.

| Token | Utility | Dark value | Light value |
|---|---|---|---|
| `--shadow-xs` | `shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.34)` | `0 1px 2px 0 rgb(20 24 15 / 0.05)` |
| `--shadow-sm` | `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.38), 0 2px 4px -1px rgb(0 0 0 / 0.26)` | `0 1px 2px 0 rgb(20 24 15 / 0.07), 0 2px 4px -1px rgb(20 24 15 / 0.05)` |
| `--shadow-md` | `shadow-md` | `0 4px 8px -2px rgb(0 0 0 / 0.42), 0 2px 4px -2px rgb(0 0 0 / 0.3)` | `0 4px 8px -2px rgb(20 24 15 / 0.1), 0 2px 4px -2px rgb(20 24 15 / 0.06)` |
| `--shadow-lg` | `shadow-lg` | `0 12px 24px -6px rgb(0 0 0 / 0.5), 0 4px 8px -4px rgb(0 0 0 / 0.34)` | `0 12px 24px -6px rgb(20 24 15 / 0.13), 0 4px 8px -4px rgb(20 24 15 / 0.07)` |
| `--shadow-xl` | `shadow-xl` | `0 24px 48px -12px rgb(0 0 0 / 0.58), 0 8px 16px -8px rgb(0 0 0 / 0.38)` | `0 24px 48px -12px rgb(20 24 15 / 0.17), 0 8px 16px -8px rgb(20 24 15 / 0.09)` |

### 4.5 Spacing

`global.css` does **not** declare a custom spacing scale. Spacing uses Tailwind's default
0.25rem base scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `py-8` = 32px,
`py-10` = 40px, `mt-24` = 96px). The only spacing the system owns directly are the shell
gutters and the nav height in §6.

### 4.6 Chrome

| Token | Value | Utility | Use it for |
|---|---|---|---|
| `--nav-height` | `4rem` (64px) | — (`h-16`) | Sticky nav height; offsets that must clear it |
| `--color-ring-offset` | `--surface-base` | — | Ring gap colour set in `@layer base` |

### 4.7 Motion

| Token | Utility | Value |
|---|---|---|
| `--ease-out-quart` | `ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-in-out-quart` | `ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` |
| `--animate-overlay-in` | `animate-overlay-in` | `overlay-in 160ms var(--ease-out-quart) both` |
| `--animate-overlay-out` | `animate-overlay-out` | `overlay-out 120ms var(--ease-in-out-quart) both` |
| `--animate-panel-in` | `animate-panel-in` | `panel-in 200ms var(--ease-out-quart) both` |
| `--animate-panel-out` | `animate-panel-out` | `panel-out 140ms var(--ease-in-out-quart) both` |
| `--animate-sheet-in` | `animate-sheet-in` | `sheet-in 240ms var(--ease-out-quart) both` |
| `--animate-drawer-in` | `animate-drawer-in` | `drawer-in 240ms var(--ease-out-quart) both` |
| `--animate-rise` | `animate-rise` | `rise 320ms var(--ease-out-quart) both` |

The keyframes animate the standalone `opacity`, `scale` and `translate` **properties**,
not the `transform` shorthand, so they compose with the `-translate-x-1/2 -translate-y-1/2`
utilities used to centre a dialog instead of overwriting them.

- `overlay-in` / `overlay-out` — opacity only.
- `panel-in` / `panel-out` — opacity + `scale: 0.97 → 1`. Centred dialogs.
- `sheet-in` — opacity + `translate: 0 6% → 0`. Bottom placement.
- `drawer-in` — opacity + `translate: 100% 0 → 0`. Right placement.
- `rise` — opacity + `translate: 0 8px → 0`. Content that has earned an entrance.

---

## 5. Typography

Three faces, three jobs. Loaded from Google Fonts in `BaseLayout.astro`.

| Token | Family | Utility | Role |
|---|---|---|---|
| `--font-display` | Bricolage Grotesque | `font-display` | Headings, page titles, the logotype, panel titles |
| `--font-sans` | Instrument Sans | `font-sans` (default) | Body copy, controls, UI text |
| `--font-mono` | DM Mono | `font-mono` | **Real data only** — ratings, counts, years, eyebrow labels |

Bricolage Grotesque is variable (`opsz`, `wght`) and loaded at weights 400–700; Instrument
Sans at 400–700; DM Mono at 400–500 plus regular.

### 5.1 Headings are pre-styled by the base layer

```css
@layer base {
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--color-foreground);
    text-wrap: balance;
  }
}
```

Every `h1`–`h6` already has the display face, weight 600 and primary ink. **A heading
declares only its size and tracking** — never `font-display`, `font-semibold` or
`text-foreground` (they are already true, and restating them means the element's voice is
now decided in two places).

### 5.2 Other base typography rules

- `body` — `--font-sans`, `--text-base`, line-height 1.6, `--color-foreground-secondary`,
  antialiased.
- `p` — `text-wrap: pretty`.
- `::placeholder` — `--ink-muted`.
- `::selection` — primary at 35% mixed in oklab, foreground ink.
- `hr` — hairline in `--color-border`.

### 5.3 Numerals in mono

Ratings, review counts, release years, step indices and eyebrow labels render in DM Mono.
`StarRating` renders `{value}/{max}` in `font-mono text-sm text-muted-foreground`;
`GameCard` renders the year and rating in `font-mono text-xs`.

---

## 6. Layout

### 6.1 `shell` — the single page rail

Every page gutter and content rail is governed by one utility, so the navbar, footer and
every page align by construction.

```css
@utility shell {
  margin-inline: auto;
  width: 100%;
  max-width: 80rem;       /* 1280px content rail */
  padding-inline: 1rem;   /* < 40rem  */
  @media (width >= 40rem)  { padding-inline: 1.5rem; } /* ≥ 640px */
  @media (width >= 64rem)  { padding-inline: 2rem; }   /* ≥ 1024px */
}
```

Three gutters, one rail: 1rem → 1.5rem at 640px → 2rem at 1024px, max-width 1280px.

```astro
<div class="shell">…</div>
```

Narrow reading pages nest a measure constraint inside it rather than changing the rail:

```astro
<div class="shell py-8 lg:py-10">
  <div class="mx-auto max-w-3xl">…</div>
</div>
```

### 6.2 `shell-wide`

Full-bleed variant (`max-width: 96rem`, same three gutters) for marketing surfaces that
still need aligned edges. Defined in `global.css`; not yet used in the migrated tree.

### 6.3 Standard page recipe

Confirmed by `ExplorePage.tsx`, `ReviewsPage.tsx`, `ReviewDetailPage.tsx`,
`ProfilePage.tsx`, `GameDetailPage.tsx`, `ActivityFeedPage.tsx` and
`pages/games/index.astro`:

```astro
<div class="shell py-8 lg:py-10">
  <h1 class="text-2xl tracking-tight sm:text-3xl">Recent reviews</h1>
</div>
```

- Page wrapper: `shell py-8 lg:py-10`.
- Page `h1`: `text-2xl tracking-tight sm:text-3xl`. No font/weight/colour classes.

The marketing home page (`pages/index.astro`) is the deliberate exception: it composes
full-bleed `shell` sections with their own vertical rhythm (`shell pt-12 lg:pt-16`,
`shell mt-16 lg:mt-24`) and uses a larger hero scale
(`text-4xl leading-[0.98] sm:text-5xl lg:text-6xl`). It is a landing page, not an app page.

### 6.4 Sticky positioning below the nav

The nav is `sticky top-0 z-nav h-16` (64px = `--nav-height`). Anything that must sit
below it uses `top-nav`, which resolves to `top: var(--nav-height)`.

```tsx
// ExplorePage.tsx — the sticky filter rail
<div className="sticky top-nav pt-6">…</div>
<div className="sticky top-nav z-sticky mb-4 bg-background/90 py-2 backdrop-blur-md lg:hidden">…</div>
```

Never hard-code `top-6` or `top-16` for this. `top-6` (24px) was the exact root cause of
the navbar overlapping the `/games` filter sidebar (`DESIGN-AUDIT.md` §1.3).

### 6.5 Layout roots

`MainLayout.astro` provides `flex min-h-screen flex-col` with `<main id="main" class="flex-1">`
between the navbar and footer. Pages do not re-declare `min-h-screen`.

---

## 7. Shape and depth

### 7.1 Radius convention

| Element | Utility |
|---|---|
| Controls — buttons, inputs, nav items, badges, menu items, checkboxes | `rounded-md` |
| Surfaces — cards, cover frames, popover menus | `rounded-lg` |
| Panels — centred dialogs | `rounded-xl` |
| Sheets — bottom placement | `rounded-2xl` (`rounded-t-2xl`) |
| Pills — tags, avatars, count badges | `rounded-full` |

One concept, one shape. The previous tree rendered the same "pill" three ways and the same
"card" as `rounded`, `rounded-md` and `rounded-lg` (`DESIGN-AUDIT.md` §2.3).

### 7.2 Depth comes from border and tone

`Card` encodes the rule:

```tsx
const surfaceStyles = {
  flat: 'bg-card border border-border',                       // page-level panel
  raised: 'bg-card border border-border shadow-md',           // genuinely floating
  interactive: 'bg-card border border-border interactive-surface hover:border-border-hover',
};
```

Default is `flat`. A shadow is reserved for a surface that **actually floats** above the
page — a dialog panel (`shadow-xl`), a popover menu (`shadow-lg`), a `raised` card
(`shadow-md`). Ordinary boxes get a border and a surface tone.

The previous 30 shadows were all symmetric all-around blooms. The elevation scale is now
directional (offset `y`, negative spread) and tinted, so a shadow reads as light falling
from above rather than a glow around the box.

---

## 8. Interaction and motion

### 8.1 One focus treatment — global

```css
:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

That is the whole app's focus language. **Do not add per-component focus rings.**
`Button.tsx` states it outright ("Focus comes from the global `:focus-visible` rule in
global.css — do not add ring utilities here, or the app ends up with two competing focus
languages again"), and `Input.tsx` does the same. No `ring-2`, no `outline-none`, no
`border-primary` focus state.

### 8.2 Hover changes colour, never position

Hover is a colour shift. It is not a scale, a lift, a translate or an opacity fade on the
control itself.

```tsx
// Correct — tonal shift
'bg-primary text-primary-foreground hover:bg-primary-hover'
'border border-border hover:border-border-hover'
'text-muted-foreground hover:text-foreground'

// Banned — the object moves on hover
'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg'
```

The `interactive-surface` utility supplies the transition for a surface that reacts to a
hovered child (a card whose whole body is a link):

```css
@utility interactive-surface {
  transition:
    background-color 160ms var(--ease-out-quart),
    border-color 160ms var(--ease-out-quart);
}
```

Two deliberate, non-token shifts exist inside primitives and are allowed to stand:
`Button` `destructive` uses `hover:brightness-110`, and cover images use
`group-hover:opacity-90` (`index.astro`) because a photograph has no colour token to
shift. Neither moves geometry.

### 8.3 Entrance animations

Named animations in §4.7. Content is visible by default; an entrance is an accent, not a
gate. Never wrap real content in an animation that must complete before it can be read.
The `rise` keyframe (320ms) is the only content-entrance animation and is not used by the
migrated pages — prefer no entrance at all.

---

## 9. Z-index

Semantic utilities only. A bare `z-40`/`z-50`/`z-[999]` is banned.

| Utility | Value | Layer |
|---|---|---|
| `z-sticky` | 30 | Sticky in-flow content (filter rails) |
| `z-nav` | 40 | The sticky navbar |
| `z-overlay` | 50 | Dialog backdrop |
| `z-modal` | 60 | Dialog / sheet panel |
| `z-popover` | 70 | Menus, selects, popovers |
| `z-toast` | 80 | Toasts |

**Overlay sits above nav (50 > 40).** This is explicit and load-bearing: the previous
overlay was `z-40` against a `z-50` navbar, so the header painted on top of modal
backdrops and stayed clickable while a dialog was open (`DESIGN-AUDIT.md` §1.1).

---

## 10. Component contracts

Import path is `@/components/ui/<Name>`.

### 10.1 `Button`

```ts
variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'  // default primary
size?: 'sm' | 'md' | 'lg' | 'icon'                                                // default md
asChild?: boolean; isLoading?: boolean; fullWidth?: boolean
leftIcon?: ReactNode; rightIcon?: ReactNode
```

```tsx
import { Button } from '@/components/ui/Button';

<Button>Save review</Button>
<Button variant="outline" size="sm" onClick={clear}>Clear filters</Button>
<Button asChild variant="ghost"><a href="/games">Browse</a></Button>
```

`asChild` uses Radix `Slot` and renders the child element. `isLoading` swaps icons for a
spinning `Loader2`, sets `aria-busy` and disables the button. `size` is ignored for
`variant="link"`, which is inline text.

### 10.2 `Card`

```ts
variant?: 'flat' | 'raised' | 'interactive'  // default flat
```

```tsx
import { Card } from '@/components/ui/Card';

<Card className="p-6">…</Card>
<Card variant="interactive" className="p-5">…</Card>
```

Always `rounded-lg`; call sites add padding.

### 10.3 `Input` / `Textarea` / `Label` / `fieldStyles`

```tsx
import { Input, Textarea, Label, fieldStyles } from '@/components/ui/Input';

<div className="space-y-2">
  <Label htmlFor="search-input">Search games</Label>
  <Input id="search-input" placeholder="Search by title..." />
</div>

<Textarea rows={6} placeholder="Your review..." />
```

- `Input` and `Textarea` both render `fieldStyles` (exported string) — `rounded-md border
  border-border bg-background px-3 py-2 text-sm`, `transition-colors`,
  `hover:border-border-hover`, `disabled:opacity-50`.
- `Textarea` defaults to `rows={4}` and adds `resize-y leading-relaxed`.
- `Label` is `block text-sm font-medium text-foreground`.
- Use `fieldStyles` directly when a non-input control must look like a field — e.g. a
  Radix `Select.Trigger` (`FilterSidebar.tsx`: `[fieldStyles, 'flex cursor-pointer …']`).
- No focus classes: `:focus-visible` is global.

### 10.4 `Dialog`

The single overlay + panel contract. Exports `Dialog`, `DialogTrigger`, `DialogClose`,
`DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogTitle`,
`DialogDescription`, `DialogFooter`.

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

<Dialog>
  <DialogTrigger asChild><Button>Write a review</Button></DialogTrigger>
  <DialogContent size="md" placement="center">
    <DialogHeader>
      <DialogTitle>Write a review</DialogTitle>
      <DialogDescription>Your score is out of ten. Be specific.</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
      <Button>Publish</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

`DialogContent` props:

| Prop | Type | Default | Effect |
|---|---|---|---|
| `size` | `sm \| md \| lg \| xl` | `md` | Centred panel width — `max-w-sm` / `max-w-lg` / `max-w-2xl` / `max-w-4xl`. Ignored for sheets |
| `placement` | `center \| right \| bottom` | `center` | `center` is a dialog; `right` and `bottom` are sheets |
| `hideClose` | `boolean` | `false` | Hide the built-in close control, only when the panel supplies its own |

What the component already gives you, so no call site repeats it:

- Backdrop is `bg-background/60 backdrop-blur-md` — the page colour at 60%, never solid
  black.
- Overlay at `z-overlay` (50), panel at `z-modal` (60), both above the navbar.
- Focus trap, Escape, scroll lock and focus restore from Radix.
- A labelled close control (`aria-label="Close dialog"`) unless `hideClose`.
- Entrance/exit via `animate-panel-in` / `animate-panel-out` (centre),
  `animate-drawer-in` (right), `animate-sheet-in` (bottom).

**Titles and descriptions.** Every dialog needs a `DialogTitle` — Radix will not
announce a dialog without one, and the accessible name comes from it. Radix also expects
a `DialogDescription`; when the panel has no descriptive sentence to offer (a bare
navigation drawer, a filter sheet), pass `aria-describedby={undefined}` explicitly rather
than leaving it off, which is what `Navbar.tsx` and `FilterSidebar.tsx` do. Do not ship a
dialog with neither.

### 10.5 `StarRating`

```ts
value: number; onChange: (value: number) => void
max?: number     // default 10
size?: number    // default 28 (px)
disabled?: boolean
```

```tsx
import StarRating from '@/components/ui/StarRating';
<StarRating value={rating} onChange={setRating} />
```

Half-step selection (left half of a star = `.5`, right half = whole). Filled stars are
`fill-primary text-primary`, the track is `fill-border-strong text-border-strong`, and the
counter is `font-mono`. Ratings are out of ten.

### 10.6 `ThemeToggle`

```tsx
import ThemeToggle from '@/components/ui/ThemeToggle';
<ThemeToggle client:load />
```

A `Button variant="ghost" size="icon"` that flips `.light` on `<html>` and writes
`localStorage.theme`. Renders a fixed `size-10` placeholder before hydration so the header
does not shift. It only reads the applied class; `BaseLayout` resolves the theme.

### 10.7 `Navbar`

```ts
currentPath?: string
```

```tsx
<Navbar client:load currentPath={Astro.url.pathname} />
```

`sticky top-0 z-nav h-16 border-b border-border bg-background/85 backdrop-blur-md`, with a
three-column `shell grid grid-cols-[1fr_auto_1fr]` — the grid is what centres the nav links
on the page axis rather than on leftover flex space. The mobile menu is a `DialogContent
placement="right"` sheet. Nav items are `rounded-md` with an active state of
`font-semibold text-primary` and `aria-current="page"`.

### 10.8 `Footer`

```ts
className?: string
```

```tsx
<Footer client:load />
```

All Tailwind token classes, no inline styles. Per-column headings are eyebrows:
`font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground`.

---

## 11. Recipes — do and don't

### Adding a page

```astro
---
import MainLayout from '@/layouts/MainLayout.astro';
---
<MainLayout title="Explore games" description="…">
  <div class="shell py-8 lg:py-10">
    <h1 class="text-2xl tracking-tight sm:text-3xl">Explore games</h1>
  </div>
</MainLayout>
```

Wrong: a hand-rolled container (`<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">`),
a second `min-h-screen`, or an `h1` carrying `font-display text-3xl font-semibold
text-foreground`.

### Adding a card

```tsx
<Card variant="interactive" className="p-5">
  <h2 className="text-base font-semibold text-foreground">Title</h2>
  <p className="mt-1 text-sm text-muted-foreground">Meta</p>
</Card>
```

Wrong: `bg-card rounded-lg border border-border shadow-lg hover:scale-[1.02]`.

### Adding a form field

```tsx
<div className="space-y-2">
  <Label htmlFor="title">Title</Label>
  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
  <p className="text-sm text-error">A title is required</p>
</div>
```

Wrong: a raw `<input class="… ring-2 ring-purple-500 outline-none">`, or an error message
using `text-red-500`.

### Adding a modal

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent size="lg" placement="center">
    <DialogHeader>
      <DialogTitle>Delete review</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Wrong: a `fixed inset-0 bg-black/50` div with a manually positioned panel, a `z-40`
overlay, or a dialog with no `DialogTitle`.

### Adding a badge

```tsx
{/* Pill — genre tag */}
<span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">RPG</span>

{/* Count pill — mono numeral on primary */}
<span className="rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">3</span>

{/* Overlay badge on media */}
<span className="rounded-md border border-border bg-background/85 px-1.5 py-0.5 font-mono text-xs backdrop-blur-sm">8.4</span>
```

Wrong: the same badge as `rounded-md` in one file, `rounded-lg` in another and
`rounded-full` in a third.

### Adding an empty or error state

```astro
<div class="shell py-8 lg:py-10">
  <div class="rounded-lg border border-border bg-card p-6 text-center">
    <h2 class="text-lg font-semibold text-foreground">Could not load games</h2>
    <p class="mt-2 text-sm text-muted-foreground">{error}</p>
    <button class="mt-5 inline-flex h-10 items-center rounded-md border border-border-strong px-4
                   text-sm font-medium text-foreground transition-colors
                   hover:border-accent hover:text-accent">Try again</button>
  </div>
</div>
```

The failure case uses the same surface, border and text tokens as the success case; only
the copy changes. Wrong: a raw `text-red-500` heading or an unstyled stack.

### Adding an image

```astro
<div class="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
  <img
    src={cover || '/images/game-placeholder.svg'}
    alt={cover ? `${title} cover` : `${title} placeholder cover`}
    loading="lazy"
    decoding="async"
    class="size-full object-cover"
  />
</div>
```

Always: a fixed-ratio frame with `rounded-lg`, `bg-muted` behind the image, `size-full
object-cover`, `loading="lazy"`, `decoding="async"`, and a local placeholder fallback
(`GameCard.tsx` also adds `onError` to swap a broken remote URL). Decorative covers take
`alt=""`; a meaningful cover is described.

Known open item: cover `<img>` elements do not yet set `width`/`height`, so the frame
reserves the space instead of the image (`DESIGN-AUDIT.md` §2.8). Keep the aspect-ratio
frame — it is what prevents the layout shift.

---

## 12. Rules for scaling this system

### Adding a token

1. Add the primitive value in `:root` **and** the matching value in `:root.light`. Both
   blocks must set the same variable name; a token defined in only one theme is a bug.
2. Register it in `@theme` under the right namespace so it becomes a utility
   (`--color-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--font-*`, `--ease-*`,
   `--animate-*`).
3. Use the utility in components. Never reference `var(--…)` from a class name.

### Adding a variant

Add it to the primitive's variant map (`variantStyles` in `Button.tsx`, `surfaceStyles`
in `Card.tsx`) rather than branching at the call site. Keep the count small — a variant
that exists for one call site is a class string, not a variant.

### Promoting a one-off to a primitive

Promote when two or more call sites need the same behaviour **and** that behaviour encodes
a rule (focus handling, keyboard semantics, overlay layering). The rule goes in the
primitive so no future call site has to remember it. Do not promote because two call sites
happen to share a border radius.

### No raw palette colours, ever

Any new code that contains a hex value, an `rgb()`, a raw Tailwind palette class
(`text-red-500`, `bg-white`, `fill-yellow-400`) or an arbitrary `[var(--…)]` class is
reintroducing exactly the class of bug the audit catalogued: styles that typecheck and
build but emit no CSS. If a needed token does not exist, add the token — do not hard-code
the value at the call site.

### No `dark:` colour variants

Because the tokens re-theme themselves, the migrated components contain **zero `dark:`
colour variants**. Do not add them. A component that needs to look different in light mode
should be expressing that through a token, not through a variant — the only correct use of
`dark:` is a difference that is not expressible as a token, which so far has been none.

### Known deviations in the tree

`Notifications.tsx` still carries `z-[var(--z-toast)]`, a class that names a custom
property the new system does not define. It is dead. The fix is `z-toast`; do not copy the
pattern. This is the one surviving example of the banned arbitrary-`var()` form.
