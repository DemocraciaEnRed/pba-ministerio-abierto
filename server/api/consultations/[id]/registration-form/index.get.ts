import { serializeConsultationRegistrationForm } from '~~/server/utils/serializers/consultationRegistrationForm'
import { serializeAccreditation } from '~~/server/utils/serializers/accreditation'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'
import { ConsultationRegistrationFormQuerySchema } from '#shared/schemas/consultation-registrations'

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, ConsultationRegistrationFormQuerySchema)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { consultationId, kind, publicPath } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)

  const form = await prisma.consultationRegistrationForm.findUnique({
    where: { consultationId },
    include: {
      _count: { select: { registrations: true } },
      accreditation: { include: { _count: { select: { entries: true } } } }
    }
  })

  if (!form) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
  }

  const canManage = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  if (!canManage || query.view === 'public') {
    return serializeConsultationRegistrationForm(form, 'public', { kind, consultationPath: publicPath })
  }

  return serializeConsultationRegistrationForm(form, 'admin', {
    kind,
    consultationPath: publicPath,
    registrationsCount: form._count.registrations,
    accreditation: form.accreditation
      ? serializeAccreditation(form.accreditation, 'admin', { entriesCount: form.accreditation._count.entries })
      : null
  })
})
