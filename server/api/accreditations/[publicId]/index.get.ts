import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'
import { serializeAccreditation } from '~~/server/utils/serializers/accreditation'

// Resolución pública de una acreditación por su identificador de QR. Solo expone
// una acreditación habilitada; las históricas responden como no encontradas.
export default defineEventHandler(async (event) => {
  const publicId = getRouterParam(event, 'publicId')?.toLowerCase()
  if (!publicId) {
    throw createError({ statusCode: 404, message: 'Acreditación no encontrada' })
  }

  const accreditation = await prisma.accreditation.findUnique({
    where: { publicId },
    include: {
      form: {
        select: {
          title: true,
          eventAt: true,
          venueName: true,
          venueCity: true,
          venueProvince: true,
          consultation: { select: { section: { select: { slug: true } } } }
        }
      }
    }
  })

  if (!accreditation || !accreditation.enabled) {
    throw createError({ statusCode: 404, message: 'Acreditación no encontrada' })
  }

  const kind = consultationTypeRegistrationKind(accreditation.form.consultation.section?.slug) ?? 'consultation'

  return serializeAccreditation(accreditation, 'public', {
    kind,
    formTitle: accreditation.form.title,
    eventAt: accreditation.form.eventAt,
    venueName: accreditation.form.venueName,
    venueCity: accreditation.form.venueCity,
    venueProvince: accreditation.form.venueProvince
  })
})
