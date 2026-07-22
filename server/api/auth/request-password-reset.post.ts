import { RequestPasswordResetSchema } from '#shared/schemas/auth'
import { createVerificationToken } from '~~/server/utils/auth/tokens'
import { sendPasswordResetEmail } from '~~/server/utils/mailer/messages'

// Respuesta genérica para no filtrar la existencia de la cuenta.
const genericResponse = {
  ok: true,
  message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, RequestPasswordResetSchema)

  const user = await prisma.user.findUnique({ where: { email: body.email } })

  // Solo cuentas activas con contraseña pueden restablecerla.
  if (user && user.passwordHash && user.status === 'active') {
    const { token } = await createVerificationToken(user.id, 'password_reset')
    try {
      await sendPasswordResetEmail(user.email, token, user.displayName)
    } catch (error) {
      console.error('[request-password-reset] no se pudo enviar el email:', error)
    }
  }

  setResponseStatus(event, 202)
  return genericResponse
})
