import { AccreditationEntryDetailsSchema } from '#shared/schemas/accreditations'
import { parsePositiveIntParam } from '~~/server/utils/http/params'

// Completar (opcional y público) los datos de un ingreso ya registrado, justo
// después de acreditarse. Solo sobre acreditaciones activas.
export default defineEventHandler(async (event) => {
  const publicId = getRouterParam(event, 'publicId')?.toLowerCase()
  const entryId = parsePositiveIntParam(event, 'id', 'ingreso')
  const body = await parseBody(event, AccreditationEntryDetailsSchema)

  if (!publicId) {
    throw createError({ statusCode: 404, message: 'Acreditación no encontrada' })
  }

  const entry = await prisma.accreditationEntry.findFirst({
    where: { id: entryId, accreditation: { publicId, enabled: true } },
    select: { id: true }
  })

  if (!entry) {
    throw createError({ statusCode: 404, message: 'Ingreso no encontrado' })
  }

  await prisma.accreditationEntry.update({
    where: { id: entry.id },
    data: { firstName: body.firstName, lastName: body.lastName, email: body.email }
  })

  return { success: true }
})
