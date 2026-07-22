import { AssignConsultationMemberSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, AssignConsultationMemberSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    select: {
      id: true,
      platformRoleAssignments: {
        select: { role: true }
      }
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  // Solo los ciudadanos de confianza (rol `collaborator`, o `platform_admin` que
  // lo implica) son elegibles para ser designados administradores de una consulta.
  const isEligible = user.platformRoleAssignments.some(
    assignment => assignment.role === 'collaborator' || assignment.role === 'platform_admin'
  )

  if (!isEligible) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [
        {
          field: 'userId',
          message: 'El usuario no es elegible como administrador de la consulta.'
        }
      ]
    })
  }

  await prisma.consultationMembership.upsert({
    where: {
      consultationId_userId_role: {
        consultationId,
        userId: body.userId,
        role: body.role
      }
    },
    create: {
      consultationId,
      userId: body.userId,
      role: body.role,
      assignedByUserId: ctx.user!.id
    },
    update: {}
  })

  const membership = await prisma.consultationMembership.findFirst({
    where: {
      consultationId,
      userId: body.userId,
      role: body.role
    },
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
    }
  })

  if (!membership) {
    throw createError({
      statusCode: 404,
      message: 'No se pudo resolver la membresía asignada'
    })
  }

  return {
    id: membership.id,
    consultationId: membership.consultationId,
    userId: membership.userId,
    role: membership.role,
    assignedAt: membership.assignedAt.toISOString(),
    assignedBy: membership.assignedByUser
      ? {
          id: membership.assignedByUser.id,
          displayName: membership.assignedByUser.displayName,
          email: membership.assignedByUser.email
        }
      : null,
    user: {
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      displayName: membership.user.displayName,
      status: membership.user.status,
      roles: {
        isPlatformAdmin: membership.user.platformRoleAssignments.some(assignment => assignment.role === 'platform_admin')
      }
    }
  }
})
