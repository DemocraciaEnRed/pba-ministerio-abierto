import { UpdateConsultationFormatSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, UpdateConsultationFormatSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

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

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      consultationFormat: body.consultationFormat,
      updatedByUserId: ctx.user!.id
    }
  })

  return serializeConsultation(updated, 'admin')
})
