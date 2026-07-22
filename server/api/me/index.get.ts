export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'self' })

  const memberships = await prisma.consultationMembership.findMany({
    where: { userId: ctx.user!.id },
    select: { consultationId: true, role: true, assignedAt: true }
  })

  const avatarUrl = await resolveUserAvatarUrl(ctx.user!)
  const dto = serializeUser(ctx.user!, 'self', avatarUrl)

  return {
    ...dto,
    roles: {
      ...dto.roles,
      consultationRoles: memberships.map(m => ({
        consultationId: m.consultationId,
        role: m.role,
        assignedAt: m.assignedAt.toISOString()
      }))
    }
  }
})
