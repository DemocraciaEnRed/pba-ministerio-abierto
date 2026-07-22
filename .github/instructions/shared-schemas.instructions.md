---
description: "Use when creating or editing Zod validation schemas under shared/schemas. Enforces the schema + type export convention, reusable field definitions, and Spanish error messages."
applyTo: "shared/schemas/**"
---
# Zod schema conventions (shared/schemas)

Schemas are shared between frontend forms (`:schema` on Nuxt UI forms) and server handlers (`parseBody`/`parseQuery`). Import them via the `#shared/schemas/...` alias — never with a relative path.

## Export a schema **and** its inferred type

For every schema, export the `z.object(...)` as `<Name>Schema` and its inferred type as `<Name>Input` using `z.output`:

```typescript
export const LoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'La contraseña es requerida')
})

export type LoginInput = z.output<typeof LoginSchema>
```

- Schema names are PascalCase and end in `Schema`; type names end in `Input`.
- Always derive the type with `z.output<typeof XSchema>` — do not hand-write the interface.
- Group all `export type ... = z.output<...>` lines at the bottom of the file (mirroring the schema order).

## Reuse field definitions

Factor repeated fields into a module-level constant instead of duplicating rules across schemas:

```typescript
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo electrónico inválido'))
```

- Passwords: `z.string().min(8, 'Debe tener al menos 8 caracteres').max(72, 'Máximo 72 caracteres')` (72 = bcrypt limit).

## Spanish error messages (voseo)

Every user-facing validation message is in **Spanish**, Argentine voseo (e.g. `'La contraseña es requerida'`, `'Correo electrónico inválido'`). Add a message to any constraint a user can trigger; internal-only fields (e.g. `token`) may use a bare `.min(1)`.

## Conventions

- Use `import * as z from 'zod'` (Zod v4).
- One concern per file (e.g. [shared/schemas/auth.ts](../../shared/schemas/auth.ts) for auth). Keep names aligned with the domain, not the endpoint.
