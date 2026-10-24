import type { DataExportKind, DataExportStatus } from '~/types/exports'

export const DATA_EXPORT_KIND_LABELS: Record<DataExportKind, string> = {
  consultation_comments: 'Comentarios de la consulta',
  platform_comments: 'Comentarios de la plataforma',
  consultation_registrations: 'Inscripciones',
  consultation_accreditations: 'Acreditaciones',
  regional_meeting_submissions: 'Aportes de Encuentros Regionales',
  observatory_contributions: 'Aportes del Observatorio'
}

export const DATA_EXPORT_STATUS_BADGES: Record<DataExportStatus, { label: string, color: 'neutral' | 'info' | 'success' | 'error', icon: string }> = {
  pending: { label: 'En cola', color: 'neutral', icon: 'i-lucide-clock' },
  processing: { label: 'Generando', color: 'info', icon: 'i-lucide-loader-circle' },
  ready: { label: 'Lista', color: 'success', icon: 'i-lucide-circle-check' },
  failed: { label: 'Falló', color: 'error', icon: 'i-lucide-circle-x' }
}

const FILTER_LABELS: Record<string, string> = {
  q: 'Búsqueda',
  moderationStatus: 'Estado',
  from: 'Desde',
  to: 'Hasta',
  unanswered: 'Sin respuesta institucional',
  withAttachment: 'Con adjunto',
  topic: 'Tema',
  topicId: 'Tema',
  consultationId: 'Consulta'
}

const MODERATION_STATUS_LABELS: Record<string, string> = {
  visible: 'Visibles',
  hidden: 'Ocultos',
  deleted: 'Borrados'
}

/** Resumen legible de los filtros con los que se pidió una exportación. */
export function dataExportFiltersSummary(filters: Record<string, unknown>): string[] {
  return Object.entries(filters)
    .filter(([key, value]) => key in FILTER_LABELS && key !== 'consultationId' && key !== 'topicId'
      && value !== undefined && value !== null && value !== false && value !== '')
    .map(([key, value]) => {
      const label = FILTER_LABELS[key]!
      if (value === true) return label
      if (key === 'topic') return 'Solo este tema'
      if (key === 'moderationStatus') return `${label}: ${MODERATION_STATUS_LABELS[String(value)] ?? value}`
      if (key === 'from' || key === 'to') return `${label}: ${formatDateOnly(String(value))}`
      return `${label}: "${value}"`
    })
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

export function formatExportSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
