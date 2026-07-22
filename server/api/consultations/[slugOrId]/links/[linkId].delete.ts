import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveConsultationLink } from '~~/server/utils/consultations/link'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  const link = await resolveConsultationLink(event, consultationId)

  await prisma.consultationRelatedLink.delete({
    where: { id: link.id }
  })

  setResponseStatus(event, 204)
})
