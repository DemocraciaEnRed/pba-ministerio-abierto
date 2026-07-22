import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, title: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const members = await prisma.consultationMembership.findMany({
    where: { consultationId },
    include: {
      user: {
        include: {
          platformRoleAssignments: true
        }
      },
      assignedByUser: {
        select: {
          id: true,
          displayName: true,
          email: true
        }
      }
    },
    orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }]
  })

  return {
    consultation: {
      id: consultation.id,
      title: consultation.title
    },
    items: members.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      assignedAt: member.assignedAt.toISOString(),
      assignedBy: member.assignedByUser
        ? {
            id: member.assignedByUser.id,
            displayName: member.assignedByUser.displayName,
            email: member.assignedByUser.email
          }
        : null,
      user: {
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        displayName: member.user.displayName,
        status: member.user.status,
        roles: {
          isPlatformAdmin: member.user.platformRoleAssignments.some(assignment => assignment.role === 'platform_admin')
        }
      }
    }))
  }
})
