import { RegionalMeetingSubmissionsQuerySchema } from '#shared/schemas/regional-meetings'
import { serializeRegionalMeetingSubmission } from '~~/server/utils/serializers/regionalMeetingSubmission'

// Listado paginado de aportes: exclusivo de platform-admin. No existe vista pública.
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, RegionalMeetingSubmissionsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const skip = (query.page - 1) * query.perPage

  const [total, submissions] = await Promise.all([
    prisma.regionalMeetingSubmission.count(),
    prisma.regionalMeetingSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.perPage,
      include: {
        links: true,
        attachmentAsset: {
          select: { originalFilename: true, mimeType: true, sizeBytes: true }
        }
      }
    })
  ])

  return {
    items: submissions.map(submission => serializeRegionalMeetingSubmission(submission, 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
