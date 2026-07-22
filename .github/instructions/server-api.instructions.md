---
description: "Use when creating or editing Nitro API route handlers under server/api. Enforces the entity-driven routing contract and the validate → authorize → domain logic → serialize handler discipline."
applyTo: "server/api/**"
---
# API handler conventions (server/api)

The backend follows the **entity-driven híbrido** contract in [docs/rutas-backend-entity-driven.md](../../docs/rutas-backend-entity-driven.md) (organization by entity + a disciplined role-based authorization layer) and the authorization/DTO rules in [docs/autorizacion-y-dtos.md](../../docs/autorizacion-y-dtos.md). This decision is final: the audience-driven approach in [docs/rutas-backend.md](../../docs/rutas-backend.md) is discarded (historical annex only).

## Routing

- **One entity, one root.** Same URL for every role; the role decides which fields are returned, not the URL. Never split the whole API into `/api/public` vs `/api/admin` parallel trees (deprecated).
- Nest only for real composition (`/api/consultations/:id/topics`). Operate on an identified entity through its own route (`/api/topics/:id`).
- **`PUT`/`PATCH` only to update a resource's own data.** Non-CRUD business actions (publish, close, change format, moderate, participate) are POST to an action sub-resource: `POST /api/consultations/:id/visibility`, `POST /api/topics/:id/support`, `POST /api/comments/:id/moderation`.
- Name files with the HTTP-method suffix: `index.get.ts`, `login.post.ts`, `index.patch.ts`, `[id].delete.ts`.
- Prefixes: `/api/*` (domain resources), `/api/auth/*` (auth/session), `/api/me/*` (current user).

### Sanctioned exception: view-oriented (BFF) endpoints

Entity-driven is the default, not a dogma. A screen that needs to **compose several entities** for an overview may get a dedicated **view/BFF endpoint** instead of overloading the canonical entity list (which would either bloat the response for all roles or force N client requests). Rules (full detail in [docs/rutas-backend-entity-driven.md](../../docs/rutas-backend-entity-driven.md)):

- Only when there is **real overhead** — never for convenience when the entity endpoint suffices.
- Lives under an **audience/screen namespace**: `server/api/admin/<recurso>/...` for platform-admin screens. It **complements** the entity route, never replaces it.
- **Read/composition only.** Mutations still go through each entity's entity-driven routes.
- Same handler discipline (Zod → auth context → `assertCan` → role serializer). Never returns raw Prisma objects.
- The **canonical entity endpoint stays untouched** (same contract, no heavy embedded relations). Share `where`/filter logic via a util instead of duplicating (e.g. [server/utils/consultation-query.ts](../../server/utils/consultation-query.ts)).
- Example: `GET /api/admin/consultations` — consultations plus a lightweight topic summary, guarded by `assertCan(ctx, 'read', { type: 'platform' })`.

## Every handler: Zod → auth context → load resource → assertCan → domain → serialize

1. **Validate first (Zod → 422).** Parse input with `parseBody(event, Schema)` / `parseQuery(event, Schema)` (auto-imported from [server/utils/validate.ts](../../server/utils/validate.ts)) using a Zod schema from [shared/schemas/](../../shared/schemas/) (`#shared/schemas/...`). These throw 422 with field-level errors — do not hand-roll validation.
2. **Build the auth context.** `const ctx = await getAuthContext(event)`. Never trust frontend auth state. Roles: `anonymous`, `citizen`, `consultation_admin` (contextual, via `ConsultationMembership`), `platform_admin` (via `PlatformRoleAssignment`).
3. **Load the resource** (when the action targets one) before authorizing — `assertCan` for a `{ type: 'consultation', id }` check needs the loaded resource. Use the Prisma singleton `prisma` (auto-imported); `userWithRolesInclude` + `toResolvedUser(...)` when you need the resolved user.
4. **Authorize explicitly (401/403).** `await assertCan(ctx, action, resource)`. Resource types: `{ type: 'self' }`, `{ type: 'platform' }`, `{ type: 'consultation', id }`. After `assertCan`, `ctx.user` is present (`ctx.user!`). For endpoints that only need an active session, `assertUserActive(status)` is the lightweight shortcut.
5. **Domain logic** via `prisma`.
6. **Serialize before returning.** Never return raw Prisma objects — use a role-based serializer with a field whitelist per role (e.g. `serializeUser(user, 'public' | 'self' | 'admin')` from [server/utils/serializers/](../../server/utils/serializers/)). Pick the narrowest view the caller is allowed to see.

```typescript
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'self' })

  const body = await parseBody(event, UpdateProfileSchema)

  const updated = await prisma.user.update({
    where: { id: ctx.user!.id },
    data: body,
    include: userWithRolesInclude
  })

  return serializeUser(toResolvedUser(updated), 'self')
})
```

## Auth-sensitive endpoints

- Return **generic responses** to avoid email/account enumeration: the same reply whether or not the account exists (see [server/api/auth/register.post.ts](../../server/api/auth/register.post.ts), [server/api/auth/login.post.ts](../../server/api/auth/login.post.ts)).
- Sessions are managed with nuxt-auth-utils: `setUserSession(event, { user: { id } })`, `clearUserSession(event)`. Store only the user `id` in the session.

## Other rules

- Import Prisma types/enums from `prisma/generated/*` (e.g. `prisma/generated/enums`), **never** from `@prisma/client`.
- All error messages and user-facing strings are in **Spanish** (voseo).
- `throw createError({ statusCode, message })` for error responses; do not return ad-hoc error objects.
