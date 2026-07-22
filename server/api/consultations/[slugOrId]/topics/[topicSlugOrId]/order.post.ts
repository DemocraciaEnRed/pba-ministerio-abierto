import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { SetTopicOrderSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicOrderSchema)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  const updated = await prisma.topic.update({
    where: { id: topicId },
    data: { displayOrder: body.displayOrder }
  })

  return updated
})
