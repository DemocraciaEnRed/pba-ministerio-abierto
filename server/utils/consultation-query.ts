import type { ConsultationsQueryInput } from '#shared/schemas/consultation'
import type { ConsultationWhereInput } from '~~/prisma/generated/models'

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

  // Varios estados: un grupo por estado, en el orden útil de lectura
  // (abiertas → programadas → finalizadas), independiente del orden recibido.
  if (query.states) {
    return (['open', 'scheduled', 'closed'] as const)
      .filter(state => query.states!.includes(state))
      .map(state => ({
        where: consultationStateWhere(state, now),
        orderBy: consultationOrderBy(state)
      }))
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
 * Instancias visibles con actividad en la ventana `[from, to]`:
 * - su período de participación se superpone con la ventana (empiezan antes
 *   del fin y no terminaron antes del inicio; sin `endsAt` = indefinida), o
 * - su inscripción presencial se superpone con la ventana, o
 * - su encuentro presencial cae dentro de la ventana.
 */
export function consultationActiveWindowWhere(from: Date, to: Date) {
  return {
    visibility: 'visible' as const,
    OR: [
      {
        startsAt: { lte: to },
        OR: [{ endsAt: null }, { endsAt: { gte: from } }]
      },
      {
        registrationForm: {
          is: {
            OR: [
              { opensAt: { lte: to }, closesAt: { gte: from } },
              { eventAt: { gte: from, lte: to } }
            ]
          }
        }
      },
      {
        regionalMeeting: {
          is: {
            OR: [
              { registrationOpensAt: { lte: to }, registrationClosesAt: { gte: from } },
              { heldAt: { gte: from, lte: to } }
            ]
          }
        }
      }
    ]
  } satisfies ConsultationWhereInput
}

/**
 * Instancias cuya ventana de inscripción presencial está abierta en `now`
 * (formulario propio o inscripción externa de un Encuentro Regional).
 */
export function consultationRegistrationOpenWhere(now: Date) {
  return {
    OR: [
      { registrationForm: { is: { opensAt: { lte: now }, closesAt: { gte: now } } } },
      {
        regionalMeeting: {
          is: {
            registrationUrl: { not: null },
            registrationOpensAt: { lte: now },
            registrationClosesAt: { gte: now }
          }
        }
      }
    ]
  } satisfies ConsultationWhereInput
}

/**
 * Construye el fragmento `where` común a partir de los filtros de query
 * (búsqueda, visibilidad, estado, ventana activa, destacadas, taxonomías).
 * Cada filtro es una cláusula independiente dentro de `AND` para que los `OR`
 * (búsqueda, ventana, varios estados) no se pisen entre sí ni con las reglas
 * de autorización que cada handler compone por separado.
 */
export function buildConsultationFilters(query: ConsultationsQueryInput, now: Date) {
  const clauses: ConsultationWhereInput[] = []

  if (query.visibility) clauses.push({ visibility: query.visibility })
  if (query.state) clauses.push(consultationStateWhere(query.state, now))
  if (query.states) {
    clauses.push({ OR: query.states.map(state => consultationStateWhere(state, now)) })
  }
  if (query.activeFrom && query.activeTo) {
    clauses.push(consultationActiveWindowWhere(query.activeFrom, query.activeTo))
  }
  if (query.featured !== undefined) clauses.push({ featured: query.featured })
  if (query.registrationOpen === true) clauses.push(consultationRegistrationOpenWhere(now))
  if (query.registrationOpen === false) clauses.push({ NOT: consultationRegistrationOpenWhere(now) })
  if (query.sectionSlug) clauses.push({ section: { slug: query.sectionSlug } })
  if (query.sectionIds) clauses.push({ sectionId: { in: query.sectionIds } })
  if (query.regionSlug) clauses.push({ region: { slug: query.regionSlug } })
  if (query.regionIds) clauses.push({ regionId: { in: query.regionIds } })
  if (query.observatoryWorkGroupSlug) {
    clauses.push({ workGroupAssignments: { some: { workGroup: { slug: query.observatoryWorkGroupSlug } } } })
  }
  if (query.observatoryWorkGroupIds) {
    clauses.push({ workGroupAssignments: { some: { workGroupId: { in: query.observatoryWorkGroupIds } } } })
  }
  if (query.categoryIds) {
    clauses.push({ categoryAssignments: { some: { categoryId: { in: query.categoryIds } } } })
  }
  if (query.tagIds) {
    clauses.push({ consultationTags: { some: { tagId: { in: query.tagIds } } } })
  }
  if (query.q) {
    clauses.push({
      OR: [
        { title: { contains: query.q } },
        { summary: { contains: query.q } },
        { body: { contains: query.q } }
      ]
    })
  }

  return { AND: clauses } satisfies ConsultationWhereInput
}
