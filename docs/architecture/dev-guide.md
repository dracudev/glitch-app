# 📘 Glitch — Development Guide

**Last Updated:** September 2026
**Status:** Production Ready

This guide covers the requirements Glitch implements, its architecture at a glance, and how
to run and work on it locally. For deep references see the [Backend TCD](./backend-tcd.md),
the [Frontend TCD](./frontend-tcd.md) and the [System Design](./system-design.md). The
product overview lives in the [README](../../README.md).

## 1. Requirements Analysis (ERS)

### 1.1 System Objective

Glitch is a social network focused on **video games**, similar to Letterboxd but for gamers.
It lets users:

- Create a personal profile.
- Write video game reviews with ratings out of 10.
- Connect with other users (follow / unfollow).
- Consume a dynamic feed of the most recent reviews from the people they follow.
- Browse detailed game information sourced from a public API (IGDB).

### 1.2 Functional Requirements

1. **User Authentication**
   - Registration and login with email/password and JWT.
   - Roles: `ADMIN` (moderation panel: users, reviews), `MODERATOR` (content moderation),
     `USER` (create/edit/delete own reviews, follow others, manage own profile), and guests
     (read-only access to public games, reviews and profiles).
   - Password change, forgot-password and reset-password flows.
2. **Profile Management**
   - Each user has a public profile with avatar, bio, location, website and their reviews.
3. **Video Game Catalog**
   - Game data is fetched from **IGDB** rather than hand-maintained: titles, covers, genres,
     platforms and ratings.
   - Genres and platforms are exposed as real filter options, not a duplicated local taxonomy.
4. **Reviews**
   - CRUD for reviews (create, read, update, delete) with one review per user per game.
   - Ratings out of 10, spoiler flags and publish state.
   - Likes on reviews; comments modelled in the schema.
5. **Social Feed**
   - A section where the user sees reviews from people they follow.
6. **User Connections**
   - Follow/unfollow, follower/following lists, follow suggestions and mutual connections.

### 1.3 Non-Functional Requirements

- **Security:** bcrypt password hashing, DTO validation, JWT in HTTP-only cookies, role
  guards, rate limiting and Helmet security headers.
- **Usability:** clear, responsive interface (mobile / desktop) with an accessible component
  system.
- **Accessibility:** keyboard-operable Radix primitives and `aria-*` attributes throughout.
- **SEO:** canonical URLs, Open Graph metadata, `robots.txt` and a server-rendered sitemap.
- **Maintainability:** a shared TypeScript contract between frontend and backend.

## 2. System Design

### 2.1 Architecture

- **Frontend:** Astro 5.x + React 19.x islands + Tailwind CSS v4, with Radix UI primitives
  and Nanostores for global state. Rendered with `output: 'server'` and the Vercel adapter.
- **Backend:** NestJS 11.x (Node.js) + TypeScript, REST API only, global prefix `/api` with
  URI versioning (`/api/v1`).
- **Database:** PostgreSQL with Prisma ORM 6.x.
- **Authentication:** JWT access + refresh tokens in HTTP-only cookies.
- **Public data:** IGDB via the Twitch client-credentials flow.
- **Deployment:** frontend on Vercel, backend on Render, managed PostgreSQL on Neon.

### 2.2 Data Model

Defined in `apps/backend/prisma/schema.prisma`:

- **User** — id, email, username, password (hash), role, displayName, bio, avatar, location,
  website, isPrivate, language, timezone, emailNotifications, resetToken.
- **Game** — id, igdbId, title, slug, coverImage, averageRating, reviewCount. The rating and
  count are the **Glitch community aggregate**; the IGDB rating is fetched live and shown
  separately.
- **Review** — id, title, content, rating (0–10), isPublished, isSpoiler, userId, gameId.
- **Follow** — followerId, followingId (self-referencing many-to-many).
- **Like** — userId, reviewId (unique pair).
- **Comment** — content, userId, reviewId.
- **GameList / GameListEntry** — modelled for future collections.
- **Achievement / UserAchievement / Notification / UserSession** — modelled for future
  features; not yet exposed through the API.

