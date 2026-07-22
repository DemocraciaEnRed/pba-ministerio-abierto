import { UpdateConsultationSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { clampTopicWindowToConsultation } from '~~/server/utils/topics/participation-window'

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
        resultsVisibility: body.resultsVisibility,
        updatedByUserId: ctx.user!.id
      }
    })

    // Si se pidió, recortamos las fechas de los temas que quedaron fuera de la
    // nueva ventana de la consulta (los que no definen cierre propio la heredan).
    if (body.adjustTopics) {
      const topics = await prisma.topic.findMany({
        where: { consultationId },
        select: { id: true, participationStartsAt: true, participationEndsAt: true }
      })

      const window = { startsAt: updated.startsAt, endsAt: updated.endsAt }
      const updates = topics
        .map((topic) => {
          const clamped = clampTopicWindowToConsultation(topic, window)
          return clamped ? { id: topic.id, ...clamped } : null
        })
        .filter((change): change is NonNullable<typeof change> => change !== null)

      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map(change => prisma.topic.update({
            where: { id: change.id },
            data: {
              // El inicio es NOT NULL: solo lo tocamos si el clamp lo definió.
              ...(change.participationStartsAt ? { participationStartsAt: change.participationStartsAt } : {}),
              participationEndsAt: change.participationEndsAt
            }
          }))
        )
      }
    }

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
