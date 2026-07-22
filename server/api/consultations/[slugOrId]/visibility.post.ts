import { SetConsultationVisibilitySchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationVisibilitySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const existing = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: {
      id: true,
      visibility: true,
      startsAt: true,
      publishedAt: true
    }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  // Al hacer visible una consulta, la fecha de inicio es obligatoria: el estado
  // temporal (programada/abierta/cerrada) se deriva de ella.
  if (body.visibility === 'visible' && existing.startsAt === null) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'startsAt', message: 'Definí la fecha de inicio antes de publicar la consulta' }]
    })
  }

  const shouldSetPublishedAt = body.visibility === 'visible' && existing.publishedAt === null
  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: {
      visibility: body.visibility,
      publishedAt: shouldSetPublishedAt ? new Date() : existing.publishedAt,
      updatedByUserId: ctx.user!.id
    }
  })

  return serializeConsultation(updated, 'admin')
})
