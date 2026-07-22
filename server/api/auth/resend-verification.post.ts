import { ResendVerificationSchema } from '#shared/schemas/auth'
import { createVerificationToken } from '~~/server/utils/auth/tokens'
import { sendVerificationEmail } from '~~/server/utils/mailer/messages'

// Respuesta genérica para no filtrar existencia ni estado de verificación.
const genericResponse = {
  ok: true,
  message: 'Si el correo es válido y está pendiente de verificación, te enviamos un nuevo email.'
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, ResendVerificationSchema)

  const user = await prisma.user.findUnique({ where: { email: body.email } })

  if (user && !user.emailVerifiedAt) {
    const { token } = await createVerificationToken(user.id, 'email_verification')
    try {
      await sendVerificationEmail(user.email, token, user.displayName)
    } catch (error) {
      console.error('[resend-verification] no se pudo enviar el email:', error)
    }
  }

  setResponseStatus(event, 202)
  return genericResponse
})
