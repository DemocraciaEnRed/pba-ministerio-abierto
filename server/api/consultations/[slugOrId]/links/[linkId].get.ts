import { serializeConsultationLink } from '~~/server/utils/serializers/consultationLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { resolveConsultationLink } from '~~/server/utils/consultations/link'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  const link = await resolveConsultationLink(event, consultationId)

  const isAdminView = ctx.isPlatformAdmin
    || await prisma.consultationMembership.findFirst({
      where: {
        userId: ctx.user?.id ?? -1,
        consultationId
      }
    }) !== null

  return isAdminView
    ? serializeConsultationLink(link, 'admin')
    : serializeConsultationLink(link, 'public')
})
