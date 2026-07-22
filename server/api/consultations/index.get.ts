import { ConsultationsQuerySchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { buildConsultationFilters } from '~~/server/utils/consultation-query'
import { getCoverImagesByOwner } from '~~/server/utils/assets/cover'

function isPubliclyVisibleConsultation(consultation: { visibility: string }): boolean {
  return consultation.visibility !== 'hidden'
}

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, ConsultationsQuerySchema)
  const ctx = await getAuthContext(event)

  const now = new Date()
  const skip = (query.page - 1) * query.perPage
  const whereByFilters = buildConsultationFilters(query, now)

  const userId = ctx.user?.id ?? null

  const where = ctx.isPlatformAdmin
    ? {
        ...whereByFilters
      }
    : userId
      ? {
          ...whereByFilters,
          OR: [
            {
              visibility: { not: 'hidden' as const }
            },
            {
              memberships: {
                some: { userId }
              }
            }
          ]
        }
      : {
          ...whereByFilters,
          visibility: { not: 'hidden' as const }
        }

  const consultations = await prisma.consultation.findMany({
    where,
    include: {
      section: true,
      categoryAssignments: {
        include: { category: true },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }]
      },
      consultationTags: {
        include: { tag: true }
      },
      // Cantidad de temas visibles (no ocultos) para la métrica "N temas" de la card.
      _count: {
        select: {
          topics: { where: { visibility: { not: 'hidden' as const } } }
        }
      },
      ...(userId
        ? {
            memberships: {
              where: { userId },
              select: { id: true }
            }
          }
        : {})
    },
    orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
    skip,
    take: query.perPage
  })

  const total = await prisma.consultation.count({ where })

  // Decide la vista por consulta y agrupa los ids para resolver las portadas por
  // lote (una consulta por vista), evitando el N+1 por card.
  const rows = consultations
    .map((consultation) => {
      const isAdminView = ctx.isPlatformAdmin
        || ('memberships' in consultation && Array.isArray(consultation.memberships) && consultation.memberships.length > 0)

      if (!isAdminView && !isPubliclyVisibleConsultation(consultation)) {
        return null
      }

      return { consultation, isAdminView }
    })
    .filter((row): row is { consultation: typeof consultations[number], isAdminView: boolean } => row !== null)

  const adminIds = rows.filter(row => row.isAdminView).map(row => row.consultation.id)
  const publicIds = rows.filter(row => !row.isAdminView).map(row => row.consultation.id)

  const [adminCovers, publicCovers] = await Promise.all([
    getCoverImagesByOwner('consultation', adminIds, { adminView: true }),
    getCoverImagesByOwner('consultation', publicIds, { adminView: false })
  ])

  return {
    items: rows.map(({ consultation, isAdminView }) => {
      const cover = (isAdminView ? adminCovers : publicCovers).get(consultation.id)
      const entity = {
        ...consultation,
        coverUrl: cover?.url ?? null,
        coverAltText: cover?.altText ?? null,
        topicsCount: consultation._count.topics
      }

      return isAdminView
        ? serializeConsultation(entity, 'admin')
        : serializeConsultation(entity, 'public')
    }),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
