import { resolveRegistrationConsultation } from '~~/server/utils/consultations/registration-form'

// Exportación CSV de los ingresos de acreditación: solo para quien administra la
// consulta. Se genera a mano (sin dependencias) con comillas escapadas y BOM
// UTF-8 para que Excel respete los acentos. Devuelve TODOS los ingresos.

/** Escapa un valor para CSV: comillas dobles, con las internas duplicadas. */
function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const CSV_HEADERS = [
  'ID',
  'DNI',
  'Nombre',
  'Apellido',
  'Email',
  'Vinculado a inscripción',
  'Fecha de acreditación'
]

export default defineEventHandler(async (event) => {
  const { consultationId, slug } = await resolveRegistrationConsultation(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const accreditation = await prisma.accreditation.findFirst({
    where: { form: { consultationId } },
    select: { id: true }
  })

  if (!accreditation) {
    throw createError({ statusCode: 404, message: 'Esta consulta todavía no tiene acreditación habilitada' })
  }

  const entries = await prisma.accreditationEntry.findMany({
    where: { accreditationId: accreditation.id },
    orderBy: { accreditedAt: 'desc' }
  })

  const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const rows = entries.map(entry => [
    entry.id,
    entry.dni,
    entry.firstName ?? '',
    entry.lastName ?? '',
    entry.email ?? '',
    entry.registrationId !== null ? 'Sí' : 'No',
    dateFormatter.format(entry.accreditedAt)
  ]
    .map(csvCell)
    .join(','))

  const csv = [CSV_HEADERS.map(csvCell).join(','), ...rows].join('\r\n')
  // BOM UTF-8 para que Excel interprete bien los acentos.
  const body = `\uFEFF${csv}`

  const today = new Date().toISOString().slice(0, 10)
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="acreditaciones-${slug}-${today}.csv"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return body
})
