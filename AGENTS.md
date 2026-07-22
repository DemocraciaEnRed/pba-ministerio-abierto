# AGENTS.md

Consultas Ciudadanas: a democraciaOS flavor built as a **monolithic modular Nuxt 4 app** (frontend + Nitro backend) for publishing citizen-participation processes. Stack: Nuxt 4, Nuxt UI 4, TypeScript, Zod, Prisma 7 + MariaDB/MySQL, nuxt-auth-utils.

## Working language

- **Code comments, error messages, and all user-facing strings are in Spanish** (Argentine "voseo"). Keep new strings in Spanish.
- Documentation under [docs/](docs/) is the source of truth for product and API decisions.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@11.5.0`). Run `nvm use` before terminal work.

- `pnpm dev` — run app at `http://localhost:3000`
- `pnpm verify` — **run before finishing any change**: `typecheck && lint && build`
- `pnpm typecheck` / `pnpm lint` — individually
- `pnpm db:generate` — regenerate Prisma client after schema edits
- `pnpm db:migrate --name <nombre>` — create a local migration (uses `DATABASE_MIGRATION_URL` for the shadow DB)
- `pnpm db:deploy` — apply pending migrations (staging/prod: never create migrations there)
- `pnpm db:seed` — seed base users + institution (`pnpm db:seed:base` / `:institution` for subsets)
- `pnpm db:test` — test DB connectivity; `pnpm db:studio` — Prisma Studio
- `pnpm test` — e2e backend tests (Vitest + `@nuxt/test-utils`) against the **test DB** `consultas_ciudadanas_test`. Prepare it once with `pnpm test:db:setup` (creates DB, grants, migrations, seed from `.env.test`). Tests live in `test/e2e/`.

First-time setup, dev users, email/storage behavior: see [README.md](README.md).

## Architecture & conventions

### Backend routing — entity-driven (source of truth: [docs/rutas-backend-entity-driven.md](docs/rutas-backend-entity-driven.md))

- **One entity, one root.** Same URL for all roles; role decides fields returned, not the URL. Do **not** split the whole API into `/api/public` vs `/api/admin` parallel trees (that approach is deprecated: [docs/rutas-backend.md](docs/rutas-backend.md)).
  - **Sanctioned exception — view/BFF endpoints.** A screen that must compose several entities for an overview may get a dedicated read-only view endpoint under an audience namespace (`/api/admin/<recurso>`) when the entity list would otherwise bloat for all roles or force N client requests. It complements (never replaces) the entity route, is read/composition only (mutations stay on entity routes), and follows the same handler discipline. First case: `GET /api/admin/consultations`. See [docs/rutas-backend-entity-driven.md](docs/rutas-backend-entity-driven.md).
- Nest only for real composition (`/api/consultations/:id/topics`); operate on identified entities via their own route (`/api/topics/:id`).
- Model non-CRUD actions as POST to a sub-resource (`POST /api/consultations/:id/visibility`, `POST /api/topics/:id/support`).
- Route files use HTTP-method suffixes: `login.post.ts`, `session.get.ts`, `index.patch.ts`.

### Handler discipline (details: [docs/autorizacion-y-dtos.md](docs/autorizacion-y-dtos.md))

Every handler follows: **validate → authorize → domain logic → serialize**.

1. Validate input first with `parseBody(event, Schema)` / `parseQuery(event, Schema)` from [server/utils/validate.ts](server/utils/validate.ts) (throws 422 with field-level errors).
2. Authorize with `getAuthContext(event)` then `assertCan(ctx, action, resource)` from [server/utils/auth/](server/utils/auth/). Never trust frontend auth state. Resource types: `{ type: 'self' }`, `{ type: 'platform' }`, `{ type: 'consultation', id }`.
3. **Never return raw Prisma objects** — serialize with role-based DTOs (e.g. [server/utils/serializers/user.ts](server/utils/serializers/user.ts) with `public`/`self`/`admin` views via overloads).
4. Auth endpoints return **generic responses** to avoid email enumeration (same reply whether or not the account exists).

### Prisma

- Import the client singleton: `import { prisma } from '~~/server/utils/db'`.
- Import generated types/enums from `prisma/generated/*` (e.g. `prisma/generated/enums`), **never** from `@prisma/client`.
- Schema is split by concern into numbered files in [prisma/schema/](prisma/schema/) (`01-users.prisma`, `02-consultations.prisma`, …). Prisma concatenates them.
- Model change flow: edit schema → `pnpm db:migrate --name ...` → review SQL → `pnpm db:generate` → `pnpm db:test`, `pnpm typecheck`, `pnpm lint`.

### Validation & shared code

- Zod schemas live in [shared/schemas/](shared/schemas/); export schema **and** its type (`export type LoginInput = z.output<typeof LoginSchema>`). Import via `#shared/schemas/...`.
- Shared type augmentation in [shared/types/](shared/types/) (e.g. `#auth-utils` `User` interface adds `id`).

### Frontend

- Nuxt UI components (`UApp`, `UContainer`, `UAuthForm`, …); pass Zod schemas to forms via `:schema`.
- Auth actions go through the [app/composables/useAuth.ts](app/composables/useAuth.ts) composable (handles `$fetch`, session refresh, toasts, loading, routing). Read session state via `useUserSession()` — never manually.
- Route protection via `definePageMeta({ middleware: 'auth' | 'guest' })` ([app/middleware/](app/middleware/)).
- Theme colors in [app/app.config.ts](app/app.config.ts). Components are PascalCase; `Header`/`Footer` are the only allowed single-word names (ESLint exception in [eslint.config.mjs](eslint.config.mjs)).

### Server utilities

- Email: [server/utils/mailer/](server/utils/mailer/) (empty `NUXT_MAIL_TRANSPORT` logs to console in dev).
- Storage: driver abstraction (`local` | `s3`) in [server/utils/storage/](server/utils/storage/).
- Verification tokens: [server/utils/auth/tokens.ts](server/utils/auth/tokens.ts) persists only the SHA-256 hash; the raw token is emailed and never stored.

## Key docs

- Product scope & roles: [docs/lineamientos-producto.md](docs/lineamientos-producto.md)
- Technical direction: [docs/lineamientos-tecnicos.md](docs/lineamientos-tecnicos.md)
- Data model: [docs/modelo-datos.md](docs/modelo-datos.md)
- Implementation roadmap (what's done / next): [docs/hoja-de-ruta-implementacion.md](docs/hoja-de-ruta-implementacion.md)
- Production DB runbook: [docs/runbook-db-production.md](docs/runbook-db-production.md)
