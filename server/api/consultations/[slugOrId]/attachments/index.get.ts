import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { listAttachments } from '~~/server/utils/assets/attachments'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

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

  const isAdminView = ctx.isPlatformAdmin
    || await prisma.consultationMembership.findFirst({
      where: {
        userId: ctx.user?.id ?? -1,
        consultationId
      }
    }) !== null

  return listAttachments({ ownerType: 'consultation', ownerId: consultationId }, { adminView: isAdminView })
})
