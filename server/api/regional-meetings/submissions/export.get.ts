// Exportación CSV de los aportes: exclusiva de platform-admin. Se genera a mano
// (sin dependencias) con comillas escapadas y BOM UTF-8 para que Excel respete
// los acentos. Devuelve TODOS los aportes (no paginado).

/** Escapa un valor para CSV: comillas dobles, con las internas duplicadas. */
function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const CSV_HEADERS = [
  'ID',
  'Nombre',
  'Apellido',
  'Email',
  'Teléfono',
  'Provincia',
  'Municipio',
  'Organización',
  'Eje temático',
  'Sub-eje temático',
  'Idea o proyecto',
  'Comentarios',
  'Enlaces',
  'Archivo adjunto',
  'Fecha de envío'
]

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const submissions = await prisma.regionalMeetingSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      links: true,
      attachmentAsset: { select: { originalFilename: true } }
    }
  })

  const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const rows = submissions.map((submission) => {
    const enlaces = submission.links
      .map(link => (link.title ? `${link.title}: ${link.url}` : link.url))
      .join(' | ')

    return [
      submission.id,
      submission.firstName,
      submission.lastName,
      submission.email,
      submission.phone,
      submission.provincia,
      submission.municipio ?? '',
      submission.organization ?? '',
      submission.ejeTematico,
      submission.subejeTematico ?? '',
      submission.ideaProyecto ?? '',
      submission.comentarios ?? '',
      enlaces,
      submission.attachmentAsset?.originalFilename ?? '',
      dateFormatter.format(submission.createdAt)
    ]
      .map(csvCell)
      .join(',')
  })

  const csv = [CSV_HEADERS.map(csvCell).join(','), ...rows].join('\r\n')
  // BOM UTF-8 para que Excel interprete bien los acentos.
  const body = `\uFEFF${csv}`

  const today = new Date().toISOString().slice(0, 10)
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="aportes-encuentros-regionales-${today}.csv"`
  )
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return body
})
