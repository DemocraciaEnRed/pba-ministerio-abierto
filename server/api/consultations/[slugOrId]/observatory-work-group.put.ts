import { consultationTypeAllowsWorkGroup } from '#shared/data/consultation-types'
import { SetConsultationWorkGroupSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { serializeObservatoryWorkGroup } from '~~/server/utils/serializers/observatoryWorkGroup'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationWorkGroupSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, section: { select: { slug: true } } }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  // Limpiar el grupo siempre se permite, incluso si la consulta cambió a un tipo que no lo admite.
  if (body.observatoryWorkGroupId !== null) {
    if (!consultationTypeAllowsWorkGroup(consultation.section?.slug)) {
      throw createError({
        statusCode: 422,
        message: 'Este tipo de consulta no admite grupo de trabajo'
      })
    }

    const group = await prisma.observatoryWorkGroup.findUnique({
      where: { id: body.observatoryWorkGroupId },
      select: { id: true }
    })

    if (!group) {
      throw createError({
        statusCode: 422,
        message: 'El grupo de trabajo no existe'
      })
    }
  }

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: { observatoryWorkGroupId: body.observatoryWorkGroupId },
    include: { observatoryWorkGroup: true }
  })

  return {
    observatoryWorkGroup: updated.observatoryWorkGroup
      ? serializeObservatoryWorkGroup(updated.observatoryWorkGroup, 'public')
      : null
  }
})
