---
description: "Use when editing Prisma schema files under prisma/schema. Covers the numbered file-per-concern split and the migrate → generate → verify workflow for model changes."
applyTo: "prisma/schema/**"
---
# Prisma schema conventions (prisma/schema)

The schema is **split by concern into numbered files**; Prisma concatenates them at build. `00-base.prisma` holds the `generator` (`provider = "prisma-client"`, `output = "../generated"`) and `datasource` (`mysql`) — do not add models there.

Current files:

- `00-base.prisma` — generator + datasource only
- `01-users.prisma` — users, roles, verification tokens
- `02-consultations.prisma` — consultations, memberships
- `03-topics.prisma` — topics
- `04-participation.prisma` — support/vote/survey participation
- `05-comments.prisma` — comments, reactions
- `06-governance.prisma` — governance
- `07-assets.prisma` — assets, asset links
- `08-taxonomy.prisma` — sections, categories, tags
- `09-institution.prisma` — institution profile
- `10-closure.prisma` — closure / results
- `11-regional-meetings.prisma` — regional meetings (submissions, agenda, metrics)
- `12-consultation-registrations.prisma` — registration forms, registrations, accreditation
- `13-observatory.prisma` — observatory contributions, institutions, metrics
- `14-exports.prisma` — persistent CSV exports and their file parts

Place a new model in the file matching its concern. Only add a new numbered file for a genuinely new concern; keep the numeric prefixes ordered and two digits.

## Model change workflow (mandatory order)

After editing any `.prisma` file, run:

1. `pnpm db:migrate --name <nombre_descriptivo>` — create the local migration (uses `DATABASE_MIGRATION_URL` for the shadow DB). Use a descriptive snake_case name.
2. **Review the generated SQL** in [prisma/migrations/](../../prisma/migrations/) before committing.
3. `pnpm db:generate` — regenerate the Prisma client into `prisma/generated`.
4. `pnpm db:test` — confirm DB connectivity, then `pnpm typecheck` and `pnpm lint` (or `pnpm verify`) before closing the change.

Never create migrations against staging/production — those environments only run `pnpm db:deploy` on already-committed migrations. See the [README](../../README.md#prisma-y-migraciones) and [docs/runbook-db-production.md](../../docs/runbook-db-production.md).

## Conventions

- Import generated types/enums from `prisma/generated/*` (e.g. `prisma/generated/enums`), **never** from `@prisma/client`. In server code use the singleton `import { prisma } from '~~/server/utils/db'`.
- Models are PascalCase; enum values are snake_case (e.g. `UserStatus { active, inactive, suspended }`).
- Add `@@index([...])` for fields used in `where`/`orderBy` lookups.
- Data model rationale lives in [docs/modelo-datos.md](../../docs/modelo-datos.md): prefer explicit columns over JSON blobs, and separate configuration / content / participation concerns.
