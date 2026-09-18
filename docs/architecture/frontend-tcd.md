# Glitch Frontend — Technical Context Document

**Last Updated:** September 2026
**Status:** Production Ready

## 1. High-Level Overview

The Glitch frontend is the Astro + React application that serves both the public
**Front-Office** (home, game catalog, game detail, reviews, profiles, feed) and the private
**Back-Office** (`/admin`: stats, users, review moderation). Every page is server-rendered
by default; interactivity is delivered through hydrated React islands.

### Core functionality

- **Public browsing** — games, reviews and profiles are readable without an account.
- **Accounts** — signup/login forms with cookie-based sessions.
- **Reviews** — create/edit/delete your own reviews, like others', rate out of 10.
- **Social** — follow/unfollow, activity feed, suggestions, mutual connections.
- **Back-Office** — admin dashboard, user administration and review moderation.

## 2. Technology Stack

| Concern | Choice |
|---|---|
| Framework | **Astro 5.14**, `output: 'server'`, `@astrojs/vercel` adapter |
| Interactivity | **React 19.2** islands (`@astrojs/react` 4.3) |
| Styling | **Tailwind CSS 4.1** via `@tailwindcss/vite` |
| Primitives | **Radix UI** (avatar, checkbox, collapsible, dialog, dropdown-menu, form, navigation-menu, select, slot, switch, tabs, tooltip) |
| State | **Nanostores 1.0** + `@nanostores/react` |
| Icons | **lucide-react** |
| Variants | **class-variance-authority** |
| Types | **TypeScript 5.9**, `@astrojs/check`, shared `@glitch/shared-types` |

Note: `@astrojs/node` is installed but unused; Vercel is the deployed adapter.

## 3. Directory Structure

```tree
src/
├── components/      # React islands, grouped by domain
│   ├── admin/ auth/ fallbacks/ games/ profile/ reviews/ social/ ui/
│   ├── layout/      # (empty — reserved)
│   └── search/      # (empty — reserved)
├── layouts/         # BaseLayout, MainLayout, AuthLayout, AdminLayout
├── lib/             # avatar.ts, review-title.ts
├── pages/           # File-based routes
├── services/        # api.ts + auth, games, reviews, social, users, admin, ssr-auth
├── stores/          # auth, games, reviews, social, users, explore, notifications
├── hooks/           # useAuth, useGames, useReviews, useSocial, useUsers
├── styles/          # global.css (design tokens)
└── types/           # env.d.ts
```

## 4. Routing & Rendering

`astro.config.mjs` sets `output: 'server'`, so pages are on-demand rendered unless they opt
into prerendering.

| Route | Rendering | Notes |
|---|---|---|
| `/` | SSR | Landing / discovery |
| `/404` | SSR | Not-found page |
| `/games` | SSR | Catalog with filters and pagination |
| `/games/[slug]` | SSR | Redirects to `/404` when the slug is unknown |
| `/reviews` | SSR | Global review listing |
| `/reviews/[id]` | SSR | Redirects to `/404` when the review is missing |
| `/profile/[username]` | SSR | Redirects to `/404` when the user is missing |
| `/feed` | **Prerendered** | Static shell; user-scoped content is loaded client-side |
| `/auth/login`, `/auth/signup` | SSR | Redirect to `/feed` when a session already exists |
| `/admin`, `/admin/users`, `/admin/reviews` | SSR | Admin only; redirects to `/` when role is not `ADMIN` |
| `/sitemap.xml` | SSR endpoint | `src/pages/sitemap.xml.ts` |

Reserved (empty) route folders: `src/pages/indie/`, `src/pages/users/`.

## 5. Layouts

- **`BaseLayout.astro`** — the document shell: `<head>` metadata, canonical URL, Open Graph
  and Twitter tags, robots meta (driven by a `noIndex` prop), the pre-paint theme script, and
  the theme-color meta tags.
- **`MainLayout.astro`** — wraps public pages with the Navbar and Footer.
- **`AuthLayout.astro`** — layout for login/signup.
- **`AdminLayout.astro`** — layout for the Back-Office pages.

## 6. Component Architecture

React is used as islands: only interactive subtrees hydrate, and the rest of the page is
server-rendered HTML.

- **`ui/`** — shared primitives: `Button` (with variants + a Storybook story), `Card`,
  `Dialog`, `Input`, `Select`, `StarRating`, `Navbar`, `Footer`, `ThemeToggle`,
  `Notifications`.
- **`games/`** — `ExplorePage`, `FilterSidebar`, `MobileFilterButton`, `GameCard`,
  `GameHeader`, `GameTabs`, `GameResultsList`, `GameReviewList`, `SimilarGamesSection`,
  `ReviewFormDialog`.
- **`reviews/`** — `ReviewsPage`, `ReviewDetailPage`, `ReviewCard`, `ReviewList`,
  `ReviewActions`, `ReviewContent`, `ReviewHeader`, `ReviewFilters`.
