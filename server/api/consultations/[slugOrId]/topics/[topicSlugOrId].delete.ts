import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
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

  // Delete related data
  await prisma.$transaction([
    prisma.supportParticipation.deleteMany({
      where: { topicId }
    }),
    prisma.voteParticipation.deleteMany({
      where: { topicId }
    }),
    prisma.surveyParticipation.deleteMany({
      where: { surveyOption: { topicId }
      }
    }),
    prisma.surveyOption.deleteMany({
      where: { topicId }
    }),
    prisma.topicTag.deleteMany({
      where: { topicId }
    }),
    prisma.topic.delete({
      where: { id: topicId }
    })
  ])

  setResponseStatus(event, 204)
})
