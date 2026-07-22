import { AssignPlatformRoleSchema } from '#shared/schemas/users-admin'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { toResolvedUser, userWithRolesInclude } from '~~/server/utils/auth/context'
import { serializeUser } from '~~/server/utils/serializers/user'

export default defineEventHandler(async (event) => {
  const userId = parsePositiveIntParam(event, 'id', 'usuario')
  const body = await parseBody(event, AssignPlatformRoleSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!userExists) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  await prisma.platformRoleAssignment.upsert({
    where: {
      userId_role: {
        userId,
        role: body.role
      }
    },
    create: {
      userId,
      role: body.role,
      assignedByUserId: ctx.user!.id
    },
    update: {}
  })

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithRolesInclude
  })

  if (!updated) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  return serializeUser(toResolvedUser(updated), 'admin')
})
