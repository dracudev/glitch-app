# Glitch Backend — Technical Context Document

**Last Updated:** September 2026
**Status:** Production Ready

## 1. High-Level Overview

The Glitch backend is the REST API that powers the platform: authentication, user profiles,
the game catalog, reviews, social features and the admin back-office. It is a **modular
monolith** built with NestJS, backed by PostgreSQL through Prisma.

### Core functionality

- **Game catalog**: public reads of IGDB-sourced game data with filters, search and similar
  games.
- **Authentication & authorization**: JWT with HTTP-only cookies and role-based access
  control (`USER`, `MODERATOR`, `ADMIN`).
- **Reviews**: full CRUD with ratings out of 10, likes, and moderation.
- **Social**: follow relationships, an activity feed, stats, suggestions and mutual
  connections.
- **Profiles**: public profile data, followers/following, self-service profile updates.
- **Back-office**: platform stats and user administration restricted to admins.

There is **no GraphQL**; the API is REST-only.

## 2. Technology Stack

### Core technologies

- **Framework**: NestJS 11.x on Node.js, TypeScript.
- **Database**: PostgreSQL with Prisma ORM 6.x.
- **Auth**: JWT (access + refresh) via Passport strategies, delivered in HTTP-only cookies.
- **Validation**: `class-validator` + `class-transformer` on all DTOs.
- **Docs**: Swagger/OpenAPI (`@nestjs/swagger`).
- **Security**: Helmet, CORS with credentials, `@nestjs/throttler` rate limiting, bcryptjs.

### Key dependencies

`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`,
`@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/throttler`, `@prisma/client`,
`bcryptjs`, `class-validator`, `class-transformer`, `helmet`, `compression`,
`cookie-parser`, `passport-jwt`, `passport-local`, `redis`. Workspace packages:
`@glitch/shared-types`, `@glitch/utils`.

## 3. Architecture & Design Patterns

```tree
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │   Data Layer    │
│   (HTTP Layer)  │───▶│  (Business      │───▶│  (Prisma +      │
│                 │    │   Logic)        │    │  PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Patterns in use:

1. **Module pattern** — every feature is a self-contained NestJS module.
2. **Repository pattern** — `PrismaService` abstracts database access.
3. **DTO pattern** — validated DTOs for every request/response shape.
4. **Guard pattern** — `JwtAuthGuard`, `RolesGuard` and a `@Public()` decorator.
5. **Strategy pattern** — local, JWT and JWT-refresh Passport strategies.
6. **Decorator pattern** — `@GetUser()`, `@Public()`, `@Roles()`.

### Directory structure

```tree
src/
├── app.module.ts        # Root module (global config, throttler, modules)
├── main.ts              # Bootstrap: CORS, Helmet, compression, cookies, validation,
│                        #   URI versioning, /api prefix, Swagger, shutdown hooks
├── auth/
│   ├── constants/       # Auth constants
│   ├── decorators/      # GetUser, Public, Roles
│   ├── dto/             # Login, Register, password DTOs
│   ├── guards/          # JWT, Local, Refresh, Roles guards
│   ├── interfaces/      # Auth types
│   └── strategies/      # JWT, Local, JWT-refresh strategies
├── users/               # Profiles, followers/following, profile updates
├── games/               # Public catalog reads (filters, slug, similar)
├── reviews/             # Review CRUD, likes, moderation
├── social/              # Follow, feed, stats, suggestions, mutual
├── admin/               # Stats + user administration (ADMIN only)
├── igdb/                # IGDB integration (auth token cache, HTTP client, mapper)
├── health/              # Lightweight health endpoint
├── common/              # Pagination DTOs, exception filter, response interceptor
└── database/            # PrismaService + DatabaseModule
```

### Cross-cutting concerns

- **Global prefix `/api` + URI versioning** (`defaultVersion: '1'`) → all routes live under
  `/api/v1`.
- **Global validation pipe** with `whitelist`, `forbidNonWhitelisted` and `transform`.
- **Exception filter** and **response interceptor** for uniform envelopes/errors.
- **Security middleware**: Helmet, CORS (`FRONTEND_URL` origin, credentials), compression,
  cookie parsing.
- **Rate limiting** via `@nestjs/throttler`.
- **Swagger** at `/api/docs`, enabled outside production only.

## 4. Data Model

Source: `apps/backend/prisma/schema.prisma` (11 models, 2 enums).

### Core entities

**User** (`users`) — `id` (cuid), `email` (unique), `username` (unique), `password` (hash),
`role` (`UserRole`), `displayName`, `bio`, `avatar`, `location`, `website`, `isPrivate`,
`language`, `timezone`, `emailNotifications`, `resetToken`, timestamps.

**Game** (`games`) — `id`, `igdbId` (unique, nullable), `title`, `slug` (unique),
`coverImage`, `averageRating`, `reviewCount`, timestamps. `averageRating` and `reviewCount`
are the **Glitch community aggregate**; the IGDB rating is fetched live and shown separately.

**Review** (`reviews`) — `id`, `title` (nullable), `content`, `rating` (Float, 0–10),
`isPublished`, `isSpoiler`, `userId`, `gameId`, timestamps. Unique on `(userId, gameId)`.

### Social entities

**Follow** (`follows`) — composite key `(followerId, followingId)`, self-referencing.
**Like** (`likes`) — unique `(userId, reviewId)`. **Comment** (`comments`) — `content`,
`userId`, `reviewId`.

### Modelled for future features

**GameList** / **GameListEntry** (collections), **Achievement** / **UserAchievement**,
**Notification** (`NotificationType` enum: FOLLOW, LIKE, COMMENT, REVIEW_REPLY, SYSTEM),
**UserSession**. These are in the schema but are **not yet exposed through the API**.

### Enums

- `UserRole`: `USER` (default), `ADMIN`, `MODERATOR`.
- `NotificationType`: `FOLLOW`, `LIKE`, `COMMENT`, `REVIEW_REPLY`, `SYSTEM`.

### Constraints & indexes

Unique email/username; unique game slug and `igdbId`; one review per user per game; unique
like pair; cascade deletes from `User`/`Game`/`Review`.

## 5. API Reference

All routes are under `/api/v1`. Routes marked *public* are readable without authentication;
the rest require a valid session. Admin routes are restricted to `ADMIN`.

### Health

```tree
GET    /api/v1/health                        # { status: 'ok' } — no DB access
```

### Authentication (`/api/v1/auth`)

```tree
POST   /api/v1/auth/register                 # Register (public)
POST   /api/v1/auth/login                    # Login (public)
POST   /api/v1/auth/refresh                  # Refresh tokens using the refresh token
POST   /api/v1/auth/logout                   # Clear session cookies
POST   /api/v1/auth/change-password          # Authenticated
POST   /api/v1/auth/forgot-password          # Request a reset token (public)
POST   /api/v1/auth/reset-password           # Reset with token (public)
GET    /api/v1/auth/me                       # Current user
```

### Users (`/api/v1/users`)

```tree
GET    /api/v1/users                                    # List/search users (public)
GET    /api/v1/users/profile/:username                  # Public profile (public)
GET    /api/v1/users/profile/:username/followers        # Followers (public)
GET    /api/v1/users/profile/:username/following        # Following (public)
PATCH  /api/v1/users/profile                            # Update own profile
```

### Games (`/api/v1/games`) — public

```tree
GET    /api/v1/games                    # Catalog: genreIds, platformIds, status,
                                        #   minRating, maxRating, sortBy, pagination
