import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { toResolvedUser, userWithRolesInclude } from '~~/server/utils/auth/context'
import { serializeUser } from '~~/server/utils/serializers/user'

export default defineEventHandler(async (event) => {
  const userId = parsePositiveIntParam(event, 'id', 'usuario')
  const role = getRouterParam(event, 'role')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  if (role !== 'platform_admin' && role !== 'collaborator') {
    throw createError({
      statusCode: 400,
      message: 'El rol de plataforma es inválido'
    })
  }

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

  await prisma.platformRoleAssignment.deleteMany({
    where: {
      userId,
      role
    }
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
