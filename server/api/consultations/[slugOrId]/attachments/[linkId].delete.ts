import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { deleteAttachment } from '~~/server/utils/assets/attachments'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const linkId = parsePositiveIntParam(event, 'linkId', 'archivo')

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  await deleteAttachment(linkId, { ownerType: 'consultation', ownerId: consultationId })

  setResponseStatus(event, 204)
})
