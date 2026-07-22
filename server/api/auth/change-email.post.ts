import { ConfirmEmailChangeSchema } from '#shared/schemas/auth'
import { consumeVerificationToken } from '~~/server/utils/auth/tokens'

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'P2002'
  )
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, ConfirmEmailChangeSchema)

  const result = await consumeVerificationToken(body.token, 'email_change')
  if (!result || !result.newEmail) {
    throw createError({ statusCode: 400, message: 'El enlace no es válido o expiró' })
  }

  try {
    await prisma.user.update({
      where: { id: result.userId },
      data: {
        email: result.newEmail,
        emailVerifiedAt: new Date()
      }
    })
  } catch (error) {
    // Otra cuenta tomó ese email entre la solicitud y la confirmación.
    if (isUniqueConstraintError(error)) {
      throw createError({ statusCode: 409, message: 'Ese correo ya está en uso' })
    }
    throw error
  }

  return { ok: true, message: 'Tu correo electrónico se actualizó correctamente.' }
})
