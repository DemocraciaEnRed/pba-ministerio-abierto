import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { createAttachment } from '~~/server/utils/assets/attachments'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const attachment = await createAttachment(
    event,
    { ownerType: 'consultation', ownerId: consultationId },
    ctx.user!.id
  )

  setResponseStatus(event, 201)
  return attachment
})
