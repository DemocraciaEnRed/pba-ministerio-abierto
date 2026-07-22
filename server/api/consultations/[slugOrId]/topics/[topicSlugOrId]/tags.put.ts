import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { SetTopicTagsSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicTagsSchema)
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

  // Verify all tags exist
  const tags = await prisma.tag.findMany({
    where: { id: { in: body.tagIds } }
  })

  if (tags.length !== body.tagIds.length) {
    throw createError({
      statusCode: 422,
      message: 'Validación de formulario',
      data: [{ field: 'tagIds', message: 'Una o más etiquetas no existen' }]
    })
  }

  // Remove existing tags and add new ones
  await prisma.topicTag.deleteMany({
    where: { topicId }
  })

  const tagAssignments = await prisma.topicTag.createMany({
    data: body.tagIds.map(tagId => ({ topicId, tagId }))
  })

  return { success: true, assignedCount: tagAssignments.count }
})
