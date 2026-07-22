import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { toResolvedUser, userWithRolesInclude } from '~~/server/utils/auth/context'
import { serializeUser } from '~~/server/utils/serializers/user'

export default defineEventHandler(async (event) => {
  const userId = parsePositiveIntParam(event, 'id', 'usuario')
  const ctx = await getAuthContext(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithRolesInclude
  })

  // Solo se exponen públicamente las cuentas activas; el resto queda oculto
  // salvo para administradores de plataforma.
  if (!user || (user.status !== 'active' && !ctx.isPlatformAdmin)) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  const resolved = toResolvedUser(user)
  const avatarUrl = await resolveUserAvatarUrl(resolved)

  // Misma URL para todos los roles; el rol decide los campos devueltos.
  return ctx.isPlatformAdmin
    ? serializeUser(resolved, 'admin', avatarUrl)
    : serializeUser(resolved, 'public', avatarUrl)
})
