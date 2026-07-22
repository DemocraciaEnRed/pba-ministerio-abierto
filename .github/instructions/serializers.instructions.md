---
description: "Use when creating or editing DTO serializers under server/utils/serializers. Enforces role-based view overloads, explicit field whitelisting, and never returning raw Prisma objects."
applyTo: "server/utils/serializers/**"
---
# DTO serializer conventions (server/utils/serializers)

Handlers must **never return raw Prisma objects** — every response goes through a serializer that whitelists fields per role. See the reference implementation in [server/utils/serializers/user.ts](../../server/utils/serializers/user.ts) and the DTO strategy in [docs/autorizacion-y-dtos.md](../../docs/autorizacion-y-dtos.md).

## One serializer per entity, with role-based view overloads

Name the function `serialize<Entity>` and a `<Entity>View` union of the roles that can see the entity. Define an explicit `interface <Role><Entity>DTO` per view, then expose them via **TypeScript function overloads** so the return type is inferred from the `view` argument:

```typescript
export type UserView = 'public' | 'self' | 'admin'

export interface PublicUserDTO { id: number; displayName: string | null }
export interface SelfUserDTO { id: number; email: string; /* … */ }

export function serializeUser(user: ResolvedUser, view: 'public'): PublicUserDTO
export function serializeUser(user: ResolvedUser, view: 'self' | 'admin'): SelfUserDTO
export function serializeUser(user: ResolvedUser, view: UserView): PublicUserDTO | SelfUserDTO {
  if (view === 'public') {
    return { id: user.id, displayName: user.displayName }
  }
  return { id: user.id, email: user.email /* … full whitelist */ }
}
```

## Whitelist, never spread

- **List every field explicitly.** Never `return { ...user }` or spread a Prisma object — that leaks fields (drafts, moderation data, hashes) and defeats the point of the role check.
- The `public` view exposes the minimum; broader views add fields. A narrower view must never contain a field the caller isn't allowed to see.
- Accept a resolved domain type (e.g. `ResolvedUser` from [server/utils/auth/context.ts](../../server/utils/auth/context.ts)), not the raw Prisma model, when one exists.

## Serialize at the boundary

- Convert `Date` to ISO strings (`value?.toISOString() ?? null`) — DTOs carry `string`, never `Date`.
- Derive computed/flattened fields here (e.g. `roles: { isPlatformAdmin: user.platformRoles.includes('platform_admin') }`), not in the handler.
- Serializers are pure and synchronous: no `prisma` calls, no `event` access, no I/O. Load and authorize in the handler, then pass the data in.
- DTO field names are camelCase; the caller picks the narrowest view its authorization allows.