**Key constraints:** unique user email/username, unique game slug and igdbId, one review per
user per game, cascade deletes on user/game removal.

### 2.3 Web Sections

1. **Home** — landing and discovery.
2. **Explore games** — catalog with filters.
3. **Game detail** — metadata, community reviews and similar games.
4. **Reviews** — global listing and review detail.
5. **User profile** — public profile and activity.
6. **Feed** — reviews from followed users.
7. **Auth** — login and signup.
8. **Admin** — stats, user management and review moderation.

## 3. Implementation

### 3.1 Backend (REST API with NestJS)

The backend is a modular monolith. Feature modules expose REST controllers that delegate to
services, which use Prisma for persistence. There is no GraphQL layer.

Modules: `auth`, `users`, `games`, `reviews`, `social`, `admin`, `igdb`, `health`,
`database`, `common`.

- **`auth`** — register, login, refresh, logout, change-password, forgot-password,
  reset-password, me. Passport strategies (local, JWT, JWT refresh) + guards.
- **`users`** — user listing/search, public profile by username, followers, following,
  profile updates.
- **`games`** — public catalog reads: list with filters (genre, platform, status, rating
  range, sort), filter options, game by slug, similar games. Backed by `igdb`.
- **`igdb`** — IGDB integration: Twitch client-credentials auth with token caching,
  rate-limited HTTP client (250 ms), response mapping.
- **`reviews`** — review CRUD, per-game and per-user listings, like/unlike, and moderation
  hooks for admins/moderators.
- **`social`** — follow/unfollow, following lists, activity feed, stats, suggestions and
  mutual connections.
- **`admin`** — platform stats and user administration, restricted to `ADMIN`.
- **`common`** — pagination DTOs, exception filters and response interceptors.

Technical infrastructure:

- **Prisma ORM** for all database access.
- **Swagger** for REST documentation, served at `/api/docs` outside production.
- **Global concerns:** validation pipe (whitelist + transform), exception filter, response
  interceptor, Helmet, compression, cookie parsing, CORS with credentials, throttler.

### 3.2 Frontend (Astro + React Islands)

Astro renders every page on the server by default (`output: 'server'`). The only prerendered
route is `/feed`. Interactive behaviour is delivered as hydrated React islands.

#### Routes

| Route | Rendering | Notes |
|---|---|---|
| `/` | SSR | Home / discovery |
| `/games` | SSR | Catalog + filters |
| `/games/[slug]` | SSR | Game detail |
| `/reviews` | SSR | Global review listing |
| `/reviews/[id]` | SSR | Review detail |
| `/profile/[username]` | SSR | Public profile |
| `/feed` | Prerendered | Prerender shell; content is user-scoped |
| `/auth/login`, `/auth/signup` | SSR | Auth forms |
| `/admin`, `/admin/users`, `/admin/reviews` | SSR | Admin only, role-gated |

#### React islands

Auth forms, the game filter sidebar and mobile filter button, game header/tabs/review list,
review editor and actions, follow buttons and lists, profile header/tabs and edit dialog,
the activity feed, and the admin user/review tables and dialogs.

#### Styles, state and API access

- **Tailwind CSS v4** via `@tailwindcss/vite`, driven by tokens in
  `src/styles/global.css`. See the [System Design](./system-design.md).
- **Radix UI** headless primitives for accessible dialogs, menus, tabs, selects, etc.
- **Nanostores** for global state (`auth`, `games`, `reviews`, `social`, `users`,
  `explore`, `notifications`), each with a companion hook.
- **Typed API client** (`src/services/api.ts`): absolute URL for SSR, same-origin `/api/v1`
  in the browser, cookie forwarding on the server, automatic token refresh and an in-memory
  cache that is disabled for SSR responses.

## 4. Testing

Automated tests are **not yet in place**. The tooling is configured but no specs are
committed:

