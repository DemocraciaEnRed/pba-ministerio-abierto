import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  await prisma.consultation.delete({
    where: { id: consultationId }
  })

  setResponseStatus(event, 204)
})
