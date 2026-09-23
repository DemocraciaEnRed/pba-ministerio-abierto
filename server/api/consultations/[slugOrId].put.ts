import { UpdateConsultationSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, UpdateConsultationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

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

  try {
    const updated = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        slug: body.slug,
        title: body.title,
        summary: body.summary,
        body: body.body,
        consultationFormat: body.consultationFormat,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        closedMessage: body.closedMessage,
        commentsEnabled: body.commentsEnabled,
        commentsGuidance: body.commentsGuidance,
        resultsVisibility: body.resultsVisibility,
        updatedByUserId: ctx.user!.id
      }
    })

    return serializeConsultation(updated, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una consulta con ese slug'
      })
    }

    throw error
  }
})
