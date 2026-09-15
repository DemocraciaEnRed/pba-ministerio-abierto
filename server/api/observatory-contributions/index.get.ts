import { ObservatoryContributionsQuerySchema } from '#shared/schemas/observatory'
import { serializeObservatoryContribution } from '~~/server/utils/serializers/observatoryContribution'

// Listado paginado de aportes: exclusivo de platform-admin. No existe vista pública.
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, ObservatoryContributionsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const skip = (query.page - 1) * query.perPage

  const [total, contributions] = await Promise.all([
    prisma.observatoryContribution.count(),
    prisma.observatoryContribution.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.perPage,
      include: {
        links: true,
        workGroupAssignments: {
          include: { workGroup: { select: { slug: true, name: true } } },
          orderBy: { workGroup: { displayOrder: 'asc' } }
        },
        attachmentAsset: {
          select: { originalFilename: true, mimeType: true, sizeBytes: true }
        }
      }
    })
  ])

  return {
    items: contributions.map(contribution => serializeObservatoryContribution(contribution, 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
