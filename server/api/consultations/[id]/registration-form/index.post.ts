import { buildConsultationRegistrationFormSchema } from '#shared/schemas/consultation-registrations'
import { serializeConsultationRegistrationForm } from '~~/server/utils/serializers/consultationRegistrationForm'
import { serializeAccreditation } from '~~/server/utils/serializers/accreditation'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'
import { syncFormAccreditation, loadFormAccreditation } from '~~/server/utils/consultations/accreditation'

export default defineEventHandler(async (event) => {
  const { consultationId, kind, publicPath } = await resolveRegistrationConsultation(event)
  const body = await parseBody(event, buildConsultationRegistrationFormSchema(kind))
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
      eventMode: body.eventMode,
      admissionPolicy: body.admissionPolicy,
      meetingUrl: body.meetingUrl,
      venueName: body.eventMode === 'virtual' ? null : body.venueName,
      venueAddress: body.eventMode === 'virtual' ? null : body.venueAddress,
      venueCity: body.eventMode === 'virtual' ? null : body.venueCity,
      venueProvince: body.eventMode === 'virtual' ? null : body.venueProvince
    }
  })

  await syncFormAccreditation(form.id, {
    enabled: body.accreditationEnabled,
    opensAt: body.accreditationOpensAt,
    closesAt: body.accreditationClosesAt
  })
  const accreditation = await loadFormAccreditation(form.id)

  setResponseStatus(event, 201)
  return serializeConsultationRegistrationForm(form, 'admin', {
    kind,
    consultationPath: publicPath,
    registrationsCount: 0,
    accreditation: accreditation
      ? serializeAccreditation(accreditation, 'admin', { entriesCount: accreditation._count.entries })
      : null
  })
})
