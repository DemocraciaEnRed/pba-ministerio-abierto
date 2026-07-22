import { SetConsultationSectionSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { serializeSection } from '~~/server/utils/serializers/section'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationSectionSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  if (body.sectionId !== null) {
    const section = await prisma.section.findFirst({
      where: { id: body.sectionId, isActive: true },
      select: { id: true }
    })

    if (!section) {
      throw createError({
        statusCode: 422,
        message: 'La sección no existe o está inactiva'
      })
    }
  }

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: { sectionId: body.sectionId },
    include: { section: true }
  })

  return {
    section: updated.section ? serializeSection(updated.section, 'public') : null
  }
})
