import { loadParticipationContext } from '~~/server/utils/topics/participation-guard'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeVoteParticipation } from '~~/server/utils/serializers/participation'
import { VoteParticipationSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, VoteParticipationSchema)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { topic } = await loadParticipationContext(consultationId, topicId, 'vote')

  // La abstención puede estar deshabilitada (voto binario a favor/en contra).
  if (body.voteValue === 'abstain') {
    const config = await prisma.topic.findUnique({
      where: { id: topic.id },
      select: { voteAllowAbstain: true }
    })
    if (config && !config.voteAllowAbstain) {
      throw createError({
        statusCode: 422,
        message: 'Validation error',
        data: [{ field: 'voteValue', message: 'La abstención no está habilitada para este tema' }]
      })
    }
  }

  // Un usuario tiene un único voto por tema; puede cambiar su valor durante la ventana.
  const vote = await prisma.voteParticipation.upsert({
    where: { topicId_userId: { topicId: topic.id, userId } },
    update: { voteValue: body.voteValue },
    create: { topicId: topic.id, userId, voteValue: body.voteValue }
  })

  setResponseStatus(event, 201)
  return serializeVoteParticipation(vote)
})
