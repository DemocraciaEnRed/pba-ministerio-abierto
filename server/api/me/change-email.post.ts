import { RequestEmailChangeSchema } from '#shared/schemas/auth'
import { createVerificationToken } from '~~/server/utils/auth/tokens'
import { sendEmailChangeVerification } from '~~/server/utils/mailer/messages'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'change-email', { type: 'self' })

  const body = await parseBody(event, RequestEmailChangeSchema)

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user!.id } })

  if (!dbUser.passwordHash || !(await verifyPassword(dbUser.passwordHash, body.currentPassword))) {
    throw createError({ statusCode: 422, message: 'La contraseña actual es incorrecta' })
  }

  if (body.newEmail === dbUser.email) {
    throw createError({ statusCode: 422, message: 'El nuevo correo es igual al actual' })
  }

  const taken = await prisma.user.findUnique({ where: { email: body.newEmail }, select: { id: true } })
  if (taken) {
    throw createError({ statusCode: 422, message: 'Ese correo ya está en uso' })
  }

  const { token } = await createVerificationToken(dbUser.id, 'email_change', { newEmail: body.newEmail })

  try {
    await sendEmailChangeVerification(body.newEmail, token, dbUser.displayName)
  } catch (error) {
    console.error('[change-email] no se pudo enviar el email de confirmación:', error)
  }

  return {
    ok: true,
    message: 'Te enviamos un correo al nuevo email para confirmar el cambio.'
  }
})