GET    /api/v1/games/filters            # IGDB genre + platform filter options
GET    /api/v1/games/:slug              # Game detail by slug
GET    /api/v1/games/:id/similar        # Similar games
```

Games are read-only and sourced from IGDB; there is no game create/update/delete endpoint.

### Reviews (`/api/v1/reviews`)

```tree
POST   /api/v1/reviews                          # Create own review
GET    /api/v1/reviews                          # List (supports isPublished filter for staff)
GET    /api/v1/reviews/:id                      # Review detail
GET    /api/v1/reviews/game/:gameId             # Reviews for a game
GET    /api/v1/reviews/user/:userId             # Reviews by a user
GET    /api/v1/reviews/user/:userId/game/:gameId# Single review for a user+game
PATCH  /api/v1/reviews/:id                      # Update (owner, or staff moderation)
DELETE /api/v1/reviews/:id                      # Delete (owner, or staff moderation)
POST   /api/v1/reviews/:id/like                 # Like a review
DELETE /api/v1/reviews/:id/like                 # Unlike a review
```

An admin/moderator may update or delete **any** review and may see unpublished ones; a
regular user is scoped to their own.

### Social (`/api/v1/social`)

```tree
POST   /api/v1/social/follow/:userId            # Follow a user
DELETE /api/v1/social/follow/:userId            # Unfollow a user
GET    /api/v1/social/following/:userId         # Users a user follows
GET    /api/v1/social/feed                      # Activity feed from followed users
GET    /api/v1/social/stats                     # Current user's stats
GET    /api/v1/social/stats/:userId             # A user's stats
GET    /api/v1/social/suggestions               # Follow suggestions
GET    /api/v1/social/mutual/:userId            # Mutual connections
```

### Admin (`/api/v1/admin`) — `ADMIN` only

```tree
GET    /api/v1/admin/stats            # Platform statistics
GET    /api/v1/admin/users            # List/search users
POST   /api/v1/admin/users            # Create a user
PATCH  /api/v1/admin/users/:id        # Update a user (role, profile)
DELETE /api/v1/admin/users/:id        # Delete a user
```

## 6. IGDB Integration

The `igdb/` module wraps the IGDB API (Twitch client-credentials flow):

- `igdb-auth.service.ts` — obtains and caches the Twitch access token.
- `igdb-client.service.ts` — rate-limited HTTP client (250 ms spacing between calls) and
  field selection for games (genres, platforms, covers, ratings).
- `igdb.mapper.ts` / `igdb.types.ts` — maps IGDB responses into the shapes the API returns.

The catalog is public and cached; `GET /games` never requires a session.

## 7. Configuration

Environment variables read from `apps/backend/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `FRONTEND_URL` | CORS origin with credentials |
| `PORT` | API port (default 3000) |
| `NODE_ENV` | `production` disables Swagger and relaxes/switches cookie security |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | IGDB credentials |

In production the refresh cookie is set `sameSite: 'none'` + `secure` so the cross-site
Vercel → Render flow keeps working.

## 8. Deployment

- **Backend** runs on **Render** as a containerised NestJS app.
- **Database** is managed **PostgreSQL on Neon**; run `prisma migrate deploy` on release.
- The frontend rewrites `/api/*` to the Render host (`apps/frontend/vercel.json`), so the
  browser calls the API on a first-party origin and cookies stay attached.

## 9. Known gaps

- No automated tests yet (Jest/Supertest are installed but no specs exist).
- `redis` is a dependency but caching is not yet wired into the API.
- The `Notification`, `Achievement` and `GameList` models have no endpoints yet.
