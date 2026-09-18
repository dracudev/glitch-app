# Glitch — Project Structure

**Last Updated:** September 2026

This document maps the Glitch monorepo: what each directory is for, what actually exists
today, and where new code belongs.

## Repository Overview

Glitch is a **PNPM monorepo** with two applications and a small set of shared packages:

```tree
glitch-app/
├── apps/          # Applications (backend, frontend, reserved e2e)
├── packages/      # Shared packages
├── docker/        # Docker configuration
├── docs/          # Project documentation
├── scripts/       # Helper scripts
└── [config files]
```

## Root Level Files

```tree
├── package.json              # Workspace scripts (dev, build, db:*, docker:*, lint, type-check)
├── pnpm-workspace.yaml       # Workspace globs: apps/*, packages/*
├── pnpm-lock.yaml            # Lockfile (packageManager: pnpm@10.15.0)
├── docker-compose.dev.yml    # Local infra + apps
├── docker-compose.prod.yml   # Production-style stack
├── README.md                 # Product overview
├── LICENSE                   # MIT
└── domains.csv               # Domain research scratch file (not part of the app)
```

Local secrets live in `apps/backend/.env` and `apps/frontend/.env` and are not committed.

## `/apps` Directory

### `apps/backend/` — NestJS REST API

```tree
backend/
├── package.json
├── nest-cli.json
├── tsconfig.json / tsconfig.build.json
├── eslint.config.js
├── prisma/
│   ├── schema.prisma          # Data model (11 models, 2 enums)
│   ├── migrations/            # 20250826…, 20250828…, 20260916153104_igdb_catalog_cleanup
│   ├── seeds/seed.ts          # Demo dataset (users, games, reviews, follows, likes)
│   └── init.sql               # Initial SQL
└── src/
    ├── main.ts                # Bootstrap: CORS, Helmet, cookies, validation,
    │                          #   versioning, /api prefix, Swagger, shutdown hooks
    ├── app.module.ts          # Root module
    ├── auth/                  # register/login/refresh/logout/password/me
    │   ├── constants/ decorators/ dto/ guards/ interfaces/ strategies/
    ├── users/                 # profiles, followers, following, update profile
    │   ├── constants/ dto/
    ├── games/                 # public catalog reads (filters, slug, similar)
    │   ├── constants/ dto/
    ├── reviews/               # review CRUD, likes, moderation
    │   ├── constants/ decorators/ dto/
    ├── social/                # follow, feed, stats, suggestions, mutual
    │   ├── constants/ dto/
    ├── admin/                 # stats + user administration (ADMIN only)
    │   └── dto/
    ├── igdb/                  # IGDB integration (auth, client, mapper, types)
    ├── health/                # GET /health
    ├── common/                # pagination DTOs, filters, interceptors, constants
    │   ├── constants/ dto/ filters/ interceptors/
    └── database/              # PrismaService + DatabaseModule
```

There is **no GraphQL** layer and no `developers/`, `genres/`, `platforms/` or
`publishers/` submodules — games are read from IGDB and genres/platforms are filter
options, not local tables.

### `apps/frontend/` — Astro + React

