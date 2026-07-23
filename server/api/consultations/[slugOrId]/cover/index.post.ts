import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { setCoverImage } from '~~/server/utils/assets/cover'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const cover = await setCoverImage(
    event,
    { ownerType: 'consultation', ownerId: consultationId },
    ctx.user!.id
  )

  setResponseStatus(event, 201)
  return cover
})
