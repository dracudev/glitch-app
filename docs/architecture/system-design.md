# Glitch Design System

**Last Updated:** November 4, 2025  
**Status:** Production Ready

A modern, gaming-focused design system built for performance, accessibility, and developer experience.

## Design Principles

- **Gaming-First**: Dark theme optimized for gaming audiences with vibrant accent colors
- **Performance**: Minimal CSS footprint with efficient custom properties
- **Accessibility**: WCAG 2.1 AA compliant with proper focus management and Radix UI primitives
- **Developer Experience**: Intuitive naming conventions and clear documentation
- **Scalability**: Systematic approach supporting future growth and theming
- **Mobile-First**: Responsive design patterns starting from mobile viewports

## Design Tokens

> **Superseded.** The token layer was rebuilt as a single dark-first design system. The
> authoritative values now live in [`apps/frontend/src/styles/global.css`](../../apps/frontend/src/styles/global.css),
> and the full reference — palette, typography, layout, shape, motion, z-index and the
> component contracts — is in [`docs/design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md).
> The high-level direction and rebrand rationale are in [`DESIGN.md`](../../DESIGN.md).
>
> Do not restate token values here; they drift. Read them from `global.css`.

The system was previously a set of flat CSS variables named `--brand-*`, `--text-*`, `--bg-*`
and `--state-*`. It is now a Tailwind v4 `@theme` block that maps semantic `--color-*` tokens
onto brand variables, with `:root` as the dark default and `:root.light` overriding the same
variable names for the light theme.

Two consequences worth knowing when reading older documents:

- **There is no `prefers-color-scheme` token resolution any more.** Dark is the product default
  and light is opt-in via a `.light` class on `<html>`. The old media-query fallback made one
  token resolve to two different values depending on the operating system setting.
- **Components use token utilities only.** Raw hex values, arbitrary `bg-[var(--x)]` classes and
  inline `style` objects are not part of the system. Components never name a brand colour directly.

### Themes

| Theme | How it is selected | Brand primary | Brand accent |
|---|---|---|---|
| Dark (default) | no class, or `.dark` on `<html>` | radioactive acid green | ultraviolet violet |
| Light | `.light` on `<html>` | deep green | deep violet |

### Typography

Three faces, each with one job: a display grotesque for headings, a neutral sans for body and UI
text, and a mono reserved for real data (counts, ratings, dates). `@layer base` applies the
display face, weight and colour to every `h1`-`h6`, so headings declare only size and tracking.

### Spacing

Spacing uses Tailwind's default 0.25rem scale — there is no custom `--space-*` family. The only
layout constants are the `shell` utility (the page rail that guarantees the navbar, the footer
and page content share one gutter) and `--nav-height`, which drives the `top-nav` helper for
anything that must sit below the sticky header.


## Component Patterns

### Buttons

```css
/* Primary button - default styling applied automatically */
button {
  /* Uses --brand-primary background */
}

/* Variants available as utility classes */
.btn-secondary {
  /* Outlined secondary style */
}
.btn-outline {
  /* Subtle outlined style */
}
.btn-danger {
  /* Destructive actions */
}
```

### Form Controls

All form elements share consistent styling:

- Focus states with `--brand-primary` color and subtle shadows
- Error states with `--state-error` color
- Proper spacing and typography hierarchy
- Accessible placeholder text contrast

### Accessibility Features

- **Focus Management**: Visible focus indicators on all interactive elements
- **Color Contrast**: WCAG AA compliant text/background combinations
- **Screen Readers**: `.sr-only` utility for hidden accessible content
- **Keyboard Navigation**: All interactive elements properly focusable

## Usage Guidelines

### CSS Custom Properties

Always use design tokens instead of hardcoded values:

```css
/* ✅ Good */
color: var(--text-primary);
margin: var(--space-4);

/* ❌ Avoid */
color: #fffffe;
margin: 16px;
```

### Component Development

Build components that extend base styles:

```css
.game-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
```

### Responsive Design

Use fluid typography and consistent spacing:

```css
.hero-title {
  font-size: var(--font-size-h1); /* Already responsive */
  margin-bottom: var(--space-6);
}
```

## Integration with Tailwind

This design system complements Tailwind CSS v4. Custom properties are available for Tailwind configuration and can be used alongside utility classes for rapid development while maintaining design consistency.

## Component Primitives: Radix UI

We use **Radix UI** as the project's headless, accessible primitive component library. Radix provides unstyled components with robust accessibility and focus management. All visual styling is applied via Tailwind CSS and our design tokens, keeping the primitives decoupled from presentation.

Philosophy:

- Use Radix for behavior and accessibility (focus traps, keyboard navigation, ARIA attributes).
- Apply styles with Tailwind and design tokens so components remain visually consistent and themeable.
- Keep Radix primitives wrapped in thin, project-specific presentational components to centralize styling and behavior.

Example — styling a `Tabs.Trigger` with Tailwind and design tokens:

```tsx
import { Tabs } from '@radix-ui/react-tabs';

function StyledTabTrigger({ children, ...props }) {
  return (
    <Tabs.Trigger
      {...props}
      className="px-4 py-2 rounded-md text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white"
    >
      {children}
    </Tabs.Trigger>
  );
}
```

This keeps the accessibility benefits of Radix while giving the team full control over visuals via the design system.

## Radix UI Integration

All interactive components use Radix UI primitives for maximum accessibility:

- **Navigation:** `@radix-ui/react-navigation-menu` for keyboard-accessible navigation
- **Dialogs:** `@radix-ui/react-dialog` for modals and side-drawers
- **Dropdowns:** `@radix-ui/react-dropdown-menu` for user menus
- **Avatars:** `@radix-ui/react-avatar` with fallback support
- **Tabs:** `@radix-ui/react-tabs` for tabbed interfaces
- **Switch:** `@radix-ui/react-switch` for theme toggle

All Radix components are styled with design system tokens for consistency.

## Implementation Status

### ✅ Completed Components

- **Navbar:** Mobile hamburger + desktop navigation with user dropdown
- **Footer:** Responsive 4-column layout with social links
- **ThemeToggle:** Radix Switch with icon and smooth transitions
- **ProfileHeader:** Avatar, bio, stats with responsive layout
- **ProfileTabs:** Radix Tabs for content navigation
- **Buttons:** Primary, secondary, outline, and danger variants
- **Forms:** Input fields with validation states

### 🔄 In Progress

- Game card components
- Review card components
- Search components
- Filter components

## Future Considerations

- Light mode theme implementation
- Component-specific token variations
- Animation and motion tokens library
- Extended color palettes for data visualization
- Component documentation site (Storybook)
