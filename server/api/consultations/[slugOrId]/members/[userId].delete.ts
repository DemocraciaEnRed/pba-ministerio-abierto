import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const userId = parsePositiveIntParam(event, 'userId', 'usuario')
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

  // Nadie puede quitarse a sí mismo de la consulta.
  if (ctx.user!.id === userId) {
    throw createError({
      statusCode: 409,
      message: 'No podés quitarte a vos mismo de la consulta.'
    })
  }

  // No se puede dejar la consulta sin ningún administrador designado.
  const admins = await prisma.consultationMembership.findMany({
    where: { consultationId, role: 'consultation_admin' },
    select: { userId: true }
  })
  const targetIsAdmin = admins.some(admin => admin.userId === userId)

  if (targetIsAdmin && admins.length === 1) {
    throw createError({
      statusCode: 409,
      message: 'No podés quitar al último administrador de la consulta.'
    })
  }

  await prisma.consultationMembership.deleteMany({
    where: {
      consultationId,
      userId
    }
  })

  setResponseStatus(event, 204)
})
