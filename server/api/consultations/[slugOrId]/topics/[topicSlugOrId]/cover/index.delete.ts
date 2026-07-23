import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { deleteCoverImage } from '~~/server/utils/assets/cover'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  await deleteCoverImage({ ownerType: 'topic', ownerId: topicId })

  setResponseStatus(event, 204)
})
