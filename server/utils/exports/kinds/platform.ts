import { exportCursorWhere, iterateExportBatchesById } from '../batches'
import { formatExportDate, type CsvValue } from '../csv'
import { defineDataExport } from '../types'

/** Adjuntos en dos columnas: cantidad y nombres separados por "; ". */
const attachmentExportSelect = {
  select: { asset: { select: { originalFilename: true } } },
  orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }]
}

function attachmentColumns(attachments: { asset: { originalFilename: string | null } }[]): CsvValue[] {
  return [
    attachments.length,
    attachments.map(attachment => attachment.asset.originalFilename ?? 'adjunto').join('; ')
  ]
}

function formatLinks(links: { title: string | null, url: string }[]): string {
  return links.map(link => (link.title ? `${link.title}: ${link.url}` : link.url)).join(' | ')
}

/** Aportes de los Encuentros Regionales (todos, sin filtros). */
export const regionalMeetingSubmissionsExport = defineDataExport<Record<string, never>>({
  kind: 'regional_meeting_submissions',
  scope: 'platform',
  headers: [
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
    'Adjuntos',
    'Archivos adjuntos',
    'Fecha de envío'
  ],

  async describe() {
    return {
      title: 'Aportes de Encuentros Regionales',
      filenameBase: 'aportes-encuentros-regionales',
      filters: {}
    }
  },

  async* rows(_input, batchSize) {
    const batches = iterateExportBatchesById(
      (cursor, take) => prisma.regionalMeetingSubmission.findMany({
        where: exportCursorWhere(cursor),
        orderBy: { id: 'desc' },
        include: {
          links: true,
          attachments: attachmentExportSelect
        },
        take
      }),
      batchSize
    )

    for await (const batch of batches) {
      yield batch.map((submission): CsvValue[] => [
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
        formatLinks(submission.links),
        ...attachmentColumns(submission.attachments),
        formatExportDate(submission.createdAt)
      ])
    }
  }
})

/** Aportes del Observatorio de Obras y Servicios Públicos (todos, sin filtros). */
export const observatoryContributionsExport = defineDataExport<Record<string, never>>({
  kind: 'observatory_contributions',
  scope: 'platform',
  headers: [
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
    'Adjuntos',
    'Archivos adjuntos',
    'Fecha de envío'
  ],

  async describe() {
    return {
      title: 'Aportes del Observatorio',
      filenameBase: 'aportes-observatorio',
      filters: {}
    }
  },

  async* rows(_input, batchSize) {
    const batches = iterateExportBatchesById(
      (cursor, take) => prisma.observatoryContribution.findMany({
        where: exportCursorWhere(cursor),
        orderBy: { id: 'desc' },
        include: {
          links: true,
          workGroupAssignments: {
            include: { workGroup: { select: { name: true } } },
            orderBy: { workGroup: { displayOrder: 'asc' } }
          },
          attachments: attachmentExportSelect
        },
        take
      }),
      batchSize
    )

    for await (const batch of batches) {
      yield batch.map((contribution): CsvValue[] => [
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
        formatLinks(contribution.links),
        ...attachmentColumns(contribution.attachments),
        formatExportDate(contribution.createdAt)
      ])
    }
  }
})
