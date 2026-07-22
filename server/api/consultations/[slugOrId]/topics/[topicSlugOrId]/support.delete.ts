import { loadParticipationContext } from '~~/server/utils/topics/participation-guard'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { topic } = await loadParticipationContext(consultationId, topicId, 'support')

  await prisma.supportParticipation.deleteMany({
    where: { topicId: topic.id, userId }
  })

  setResponseStatus(event, 204)
  return null
})
