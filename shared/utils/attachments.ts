/**
 * Política de adjuntos de los formularios con carga de archivos (comentarios,
 * aportes del Observatorio y de Encuentros Regionales). Se comparte entre el
 * cliente (validación previa y textos de ayuda) y el servidor (validación real).
 */

const MB = 1024 * 1024

export const UPLOAD_ATTACHMENTS_MAX_FILES = 3
/** Cuota total por envío: un único archivo puede ocuparla completa. */
export const UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES = 30 * MB
export const UPLOAD_ATTACHMENTS_MAX_TOTAL_LABEL = '30 MB'

export const UPLOAD_ATTACHMENTS_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp'
] as const

export const UPLOAD_ATTACHMENTS_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp'

export const UPLOAD_ATTACHMENTS_MESSAGES = {
  invalidType: 'Cada archivo debe ser un PDF, un documento de Office, texto o una imagen (.jpg/.png/.webp).',
  empty: 'No se pueden adjuntar archivos vacíos.',
  tooMany: `Podés adjuntar hasta ${UPLOAD_ATTACHMENTS_MAX_FILES} archivos.`,
  tooLarge: `Los archivos superan el máximo permitido de ${UPLOAD_ATTACHMENTS_MAX_TOTAL_LABEL} en total.`
} as const

export const UPLOAD_ATTACHMENTS_HELP = `Opcional. Hasta ${UPLOAD_ATTACHMENTS_MAX_FILES} archivos (PDF, Office, texto o imagen), ${UPLOAD_ATTACHMENTS_MAX_TOTAL_LABEL} en total.`

export function isAllowedUploadAttachmentMime(mimeType: string): boolean {
  return (UPLOAD_ATTACHMENTS_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/** Formatea un peso en bytes para mostrarlo (por ejemplo, "12,4 MB"). */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / MB).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`
}

/** Adjunto descargable tal como lo exponen las vistas de administración. */
export interface AttachmentFileDTO {
  id: number
  filename: string
  mimeType: string | null
  sizeBytes: number | null
  downloadUrl: string
}

export interface UploadAttachmentCandidate {
  type: string
  size: number
}

/**
 * Valida una selección de archivos contra la política. Devuelve el primer
 * mensaje de error o `null` si la selección es válida.
 */
export function validateUploadAttachments(files: readonly UploadAttachmentCandidate[]): string | null {
  if (files.length > UPLOAD_ATTACHMENTS_MAX_FILES) return UPLOAD_ATTACHMENTS_MESSAGES.tooMany
  let total = 0
  for (const file of files) {
    if (!isAllowedUploadAttachmentMime(file.type)) return UPLOAD_ATTACHMENTS_MESSAGES.invalidType
    if (file.size === 0) return UPLOAD_ATTACHMENTS_MESSAGES.empty
    total += file.size
  }
  if (total > UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES) return UPLOAD_ATTACHMENTS_MESSAGES.tooLarge
  return null
}
