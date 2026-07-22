import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'consultation', id: consultationId })

  // Usuarios ya designados en la consulta (cualquier rol) para excluirlos del picker.
  const existingMembers = await prisma.consultationMembership.findMany({
    where: { consultationId },
    select: { userId: true }
  })
  const existingUserIds = existingMembers.map(member => member.userId)

  // Elegibles: ciudadanos de confianza (`collaborator`) o `platform_admin` (que lo implica).
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
      ...(existingUserIds.length ? { id: { notIn: existingUserIds } } : {}),
      platformRoleAssignments: {
        some: { role: { in: ['collaborator', 'platform_admin'] } }
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true
    },
    orderBy: [{ displayName: 'asc' }, { id: 'asc' }]
  })

  return users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName
  }))
})
