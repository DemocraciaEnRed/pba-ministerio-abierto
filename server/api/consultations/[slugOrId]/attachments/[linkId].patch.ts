import { UpdateAttachmentSchema } from '#shared/schemas/attachment'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { updateAttachment } from '~~/server/utils/assets/attachments'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const linkId = parsePositiveIntParam(event, 'linkId', 'archivo')
  const body = await parseBody(event, UpdateAttachmentSchema)

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  return updateAttachment(linkId, { ownerType: 'consultation', ownerId: consultationId }, body)
})
