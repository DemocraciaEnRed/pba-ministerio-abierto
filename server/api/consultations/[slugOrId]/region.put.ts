import { consultationTypeAllowsRegion } from '#shared/data/consultation-types'
import { SetConsultationRegionSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { serializeRegion } from '~~/server/utils/serializers/region'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationRegionSchema)
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

  // Limpiar la región siempre se permite (hay consultas legacy con región incompatible).
  if (body.regionId !== null) {
    if (!consultationTypeAllowsRegion(consultation.section?.slug)) {
      throw createError({
        statusCode: 422,
        message: 'Este tipo de consulta no admite región'
      })
    }

    const region = await prisma.region.findUnique({
      where: { id: body.regionId },
      select: { id: true }
    })

    if (!region) {
      throw createError({
        statusCode: 422,
        message: 'La región no existe'
      })
    }
  }

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: { regionId: body.regionId },
    include: { region: true }
  })

  return {
    region: updated.region ? serializeRegion(updated.region, 'public') : null
  }
})
