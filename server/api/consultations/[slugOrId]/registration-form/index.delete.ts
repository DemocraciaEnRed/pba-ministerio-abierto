import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

// Elimina el formulario y, en cascada, todas sus inscripciones.
export default defineEventHandler(async (event) => {
  const { consultationId } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const existing = await prisma.consultationRegistrationForm.findUnique({
    where: { consultationId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene formulario de inscripción' })
  }

  await prisma.consultationRegistrationForm.delete({ where: { consultationId } })

  setResponseStatus(event, 204)
  return null
})
