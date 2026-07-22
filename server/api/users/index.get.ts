import { UsersQuerySchema } from '#shared/schemas/users-admin'
import { toResolvedUser, userWithRolesInclude } from '~~/server/utils/auth/context'
import { serializeUser } from '~~/server/utils/serializers/user'

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, UsersQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const skip = (query.page - 1) * query.perPage

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.role
      ? {
          platformRoleAssignments: {
            some: { role: query.role }
          }
        }
      : {}),
    ...(query.q
      ? {
          OR: [
            { email: { contains: query.q } },
            { displayName: { contains: query.q } },
            { firstName: { contains: query.q } },
            { lastName: { contains: query.q } }
          ]
        }
      : {})
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: userWithRolesInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: query.perPage
    })
  ])

  return {
    items: users.map(user => serializeUser(toResolvedUser(user), 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
