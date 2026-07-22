import { serializeTopicLink } from '~~/server/utils/serializers/topicLink'
import { UpdateTopicLinkSchema } from '#shared/schemas/topicLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { resolveTopicLink } from '~~/server/utils/topics/link'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, UpdateTopicLinkSchema)

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const link = await resolveTopicLink(event, topicId)

  const updated = await prisma.topicRelatedLink.update({
    where: { id: link.id },
    data: {
      label: body.label,
      url: body.url,
      displayOrder: body.displayOrder
    }
  })

  return serializeTopicLink(updated, 'admin')
})