```tree
frontend/
├── package.json
├── astro.config.mjs           # site, output: 'server', vercel adapter, react, tailwind
├── vercel.json                # /api/* rewrite to the Render backend
├── tsconfig.json / eslint.config.js
├── public/
│   ├── favicon/               # Rendered icons + site.webmanifest
│   ├── images/                # glitch-mark.svg, game-placeholder.svg
│   ├── manifest.json
│   ├── og-image.jpg
│   └── robots.txt             # Generated/crawl rules + sitemap reference
└── src/
    ├── components/
    │   ├── admin/             # AdminUsersPage, AdminUserDialog, AdminReviewsPage,
    │   │                      #   AdminReviewDialog, AdminConfirmDialog
    │   ├── auth/              # LoginForm, RegisterForm
    │   ├── fallbacks/         # NoScriptFallback
    │   ├── games/             # ExplorePage, FilterSidebar, GameCard, GameHeader,
    │   │                      #   GameTabs, GameResultsList, GameReviewList,
    │   │                      #   SimilarGamesSection, ReviewFormDialog, MobileFilterButton
    │   ├── profile/           # ProfilePage, ProfileHeader, ProfileTabs, FollowButton,
    │   │                      #   FollowList, ReviewList, EditProfileDialog
    │   ├── reviews/           # ReviewsPage, ReviewDetailPage, ReviewCard, ReviewList,
    │   │                      #   ReviewActions, ReviewContent, ReviewHeader, ReviewFilters
    │   ├── social/            # ActivityFeedPage, ActivityFeedList, FeedItem, FeedItemSkeleton
    │   ├── ui/                # Button, Card, Dialog, Input, Select, StarRating,
    │   │                      #   Navbar, Footer, ThemeToggle, Notifications, Button.stories
    │   ├── layout/            # (empty — reserved)
    │   └── search/            # (empty — reserved)
    ├── layouts/               # BaseLayout, MainLayout, AuthLayout, AdminLayout
    ├── lib/                   # avatar.ts, review-title.ts
    ├── pages/                 # File-based routes (see below)
    ├── services/              # api.ts (client), auth, games, reviews, social, users,
    │                          #   admin, ssr-auth
    ├── stores/                # nanostores: auth, games, reviews, social, users,
    │                          #   explore, notifications
    ├── hooks/                 # useAuth, useGames, useReviews, useSocial, useUsers
    ├── styles/                # global.css (design tokens), questlog-preview.png
    └── types/                 # env.d.ts
```

Routes under `src/pages/`:

```tree
├── index.astro                # Home
├── 404.astro
├── feed/index.astro           # Prerendered
├── games/index.astro          # Catalog
├── games/[slug].astro         # Game detail
├── reviews/index.astro
├── reviews/[id].astro
├── profile/[username].astro
├── auth/login.astro
├── auth/signup.astro
├── admin/index.astro          # Admin only
├── admin/users.astro
├── admin/reviews.astro
├── indie/                     # (empty — reserved for the indie showcase)
├── users/                     # (empty — reserved)
└── sitemap.xml.ts             # Server-rendered sitemap
```

### `apps/e2e/` — Reserved

The directory exists as a placeholder for an end-to-end suite. It currently has no tests.

## `/packages` Directory

```tree
packages/
├── shared-types/   # TypeScript types shared by frontend and backend (@glitch/shared-types)
│   ├── src/        # api, auth, games, users, reviews, social, admin, utils
│   └── README.md
├── utils/          # Shared helpers (@glitch/utils); depends on zod
├── config/         # Shared ESLint / Prettier / TypeScript config (@glitch/config)
│   ├── eslint/ prettier/ typescript/
└── [reserved, empty]  analytics/ · game-apis/ · indie-sdk/ · steam-integration/
```

`shared-types`, `utils` and `config` are real, consumed workspace packages. The four
reserved folders contain no files and represent planned work only.

## `/docs` Directory

```tree
docs/
├── architecture/
│   ├── backend-tcd.md         # Backend technical context
│   ├── frontend-tcd.md        # Frontend technical context
│   ├── dev-guide.md           # Requirements, local setup, workflow
│   ├── project-structure.md   # This file
│   └── system-design.md       # Brand + design system
├── api/                       # (empty — reserved)
└── deployment/                # (empty — reserved)
```

## `/docker` Directory

```tree
docker/
├── nginx/dev.conf             # Reverse proxy config for local development
├── redis/                     # (empty — reserved)
├── fluentd/                   # (empty — reserved)
└── prometheus/                # (empty — reserved)
```

## `/scripts` Directory

```tree
scripts/
└── docker-dev.sh              # Docker development helper
```

## Workspace Configuration

`pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Packages reference each other with the workspace protocol:

```json
{
  "dependencies": {
    "@glitch/shared-types": "workspace:*",
    "@glitch/utils": "workspace:*"
  }
}
```

## Where things belong

1. Decide whether code is app-specific or shared; keep app logic inside its app.
2. Put cross-cutting TypeScript types in `packages/shared-types`.
3. Put cross-cutting helpers in `packages/utils`.
4. Reuse the shared lint/format/TS config from `packages/config`.
5. Update the relevant document in `docs/architecture/` when structure changes.

## References

- [Backend TCD](./backend-tcd.md)
- [Frontend TCD](./frontend-tcd.md)
- [System Design](./system-design.md)
- [Development Guide](./dev-guide.md)
