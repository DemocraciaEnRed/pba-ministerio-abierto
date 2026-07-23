import { UpdateCoverSchema } from '#shared/schemas/cover'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { updateCoverMetadata } from '~~/server/utils/assets/cover'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const body = await parseBody(event, UpdateCoverSchema)
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  return updateCoverMetadata(
    { ownerType: 'topic', ownerId: topicId },
    body
  )
})
