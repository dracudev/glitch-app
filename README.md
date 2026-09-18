# Glitch

**A social network for gamers** — think Letterboxd, but for video games.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![PNPM](https://img.shields.io/badge/PNPM-10+-orange.svg)](https://pnpm.io/)
[![Astro](https://img.shields.io/badge/Astro-5.x-ff5d01.svg)](https://astro.build/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-e0234e.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)

**Last Updated:** September 2026

Glitch is a community platform where players rate and review the games they play, follow
people whose taste they trust, and discover what to play next. The score on a game is the
average of what players gave it — there is no publisher score and no editorial verdict.

## Live application

| Piece | URL |
|---|---|
| Web app (Front-Office + Back-Office) | https://glitch-for-gamers.vercel.app |
| REST API | https://questlog-app.onrender.com/api/v1 |
| API docs (Swagger, non-production only) | `/api/docs` |

## What Glitch is

- **Player-authored.** Reviews and ratings come from the community. A game's score is the
  Glitch aggregate (`averageRating`, `reviewCount`); the IGDB rating is shown separately as
  external reference.
- **Social by design.** Follow other players, browse an activity feed of people you follow,
  get follow suggestions, and see mutual connections.
- **Built on real game data.** The catalog comes from IGDB (via the Twitch client-credentials
  flow), so genres, platforms, covers and release data are live rather than hand-maintained.
- **Two audiences, two surfaces.** A public Front-Office for browsing games, reviews and
  profiles, and a private Back-Office at `/admin` for moderation and user management.

## Features

### Accounts, roles and sessions

- Email/password registration and login with JWT.
- Access token (15 min) and refresh token (7 days) stored in **HTTP-only cookies**; the API
  also accepts `Authorization: Bearer` for SSR and non-browser callers.
- Three roles: `USER`, `MODERATOR`, `ADMIN`.
- Password change, forgot-password and reset-password flows, plus `GET /auth/me`.

### Game catalog (IGDB)

- Browse the catalog with filters by **genre**, **platform**, status and rating range, with
  sorting and pagination.
- `GET /games/filters` returns the real IGDB genre and platform options used to build the
  filter UI, so the taxonomy is the live IGDB one rather than a duplicated local list.
- Game detail pages aggregate community reviews and surface similar games.
- IGDB access is cached and rate-limited in the backend (`igdb/` module, 250 ms request
  spacing, client-credentials token caching).

### Reviews

- Full CRUD: any registered user can create, edit and delete **their own** reviews.
- One review per user per game (enforced by a database unique constraint).
- Ratings are out of 10. Reviews support titles, spoiler flags and publish state.
- Likes on reviews, and comments are modelled in the schema.
- Moderation: an admin/moderator can edit, unpublish or delete **any** review.

### Social

- Follow / unfollow, followers and following lists.
- Personal activity feed built from the reviews of the people you follow.
- Social statistics, follow suggestions and mutual-connection discovery.

### Profiles

- Public profile pages at `/profile/[username]` with bio, avatar, location, website, stats
  and their reviews.

### Back-Office (`/admin`)

- Role-gated to `ADMIN`, enforced both in the frontend (SSR redirect) and the backend
  (`RolesGuard`).
- Platform stats dashboard, user administration (create, update role/profile, delete) and
  review moderation.

## Architecture

Glitch is a **PNPM monorepo** with two applications sharing a typed contract.

```tree
glitch-app/
├── apps/
│   ├── backend/          # NestJS REST API (Prisma + PostgreSQL)
│   ├── frontend/         # Astro 5 + React 19 application
│   └── e2e/              # Reserved for end-to-end tests (not implemented yet)
├── packages/
│   ├── shared-types/     # TypeScript types shared by frontend and backend
│   ├── utils/            # Shared helpers
│   └── config/           # Shared ESLint / Prettier / TypeScript config
├── docker/               # Docker configuration
├── docs/                 # Project documentation
└── scripts/              # Development helper scripts
```

`packages/` also contains reserved, currently empty folders for planned work:
`analytics/`, `game-apis/`, `indie-sdk/` and `steam-integration/`.

### Frontend — Astro 5 + React 19

- **Astro 5** with `output: 'server'` and the `@astrojs/vercel` adapter. Pages are
  server-rendered by default (`/feed` is the one prerendered page).
- **React 19 islands** for interactive parts (auth forms, filters, review editor, follow
  buttons, admin tables).
- **Tailwind CSS v4** (`@tailwindcss/vite`) with a token-driven design system.
- **Radix UI** primitives for accessible dialogs, menus, tabs, selects, tooltips, etc.
- **Nanostores** for lightweight global state (auth, games, reviews, social, users).
- API access goes through a typed client (`src/services/api.ts`) with an in-memory cache,
  automatic token refresh and SSR cookie forwarding.

### Backend — NestJS 11 + Prisma 6

- **NestJS 11** modular REST API, global prefix `/api` with URI versioning (`/api/v1`).
- **Prisma 6 + PostgreSQL** for the database.
- **Auth** with Passport strategies (local, JWT, JWT refresh), HTTP-only cookies and
  role-based guards.
- **Security**: Helmet, CORS with credentials, rate limiting (`@nestjs/throttler`),
  global validation pipe (whitelist + transform).
- **Swagger/OpenAPI** served at `/api/docs` outside production.
- Modular domains: `auth`, `users`, `games`, `reviews`, `social`, `admin`, `igdb`,
  `health`, `database`, `common`.

### Data model

Defined in `apps/backend/prisma/schema.prisma`:

`User`, `Game`, `Review`, `Follow`, `Like`, `Comment`, `GameList`, `GameListEntry`,
`Achievement`, `UserAchievement`, `Notification`, `UserSession`.

The last four groups (game lists, achievements, notifications, sessions) are modelled for
planned features but are not yet exposed through the API.

## API overview

All routes are versioned under `/api/v1`.

| Group | Purpose |
|---|---|
| `GET /health` | Lightweight health check |
| `/auth` | register, login, refresh, logout, change/forgot/reset password, me |
| `/users` | list & search, profile by username, followers, following, update profile |
| `/games` | catalog with filters, filter options (`/games/filters`), game by slug, similar games |
| `/reviews` | create/read/update/delete, by game, by user, user+game lookup, like/unlike |
| `/social` | follow/unfollow, following, feed, stats, suggestions, mutual connections |
| `/admin` | platform stats, user administration (admin only) |

## Design

Glitch is a dark-first, single-hue product surface built on a documented token system. The
brand direction, full token tables, component contracts and accessibility rules live in
[`docs/architecture/system-design.md`](./docs/architecture/system-design.md); the tokens
themselves are authored in `apps/frontend/src/styles/global.css`, which is authoritative.

## SEO and accessibility

- Per-page titles, canonical URLs and Open Graph metadata, with a configurable `PUBLIC_SITE_URL`.
- `public/robots.txt` disallows the private surfaces (`/admin/`, `/auth/`, `/feed`) and
  references the sitemap.
- A server-rendered `sitemap.xml` endpoint lists the static pages plus live game, profile
  and review URLs.
- Semantic markup, keyboard-operable Radix primitives and `aria-*` attributes throughout.

## Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Astro `output: 'server'` via `@astrojs/vercel` |
| API proxy | **Vercel rewrite** | `vercel.json` forwards `/api/*` to the Render backend, keeping cookies first-party |
| Backend | **Render** | NestJS API, containerised |
| Database | **Neon** | Managed PostgreSQL |

## Project status

| Area | State |
|---|---|
| Authentication, roles, profiles | Done |
| IGDB catalog, filters, game pages | Done |
| Reviews (CRUD, likes, moderation) | Done |
| Social (follow, feed, suggestions, stats) | Done |
| Back-Office (stats, users, review moderation) | Done |
| SEO (metadata, robots, sitemap) | Done |
| Automated tests | **Not yet in place** — tooling is configured (Jest on the backend, `astro check` on the frontend) but no specs are committed |

### Roadmap

- Automated test suite (unit, integration and end-to-end).
- Steam OAuth login and library sync.
- Comment UI, notifications and achievements (already modelled in the schema).
- Personal game lists (favourites / playing / completed / backlog).
- AI-assisted recommendations.
- Internationalisation (the `User.language` field already exists).

## Documentation

| Document | Contents |
|---|---|
| [System Design](./docs/architecture/system-design.md) | Brand, design tokens, component contracts, accessibility |
| [Backend TCD](./docs/architecture/backend-tcd.md) | Backend architecture, data model and API reference |
| [Frontend TCD](./docs/architecture/frontend-tcd.md) | Frontend architecture, routing, rendering and state |
| [Project Structure](./docs/architecture/project-structure.md) | Monorepo organisation |
| [Development Guide](./docs/architecture/dev-guide.md) | Requirements, local setup, commands and workflow |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file.

## Acknowledgments

- **Letterboxd**, for the inspiration of a social network built around media you consume.
- **IGDB** and **Twitch**, for the game catalog and data API.
- The **NestJS** and **Astro** communities.

---

Built with care for the gaming community.
