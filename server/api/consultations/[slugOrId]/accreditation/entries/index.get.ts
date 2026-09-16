import { AccreditationEntriesQuerySchema } from '#shared/schemas/accreditations'
import { serializeAccreditationEntry } from '~~/server/utils/serializers/accreditation'
import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

// Listado paginado de ingresos de acreditación: solo para quien administra la consulta.
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, AccreditationEntriesQuerySchema)
  const { consultationId } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const accreditation = await prisma.accreditation.findFirst({
    where: { form: { consultationId } },
    select: { id: true }
  })

  if (!accreditation) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene acreditación habilitada' })
  }

  const skip = (query.page - 1) * query.perPage

  const [total, entries] = await Promise.all([
    prisma.accreditationEntry.count({ where: { accreditationId: accreditation.id } }),
    prisma.accreditationEntry.findMany({
      where: { accreditationId: accreditation.id },
      orderBy: { accreditedAt: 'desc' },
      skip,
      take: query.perPage
    })
  ])

  return {
    items: entries.map(entry => serializeAccreditationEntry(entry, 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
