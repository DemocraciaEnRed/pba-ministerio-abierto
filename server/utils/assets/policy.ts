import type { MediaType } from '../../../prisma/generated/enums'

const KB = 1024
const MB = KB * KB

export const MAX_ASSET_SIZE_BYTES = 15 * MB

/** Límite y tipos permitidos específicos para avatares de usuario. */
export const AVATAR_MAX_SIZE_BYTES = 2 * MB
export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function isAllowedAvatarMime(mimeType: string): boolean {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Tipos permitidos para las imágenes de galería. Se excluye `image/svg+xml` a
 * propósito porque un SVG puede incluir scripts (riesgo de XSS al servirse).
 */
export const GALLERY_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export function isAllowedGalleryImageMime(mimeType: string): boolean {
  return (GALLERY_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Adjunto del formulario de aportes de Encuentros Regionales: un documento
 * PDF o Word, hasta 8 MB. Se sirve solo a platform-admin por un endpoint
 * protegido (nunca por URL pública).
 */
export const SUBMISSION_ATTACHMENT_MAX_SIZE_BYTES = 8 * MB
export const SUBMISSION_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const

export function isAllowedSubmissionAttachmentMime(mimeType: string): boolean {
  return (SUBMISSION_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Instrumento que acredita la personería jurídica en el formulario de
 * inscripción: PDF, Word o imagen escaneada, hasta 8 MB. Se sirve solo a quien
 * administra la consulta por un endpoint protegido.
 */
export const REGISTRATION_PROOF_MAX_SIZE_BYTES = 8 * MB
export const REGISTRATION_PROOF_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
] as const

export function isAllowedRegistrationProofMime(mimeType: string): boolean {
  return (REGISTRATION_PROOF_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Adjunto opcional de un comentario: documento o imagen común, hasta 10 MB. Se
 * sirve solo a quien administra/modera la consulta por un endpoint protegido.
 */
export const COMMENT_ATTACHMENT_MAX_SIZE_BYTES = 10 * MB
export const COMMENT_ATTACHMENT_ALLOWED_MIME_TYPES = [
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

export function isAllowedCommentAttachmentMime(mimeType: string): boolean {
  return (COMMENT_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

const mimeByMediaType: Record<MediaType, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  document: [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  other: ['application/zip']
}

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'application/zip': 'zip'
}

const allAllowedMimeTypes = new Set(Object.values(mimeByMediaType).flat())

export function isSupportedMimeType(mimeType: string): boolean {
  return allAllowedMimeTypes.has(mimeType)
}

export function inferMediaTypeFromMime(mimeType: string): MediaType | null {
  for (const [mediaType, mimeTypes] of Object.entries(mimeByMediaType) as [MediaType, readonly string[]][]) {
    if (mimeTypes.includes(mimeType)) {
      return mediaType
    }
  }
  return null
}

export function isMimeAllowedForMediaType(mimeType: string, mediaType: MediaType): boolean {
  return mimeByMediaType[mediaType].includes(mimeType)
}

export function getExtensionForMimeType(mimeType: string): string {
  const extension = extensionByMimeType[mimeType]
  if (!extension) {
    throw createError({
      statusCode: 422,
      message: 'El formato de archivo no está permitido'
    })
  }
  return extension
}
