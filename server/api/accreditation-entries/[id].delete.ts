import { parsePositiveIntParam } from '~~/server/utils/http/params'

// Baja de un ingreso de acreditación por parte de quien administra la consulta.
export default defineEventHandler(async (event) => {
  const entryId = parsePositiveIntParam(event, 'id', 'ingreso')
  const ctx = await getAuthContext(event)

  const entry = await prisma.accreditationEntry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      accreditation: { select: { form: { select: { consultationId: true } } } }
    }
  })

  if (!entry) {
    throw createError({ statusCode: 404, message: 'Ingreso no encontrado' })
  }

  await assertCan(ctx, 'manage', { type: 'consultation', id: entry.accreditation.form.consultationId })

  await prisma.accreditationEntry.delete({ where: { id: entry.id } })

  setResponseStatus(event, 204)
  return null
})
