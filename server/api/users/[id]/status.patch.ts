import { UpdateUserStatusSchema } from '#shared/schemas/users-admin'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { toResolvedUser, userWithRolesInclude } from '~~/server/utils/auth/context'
import { serializeUser } from '~~/server/utils/serializers/user'

export default defineEventHandler(async (event) => {
  const userId = parsePositiveIntParam(event, 'id', 'usuario')
  const body = await parseBody(event, UpdateUserStatusSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: body.status },
    include: userWithRolesInclude
  }).catch((error) => {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
    if (code === 'P2025') {
      throw createError({
        statusCode: 404,
        message: 'Usuario no encontrado'
      })
    }
    throw error
  })

  return serializeUser(toResolvedUser(updated), 'admin')
})
