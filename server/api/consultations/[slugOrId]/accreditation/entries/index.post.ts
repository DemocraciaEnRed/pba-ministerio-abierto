import { AccreditationEntrySchema } from '#shared/schemas/accreditations'
import { serializeAccreditationEntry } from '~~/server/utils/serializers/accreditation'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'
import { findRegistrationIdByDni } from '~~/server/utils/consultations/accreditation'

// Alta manual de un ingreso desde administración. A diferencia del ingreso
// público, puede registrarse fuera de la ventana configurada.
export default defineEventHandler(async (event) => {
  const body = await parseBody(event, AccreditationEntrySchema)
  const { consultationId } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const accreditation = await prisma.accreditation.findFirst({
    where: { form: { consultationId } },
    select: { id: true, formId: true }
  })

  if (!accreditation) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene acreditación habilitada' })
  }

  const registrationId = await findRegistrationIdByDni(accreditation.formId, body.dni)

  const entry = await prisma.accreditationEntry.create({
    data: {
      accreditationId: accreditation.id,
      registrationId,
      dni: body.dni,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email
    }
  })

  setResponseStatus(event, 201)
  return serializeAccreditationEntry(entry, 'admin')
})
