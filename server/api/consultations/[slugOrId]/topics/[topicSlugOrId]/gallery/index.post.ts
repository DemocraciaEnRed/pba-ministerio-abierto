import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { createGalleryImage } from '~~/server/utils/assets/gallery'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const image = await createGalleryImage(
    event,
    { ownerType: 'topic', ownerId: topicId },
    ctx.user!.id
  )

  setResponseStatus(event, 201)
  return image
})
