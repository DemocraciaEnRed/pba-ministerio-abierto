// Exportación CSV de los aportes del Observatorio: exclusiva de platform-admin.
// Se genera a mano (sin dependencias) con comillas escapadas y BOM UTF-8 para
// que Excel respete los acentos. Devuelve TODOS los aportes (no paginado).

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
  'Categoría de institución',
  'Institución',
  'Eje de trabajo',
  'Descripción del aporte',
  'Enlaces',
  'Archivo adjunto',
  'Fecha de envío'
]

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const contributions = await prisma.observatoryContribution.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      links: true,
      workGroupAssignments: {
        include: { workGroup: { select: { name: true } } },
        orderBy: { workGroup: { displayOrder: 'asc' } }
      },
      attachmentAsset: { select: { originalFilename: true } }
    }
  })

  const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  const rows = contributions.map((contribution) => {
    const enlaces = contribution.links
      .map(link => (link.title ? `${link.title}: ${link.url}` : link.url))
      .join(' | ')

    return [
      contribution.id,
      contribution.firstName,
      contribution.lastName,
      contribution.email,
      contribution.phone,
      contribution.provincia,
      contribution.municipio ?? '',
      contribution.institutionCategoryName,
      contribution.institutionName,
      contribution.workGroupAssignments.map(assignment => assignment.workGroup.name).join(', '),
      contribution.description ?? '',
      enlaces,
      contribution.attachmentAsset?.originalFilename ?? '',
      dateFormatter.format(contribution.createdAt)
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
    `attachment; filename="aportes-observatorio-${today}.csv"`
  )
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return body
})
