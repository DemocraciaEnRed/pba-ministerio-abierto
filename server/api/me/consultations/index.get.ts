import { MyConsultationsQuerySchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, MyConsultationsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'self' })

  const userId = ctx.user!.id
  const skip = (query.page - 1) * query.perPage

  const where = { userId }

  const [total, memberships] = await Promise.all([
    prisma.consultationMembership.count({ where }),
    prisma.consultationMembership.findMany({
      where,
      include: {
        consultation: {
          include: {
            section: true,
            categoryAssignments: {
              include: { category: true },
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }]
            },
            consultationTags: {
              include: { tag: true }
            }
          }
        }
      },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: query.perPage
    })
  ])

  return {
    items: memberships.map(membership => ({
      ...serializeConsultation(membership.consultation, 'admin'),
      membership: {
        role: membership.role,
        assignedAt: membership.assignedAt.toISOString()
      }
    })),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