- **Backend:** Jest and Supertest are installed (`jest` config in
  `apps/backend/package.json`, `testRegex` matching `*.spec.ts`), but there are no
  `*.spec.ts` files yet.
- **Frontend:** `astro check` (TypeScript + Astro diagnostics) is wired to `pnpm
  type-check:frontend`; there is no component test runner.
- **E2E:** `apps/e2e` exists as a placeholder with no tests.

Until a suite exists, verification is manual plus `pnpm type-check` and `pnpm lint`. Adding
the automated suite is tracked in the [README roadmap](../../README.md#roadmap).

## 5. Local setup

### Prerequisites

- **Node.js** 18+
- **PNPM** 10+ (`corepack enable` then use the pinned `packageManager`)
- **Docker** & Docker Compose (for PostgreSQL, Redis and MinIO)

### Steps

```bash
pnpm install

# Start the infrastructure containers (postgres, redis, minio)
pnpm docker:dev

# Configure environment: create apps/backend/.env and apps/frontend/.env
# (see "Environment variables" below), then:
pnpm db:migrate
pnpm db:seed

pnpm dev            # backend + frontend together
```

### Local URLs

- Frontend: http://localhost:4321
- Backend API: http://localhost:3000/api/v1
- Swagger (non-production): http://localhost:3000/api/docs
- Prisma Studio: `pnpm db:studio`

### Environment variables

The backend reads its configuration from `apps/backend/.env`. Required for a working local
setup:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `FRONTEND_URL` | CORS origin (e.g. `http://localhost:4321`) |
| `PORT` | API port (default 3000) |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | IGDB credentials (Twitch app) |
| `NODE_ENV` | Controls Swagger and cookie security |

The frontend uses `PUBLIC_API_URL` for server-side API calls and `PUBLIC_SITE_URL` for
canonical/SEO metadata. In the browser the API is always called same-origin at `/api/v1`;
Vite proxies `/api` to the backend in development and the Vercel rewrite does the same in
production.

### Commands

```bash
# Workspace
pnpm dev                 # backend + frontend
pnpm build               # build both apps
pnpm lint                # lint both apps
pnpm type-check          # type-check both apps
pnpm format              # Prettier

# Per app
pnpm dev:backend         # NestJS with hot reload
pnpm dev:frontend        # Astro dev server
pnpm --filter backend test
pnpm --filter frontend type-check

# Database
pnpm db:migrate          # prisma migrate dev
pnpm db:seed             # load the seed dataset
pnpm db:studio           # Prisma Studio
pnpm db:reset            # destructive reset

# Docker
pnpm docker:dev          # start dev containers
pnpm docker:dev:down     # stop dev containers
pnpm docker:dev:logs     # follow logs
```

## 6. Deployment

- **Frontend → Vercel.** `apps/frontend/astro.config.mjs` sets
  `site: 'https://glitch-for-gamers.vercel.app'`, `output: 'server'` and the
  `@astrojs/vercel` adapter. `apps/frontend/vercel.json` rewrites `/api/:path*` to the
  Render backend so the browser always talks to a first-party origin.
- **Backend → Render**, running the NestJS build in a container.
- **Database → Neon** (managed PostgreSQL). Run `prisma migrate deploy` on release.

## 7. Workflow

- **Commits:** conventional commits (enforced by commitlint).
- **Type safety:** TypeScript strict across the workspace; shared types in
  `packages/shared-types`.
- **Styling:** token utilities only — never raw colours or arbitrary `var(--x)` classes. See
  the [System Design](./system-design.md).
- **Documentation:** update the relevant document under `docs/architecture/` when behaviour
  or structure changes.

## 8. Roadmap

1. **Automated tests** — backend unit/integration tests and an end-to-end suite in
   `apps/e2e`.
2. **Steam integration** — OAuth login and library sync.
3. **Social depth** — comment UI, notifications and achievements (schema already models
   them).
4. **Personal game lists** — favourites / playing / completed / backlog.
5. **AI recommendations** — suggestions based on a user's reviews and ratings.
6. **Internationalisation** — `User.language` already exists; UI strings are English-only.
