import { AccreditationEntrySchema } from '#shared/schemas/accreditations'
import { resolveAccreditationState } from '~~/server/utils/serializers/accreditation'
import { findRegistrationIdByDni } from '~~/server/utils/consultations/accreditation'

// Ingreso público de acreditación (sin login): registra la presencia por DNI.
// Acepta el DNI tal como se ingresa y admite repetidos; si coincide con una
// inscripción del mismo formulario, guarda el vínculo sin modificar la inscripción.
export default defineEventHandler(async (event) => {
  const publicId = getRouterParam(event, 'publicId')?.toLowerCase()
  if (!publicId) {
    throw createError({ statusCode: 404, message: 'Acreditación no encontrada' })
  }

  const body = await parseBody(event, AccreditationEntrySchema)

  const accreditation = await prisma.accreditation.findUnique({
    where: { publicId },
    select: { id: true, formId: true, enabled: true, opensAt: true, closesAt: true }
  })

  if (!accreditation || !accreditation.enabled) {
    throw createError({ statusCode: 404, message: 'Acreditación no encontrada' })
  }

  const state = resolveAccreditationState(accreditation)
  if (state !== 'open') {
    throw createError({
      statusCode: 422,
      message: state === 'scheduled'
        ? 'Las acreditaciones todavía no están abiertas'
        : 'Las acreditaciones ya están cerradas'
    })
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
  return { id: entry.id }
})
