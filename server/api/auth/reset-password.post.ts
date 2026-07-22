import { ResetPasswordSchema } from '#shared/schemas/auth'
import { consumeVerificationToken } from '~~/server/utils/auth/tokens'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, ResetPasswordSchema)

  const result = await consumeVerificationToken(body.token, 'password_reset')
  if (!result) {
    throw createError({ statusCode: 400, message: 'Token inválido o expirado' })
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { emailVerifiedAt: true }
  })
  if (!user) {
    throw createError({ statusCode: 400, message: 'Token inválido o expirado' })
  }

  const passwordHash = await hashPassword(body.newPassword)

  await prisma.user.update({
    where: { id: result.userId },
    data: {
      passwordHash,
      // Restablecer vía token enviado por email también prueba la titularidad
      // del correo, así que lo damos por verificado si no lo estaba.
      ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() })
    }
  })

  return { ok: true, message: 'Tu contraseña fue actualizada. Ya podés iniciar sesión.' }
})
