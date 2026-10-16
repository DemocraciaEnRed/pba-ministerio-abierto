import { ConsultationRegistrationsQuerySchema } from '#shared/schemas/consultation-registrations'
import { serializeConsultationRegistration } from '~~/server/utils/serializers/consultationRegistration'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

// Listado paginado de inscripciones: solo para quien administra la consulta.
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, ConsultationRegistrationsQuerySchema)
  const { consultationId } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const form = await prisma.consultationRegistrationForm.findUnique({
    where: { consultationId },
    select: { id: true }
  })

  if (!form) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
  }

  const skip = (query.page - 1) * query.perPage

  const [total, registrations] = await Promise.all([
    prisma.consultationRegistration.count({ where: { formId: form.id } }),
    prisma.consultationRegistration.findMany({
      where: { formId: form.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.perPage,
      include: {
        questions: true,
        proofAsset: { select: { originalFilename: true, mimeType: true, sizeBytes: true } }
      }
    })
  ])

  return {
    items: registrations.map(registration => serializeConsultationRegistration(registration, 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
