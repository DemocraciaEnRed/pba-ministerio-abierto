import { LoginSchema } from '#shared/schemas/auth'
import { userWithRolesInclude, toResolvedUser } from '~~/server/utils/auth/context'
import { assertUserActive } from '~~/server/utils/auth/assert-can'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, LoginSchema)

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: userWithRolesInclude
  })

  // Respuesta genérica para no filtrar existencia del email
  const invalidCredentials = () =>
    createError({ statusCode: 401, message: 'Invalid credentials' })

  if (!user || !user.passwordHash) throw invalidCredentials()

  const valid = await verifyPassword(user.passwordHash, body.password)
  if (!valid) throw invalidCredentials()

  assertUserActive(user.status)

  // El correo debe estar verificado para iniciar sesión. Se informa recién aquí
  // (tras validar la contraseña) para no filtrar estado de cuentas a terceros.
  if (!user.emailVerifiedAt) {
    throw createError({
      statusCode: 403,
      message: 'Verificá tu correo electrónico antes de iniciar sesión.',
      data: { code: 'email_not_verified' }
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  await setUserSession(event, { user: { id: user.id } })

  const resolved = toResolvedUser(user)
  const avatarUrl = await resolveUserAvatarUrl(resolved)
  return serializeUser(resolved, 'self', avatarUrl)
})
