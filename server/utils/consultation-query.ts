import type { ConsultationsQueryInput } from '#shared/schemas/consultation'

type ConsultationOrderState = 'scheduled' | 'open' | 'closed' | 'archived'

export interface ConsultationPageSegment {
  bucketIndex: number
  skip: number
  take: number
}

function consultationOrderBy(state: ConsultationOrderState) {
  switch (state) {
    case 'open':
      return [
        { endsAt: { sort: 'asc' as const, nulls: 'last' as const } },
        { startsAt: 'desc' as const },
        { createdAt: 'desc' as const },
        { id: 'desc' as const }
      ]
    case 'scheduled':
      return [
        { startsAt: 'asc' as const },
        { endsAt: { sort: 'asc' as const, nulls: 'last' as const } },
        { createdAt: 'desc' as const },
        { id: 'desc' as const }
      ]
    case 'closed':
      return [
        { endsAt: 'desc' as const },
        { createdAt: 'desc' as const },
        { id: 'desc' as const }
      ]
    case 'archived':
      return [
        { createdAt: 'desc' as const },
        { id: 'desc' as const }
      ]
  }
}

/**
 * Traduce un estado temporal (derivado de fechas) a un filtro `where` de Prisma.
 * `scheduled`/`open`/`closed` solo aplican a consultas visibles; `archived`
 * filtra por la visibilidad homónima.
 */
export function consultationStateWhere(
  state: ConsultationOrderState,
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
 * Define los grupos que componen el orden útil del listado. Sin un estado
 * temporal explícito, las visibles se concatenan por estado y las consultas
 * no visibles permitidas por autorización quedan al final.
 */
export function buildConsultationOrderBuckets(query: ConsultationsQueryInput, now: Date) {
  if (query.state) {
    return [{ where: {}, orderBy: consultationOrderBy(query.state) }]
  }

  if (query.visibility === 'hidden' || query.visibility === 'archived') {
    return [{ where: {}, orderBy: consultationOrderBy('archived') }]
  }

  const visibleBuckets = (['open', 'scheduled', 'closed'] as const).map(state => ({
    where: consultationStateWhere(state, now),
    orderBy: consultationOrderBy(state)
  }))

  if (query.visibility === 'visible') {
    return visibleBuckets
  }

  return [
    ...visibleBuckets,
    {
      where: { visibility: { in: ['hidden' as const, 'archived' as const] } },
      orderBy: consultationOrderBy('archived')
    }
  ]
}

/**
 * Convierte una página global en los tramos locales que deben consultarse en
 * cada grupo, sin cargar ni ordenar en memoria el listado completo.
 */
export function getConsultationPageSegments(
  bucketCounts: number[],
  skip: number,
  take: number
): ConsultationPageSegment[] {
  const segments: ConsultationPageSegment[] = []
  let bucketStart = 0
  let remaining = take

  for (const [bucketIndex, bucketCount] of bucketCounts.entries()) {
    if (remaining === 0) break

    const localSkip = Math.max(0, skip - bucketStart)
    if (localSkip < bucketCount) {
      const localTake = Math.min(bucketCount - localSkip, remaining)
      segments.push({ bucketIndex, skip: localSkip, take: localTake })
      remaining -= localTake
    }

    bucketStart += bucketCount
  }

  return segments
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
    ...(query.regionSlug ? { region: { slug: query.regionSlug } } : {}),
    ...(query.regionIds ? { regionId: { in: query.regionIds } } : {}),
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