- **`social/`** — `ActivityFeedPage`, `ActivityFeedList`, `FeedItem`, `FeedItemSkeleton`.
- **`profile/`** — `ProfilePage`, `ProfileHeader`, `ProfileTabs`, `FollowButton`,
  `FollowList`, `ReviewList`, `EditProfileDialog`.
- **`auth/`** — `LoginForm`, `RegisterForm`.
- **`admin/`** — `AdminUsersPage`, `AdminUserDialog`, `AdminReviewsPage`,
  `AdminReviewDialog`, `AdminConfirmDialog`.
- **`fallbacks/`** — `NoScriptFallback`.

`components/layout/` and `components/search/` exist but are empty placeholders.

## 7. State Management

Global state uses **Nanostores**, one store per domain, each with a companion hook that
subscribes with `@nanostores/react`:

| Store | Hook | Responsibility |
|---|---|---|
| `auth` | `useAuth` | Session user, tokens, login/logout state |
| `games` | `useGames` | Catalog list, filters, detail, similar |
| `reviews` | `useReviews` | Review lists, create/edit/delete, likes |
| `social` | `useSocial` | Follows, feed, suggestions, stats |
| `users` | `useUsers` | Profiles, followers/following |
| `explore` | — | Explore-page filter/catalog state |
| `notifications` | — | Transient UI notifications |

Interactive actions such as follow/unfollow and like/unlike use optimistic updates with
rollback on failure.

## 8. API Client

`src/services/api.ts` exports a single `ApiClient` instance used by every domain service
(`auth`, `games`, `reviews`, `social`, `users`, `admin`).

- **Base URL**: on the **server** (SSR/build) it uses the absolute
  `PUBLIC_API_URL` (falling back to `http://localhost:3000/api/v1`); in the **browser** it
  always uses the same-origin `/api/v1`. This keeps the auth cookie first-party — Vite
  proxies `/api` in development and the Vercel rewrite proxies it in production.
- **Auth**: sends `Authorization: Bearer <token>` from the auth store for client calls;
  SSR calls forward the incoming cookie header instead.
- **Caching**: in-memory GET cache (5 min) keyed by URL + token, disabled for SSR responses
  so one visitor's auth-scoped data can never leak to another; any write clears the cache.
- **Resilience**: 30 s timeout, up to 3 retries with exponential backoff, and no retry on
  4xx. A 401 triggers a token refresh and, if that fails, redirects to `/auth/login`.
- **Envelope**: unwraps the backend's `{ statusCode, message, data }` success envelope and
  surfaces `ApiClientError` with the backend message on failure.

`services/ssr-auth.ts` provides the server-side helpers used by pages:
`ssrCookieHeader()`, `hasSession()` and `getSessionRole()`.

## 9. Authentication & Access Control

- Sessions are JWT access (15 min) + refresh (7 days) cookies, set by the backend as
  HTTP-only. The frontend never reads them; it forwards them on SSR calls.
- **Front-Office gating**: `/auth/login` and `/auth/signup` redirect to `/feed` when a
  session already exists.
- **Back-Office gating**: each `admin/*` page reads the cookie header, calls
  `getSessionRole(cookieHeader)`, and redirects to `/` when the role is not `ADMIN`. This is
  the frontend half of the gate; the backend independently enforces `@Roles('ADMIN')` with
  `RolesGuard`, so the API is safe even if a page is reached directly.

## 10. Styling & Design System

Styling is Tailwind CSS v4 driven by design tokens declared in
`src/styles/global.css`. Components use token utilities only (no raw colours, no arbitrary
`var(--x)` classes). Dark is the default theme; light is a full opt-in theme selected by a
pre-paint script and `ThemeToggle`. The brand, token tables, component contracts and
accessibility rules are documented in the [System Design](./system-design.md).

## 11. SEO

- `BaseLayout` emits per-page title/description, a canonical URL, a robots directive
  (`noIndex` prop), and Open Graph + Twitter metadata with a shared `og-image.jpg`.
- `PUBLIC_SITE_URL` supplies the canonical origin.
- `public/robots.txt` allows crawling of public pages and disallows `/admin/`, `/auth/` and
  `/feed`.
- `src/pages/sitemap.xml.ts` server-renders a sitemap containing the static pages plus live
  game, profile and published-review URLs, sourced from the API. It degrades gracefully to
  the static pages if the API is unreachable.

## 12. Build & Deployment

- `astro build` produces the SSR output consumed by the Vercel adapter.
- `vercel.json` rewrites `/api/:path*` to the Render backend
  (`https://questlog-app.onrender.com`), so cookies stay first-party.
- `astro.config.mjs` contains dev-stability settings: separate Vite cache dirs for dev and
  build, React dedupe, pre-bundled Radix dependencies, a `/api` dev proxy, and the dev
  toolbar disabled.

## 13. Known Gaps

- **No automated tests** — no component test runner and no committed specs.
- **`/feed` is prerendered**: it ships a static shell and loads user-scoped content on the
  client, so it is not server-gated for registered-only content.
- Empty reserved folders: `components/layout/`, `components/search/`, `pages/indie/`,
  `pages/users/`.
- `@astrojs/node` is installed but not the active adapter.
