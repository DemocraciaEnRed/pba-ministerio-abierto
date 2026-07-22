import type { ConsultationsQueryInput } from '#shared/schemas/consultation'

/**
 * Traduce un estado temporal (derivado de fechas) a un filtro `where` de Prisma.
 * `scheduled`/`open`/`closed` solo aplican a consultas visibles; `archived`
 * filtra por la visibilidad homónima.
 */
export function consultationStateWhere(
  state: 'scheduled' | 'open' | 'closed' | 'archived',
  now: Date
) {
  switch (state) {
    case 'archived':
      return { visibility: 'archived' as const }
    case 'scheduled':
      return { visibility: 'visible' as const, startsAt: { gt: now } }
    case 'closed':
      return { visibility: 'visible' as const, endsAt: { lte: now } }
    case 'open':
      return {
        visibility: 'visible' as const,
        AND: [
          { startsAt: { lte: now } },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
        ]
      }
  }
}

/**
 * Construye el fragmento `where` común a partir de los filtros de query
 * (búsqueda, visibilidad, estado, destacadas, taxonomías). No incluye reglas
 * de autorización (visibilidad por rol/membresía), que cada handler aplica
 * por separado según su contexto.
 */
export function buildConsultationFilters(query: ConsultationsQueryInput, now: Date) {
  return {
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.state ? consultationStateWhere(query.state, now) : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.sectionSlug ? { section: { slug: query.sectionSlug } } : {}),
    ...(query.sectionIds ? { sectionId: { in: query.sectionIds } } : {}),
    ...(query.categoryIds
      ? { categoryAssignments: { some: { categoryId: { in: query.categoryIds } } } }
      : {}),
    ...(query.tagIds
      ? { consultationTags: { some: { tagId: { in: query.tagIds } } } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { summary: { contains: query.q } },
            { body: { contains: query.q } }
          ]
        }
      : {})
  }
}
