import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import {
  UPLOAD_ATTACHMENTS_MAX_FILES,
  UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES,
  UPLOAD_ATTACHMENTS_MESSAGES,
  isAllowedUploadAttachmentMime,
  type AttachmentFileDTO
} from '#shared/utils/attachments'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey } from './upload'

/**
 * Adjuntos múltiples (hasta 3, 30 MB en total) de comentarios y de los aportes
 * del Observatorio y de Encuentros Regionales. Los archivos se guardan siempre
 * privados y solo se sirven por endpoints protegidos.
 */

export interface UploadMultipartPart {
  name?: string
  data?: Buffer
  filename?: string
  type?: string
}

export interface ParsedUploadAttachment {
  buffer: Buffer
  originalFilename: string
  mimeType: string
  sizeBytes: number
  checksum: string
}

export interface StoredUploadAttachment extends ParsedUploadAttachment {
  storageKey: string
}

/** Nombres de campo aceptados: `files` (repetido) y `file` por compatibilidad. */
const FILE_FIELD_NAMES = new Set(['files', 'file'])

/**
 * Toma las partes de archivo del multipart y valida cantidad, tipo, que no
 * estén vacías y el peso total. Lanza 422 con un mensaje claro si algo falla.
 */
export function parseUploadAttachments(parts: UploadMultipartPart[] | null | undefined): ParsedUploadAttachment[] {
  const fileParts = (parts ?? []).filter(part => part.name && FILE_FIELD_NAMES.has(part.name) && part.filename && part.data)

  if (fileParts.length > UPLOAD_ATTACHMENTS_MAX_FILES) {
    throw createError({ statusCode: 422, message: UPLOAD_ATTACHMENTS_MESSAGES.tooMany })
  }

  let totalBytes = 0
  const attachments = fileParts.map((part) => {
    const mimeType = part.type?.trim()
    if (!mimeType || !isAllowedUploadAttachmentMime(mimeType)) {
      throw createError({ statusCode: 422, message: UPLOAD_ATTACHMENTS_MESSAGES.invalidType })
    }
    const buffer = part.data!
    if (buffer.length === 0) {
      throw createError({ statusCode: 422, message: UPLOAD_ATTACHMENTS_MESSAGES.empty })
    }
    totalBytes += buffer.length
    return {
      buffer,
      originalFilename: part.filename || 'adjunto',
      mimeType,
      sizeBytes: buffer.length,
      checksum: createHash('sha256').update(buffer).digest('hex')
    }
  })

  if (totalBytes > UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES) {
    throw createError({ statusCode: 422, message: UPLOAD_ATTACHMENTS_MESSAGES.tooLarge })
  }

  return attachments
}

/** Borra del storage los archivos ya subidos (best effort). */
export async function discardStoredAttachments(stored: StoredUploadAttachment[]): Promise<void> {
  if (stored.length === 0) return
  const driver = useStorageDriver()
  await Promise.allSettled(stored.map(item => driver.delete(item.storageKey)))
}

/**
 * Sube los adjuntos al storage privado. Si alguno falla, borra los que ya se
 * habían subido y relanza el error.
 */
export async function storeUploadAttachments(attachments: ParsedUploadAttachment[]): Promise<StoredUploadAttachment[]> {
  const driver = useStorageDriver()
  const stored: StoredUploadAttachment[] = []
  try {
    for (const attachment of attachments) {
      const storageKey = buildAssetStorageKey('assets', attachment.mimeType)
      // `public: false`: en S3 no hay URL pública; se sirve por el endpoint protegido.
      await driver.put({ key: storageKey, body: attachment.buffer, contentType: attachment.mimeType, public: false })
      stored.push({ ...attachment, storageKey })
    }
  } catch (error) {
    await discardStoredAttachments(stored)
    throw error
  }
  return stored
}

/**
 * Arma el `create` anidado (fila de unión + `Asset`) para usar dentro del
 * `create` de la entidad dueña de los adjuntos.
 */
export function buildAttachmentCreates(stored: StoredUploadAttachment[], uploadedByUserId: number | null = null) {
  const driver = useStorageDriver()
  return stored.map((item, index) => ({
    displayOrder: index,
    asset: {
      create: {
        assetType: 'uploaded_file' as const,
        mediaType: item.mimeType.startsWith('image/') ? 'image' as const : 'document' as const,
        storageProvider: driver.name,
        storagePath: item.storageKey,
        originalFilename: item.originalFilename,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        checksum: item.checksum,
        uploadedByUserId
      }
    }
  }))
}

/**
 * Sube los adjuntos y ejecuta `persist` con los `create` anidados. Si la
 * persistencia falla, borra los archivos del storage para no dejar huérfanos.
 */
export async function withStoredAttachments<T>(
  attachments: ParsedUploadAttachment[],
  persist: (stored: StoredUploadAttachment[]) => Promise<T>
): Promise<T> {
  const stored = await storeUploadAttachments(attachments)
  try {
    return await persist(stored)
  } catch (error) {
    await discardStoredAttachments(stored)
    throw error
  }
}

/** `select` común para leer los adjuntos de una entidad, en orden. */
export const attachmentListSelect = {
  select: {
    id: true,
    asset: { select: { originalFilename: true, mimeType: true, sizeBytes: true } }
  },
  orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }]
}

export interface AttachmentListEntity {
  id: number
  asset: { originalFilename: string | null, mimeType: string | null, sizeBytes: number | null }
}

/** Serializa los adjuntos con la URL del endpoint protegido de descarga. */
export function serializeAttachmentFiles(
  attachments: AttachmentListEntity[] | undefined,
  buildDownloadUrl: (attachmentId: number) => string
): AttachmentFileDTO[] {
  return (attachments ?? []).map(attachment => ({
    id: attachment.id,
    filename: attachment.asset.originalFilename ?? 'adjunto',
    mimeType: attachment.asset.mimeType,
    sizeBytes: attachment.asset.sizeBytes,
    downloadUrl: buildDownloadUrl(attachment.id)
  }))
}

export interface StoredAssetFile {
  storagePath: string | null
  mimeType: string | null
  originalFilename: string | null
}

/** Envía el archivo de un asset privado como descarga. */
export async function sendStoredAttachment(event: H3Event, asset: StoredAssetFile | null | undefined) {
  if (!asset?.storagePath) {
    throw createError({ statusCode: 404, message: 'No se encontró el archivo adjunto.' })
  }

  const file = await useStorageDriver().get(asset.storagePath)
  if (!file) {
    throw createError({ statusCode: 404, message: 'No se encontró el archivo adjunto.' })
  }

  const filename = asset.originalFilename ?? 'adjunto'
  setResponseHeader(event, 'Content-Type', asset.mimeType ?? 'application/octet-stream')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return file
}
