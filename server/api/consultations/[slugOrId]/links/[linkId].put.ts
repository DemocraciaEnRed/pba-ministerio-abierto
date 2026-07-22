import { serializeConsultationLink } from '~~/server/utils/serializers/consultationLink'
import { UpdateConsultationLinkSchema } from '#shared/schemas/consultationLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveConsultationLink } from '~~/server/utils/consultations/link'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, UpdateConsultationLinkSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  const link = await resolveConsultationLink(event, consultationId)

  const updated = await prisma.consultationRelatedLink.update({
    where: { id: link.id },
    data: {
      label: body.label,
      url: body.url,
      displayOrder: body.displayOrder
    }
  })

  return serializeConsultationLink(updated, 'admin')
})
