import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { deleteCoverImage } from '~~/server/utils/assets/cover'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  await deleteCoverImage({ ownerType: 'consultation', ownerId: consultationId })

  setResponseStatus(event, 204)
})
