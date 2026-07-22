import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { assertTopicWindowWithinConsultation } from '~~/server/utils/topics/participation-window'
import { UpdateTopicSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, UpdateTopicSchema)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  // Verify consultation exists
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  // La ventana de participación del tema debe quedar dentro de la de la consulta.
  assertTopicWindowWithinConsultation(
    { participationStartsAt: body.participationStartsAt, participationEndsAt: body.participationEndsAt },
    consultation
  )

  // Check slug uniqueness if changing slug
  if (body.slug !== topic.slug) {
    const slugExists = await prisma.topic.findUnique({
      where: {
        consultationId_slug: {
          consultationId,
          slug: body.slug
        }
      }
    })

    if (slugExists) {
      throw createError({
        statusCode: 422,
        message: 'Validación de formulario',
        data: [{ field: 'slug', message: 'El slug ya existe en esta consulta' }]
      })
    }
  }

  const updated = await prisma.topic.update({
    where: { id: topic.id },
    data: {
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      body: body.body,
      displayOrder: body.displayOrder,
      participationStartsAt: body.participationStartsAt,
      participationEndsAt: body.participationEndsAt,
      publishResultsWhenParticipationEnds: body.publishResultsWhenParticipationEnds
    },
    include: { topicTags: { select: { tagId: true } } }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTopic(updated as any, 'admin')
})
