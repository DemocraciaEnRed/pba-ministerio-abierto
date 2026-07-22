import { VerifyEmailSchema } from '#shared/schemas/auth'
import { consumeVerificationToken } from '~~/server/utils/auth/tokens'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, VerifyEmailSchema)

  const result = await consumeVerificationToken(body.token, 'email_verification')
  if (!result) {
    throw createError({ statusCode: 400, message: 'Token inválido o expirado' })
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerifiedAt: new Date() }
  })

  return { ok: true, message: 'Tu correo fue verificado correctamente.' }
})
