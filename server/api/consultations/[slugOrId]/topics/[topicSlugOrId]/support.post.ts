import { loadParticipationContext } from '~~/server/utils/topics/participation-guard'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeSupportParticipation } from '~~/server/utils/serializers/participation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { topic } = await loadParticipationContext(consultationId, topicId, 'support')

  // El apoyo es idempotente: si ya existe, se conserva; si no, se crea.
  const support = await prisma.supportParticipation.upsert({
    where: { topicId_userId: { topicId: topic.id, userId } },
    update: {},
    create: { topicId: topic.id, userId }
  })

  setResponseStatus(event, 201)
  return serializeSupportParticipation(support)
})
