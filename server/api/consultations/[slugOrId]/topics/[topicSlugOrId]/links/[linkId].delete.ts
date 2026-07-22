import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { resolveTopicLink } from '~~/server/utils/topics/link'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const link = await resolveTopicLink(event, topicId)

  await prisma.topicRelatedLink.delete({ where: { id: link.id } })

  setResponseStatus(event, 204)
})
