import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { deleteGalleryImage } from '~~/server/utils/assets/gallery'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const imageId = parsePositiveIntParam(event, 'imageId', 'imagen')

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  await deleteGalleryImage(imageId, { ownerType: 'topic', ownerId: topicId })

  setResponseStatus(event, 204)
})
