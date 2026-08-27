import { ConsultationRegistrationFormSchema } from '#shared/schemas/consultation-registrations'
import { serializeConsultationRegistrationForm } from '~~/server/utils/serializers/consultationRegistrationForm'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, ConsultationRegistrationFormSchema)
  const { consultationId, kind } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const existing = await prisma.consultationRegistrationForm.findUnique({
    where: { consultationId },
    select: { id: true }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Esta consulta ya tiene un formulario de inscripción'
    })
  }

  const form = await prisma.consultationRegistrationForm.create({
    data: {
      consultationId,
      title: body.title,
      body: body.body,
      eventAt: body.eventAt,
      opensAt: body.opensAt,
      closesAt: body.closesAt,
      venueName: body.venueName,
      venueAddress: body.venueAddress,
      venueCity: body.venueCity,
      venueProvince: body.venueProvince
    }
  })

  setResponseStatus(event, 201)
  return serializeConsultationRegistrationForm(form, 'admin', { kind, registrationsCount: 0 })
})
