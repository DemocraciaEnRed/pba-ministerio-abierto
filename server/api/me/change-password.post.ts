import { ChangePasswordSchema } from '#shared/schemas/auth'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'change-password', { type: 'self' })

  const body = await parseBody(event, ChangePasswordSchema)

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user!.id } })

  if (!dbUser.passwordHash || !(await verifyPassword(dbUser.passwordHash, body.currentPassword))) {
    throw createError({ statusCode: 422, message: 'Current password is incorrect' })
  }

  const newHash = await hashPassword(body.newPassword)
  await prisma.user.update({
    where: { id: ctx.user!.id },
    data: { passwordHash: newHash }
  })

  return { ok: true }
})
