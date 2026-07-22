import { createHash, randomUUID } from 'node:crypto'
import type { MediaType } from '../../../prisma/generated/enums'
import { UploadedAssetMetadataSchema } from '#shared/schemas/assets'
import {
  MAX_ASSET_SIZE_BYTES,
  getExtensionForMimeType,
  inferMediaTypeFromMime,
  isAllowedGalleryImageMime,
  isMimeAllowedForMediaType,
  isSupportedMimeType
} from './policy'

interface MultipartDataPart {
  name?: string
  data?: Buffer
  filename?: string
  type?: string
}

export interface ParsedUploadedAsset {
  title: string | null
  description: string | null
  altText: string | null
  mediaType: MediaType
  originalFilename: string | null
  mimeType: string
  sizeBytes: number
  checksum: string
  buffer: Buffer
}

function formatZodIssues(error: { issues: { path: PropertyKey[], message: string }[] }) {
  return error.issues.map(issue => ({
    field: issue.path.map(item => String(item)).join('.'),
    message: issue.message
  }))
}

function readTextPart(parts: MultipartDataPart[], name: string): string | undefined {
  const part = parts.find(item => item.name === name)
  if (!part?.data) return undefined
  return part.data.toString('utf8')
}

function normalizeNullableText(value?: string): string | null | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function getSingleFilePart(parts: MultipartDataPart[]): Required<Pick<MultipartDataPart, 'data' | 'filename' | 'type'>> {
  const fileParts = parts.filter(part => part.name === 'file' && part.data && part.filename)

  if (fileParts.length !== 1) {
    throw createError({
      statusCode: 422,
      message: 'Debés adjuntar exactamente un archivo en el campo "file"'
    })
  }

  const filePart = fileParts[0]
  if (!filePart) {
    throw createError({
      statusCode: 422,
      message: 'Debés adjuntar exactamente un archivo en el campo "file"'
    })
  }

  const mimeType = filePart.type?.trim()
  if (!mimeType) {
    throw createError({
      statusCode: 422,
      message: 'No se pudo detectar el tipo MIME del archivo'
    })
  }

  return {
    data: filePart.data!,
    filename: filePart.filename!,
    type: mimeType
  }
}

/** Carpeta de destino según el propósito de la subida. */
export type AssetStorageCategory = 'avatars' | 'assets'

/** Timestamp UTC compacto y ordenable: `YYYYMMDDTHHmmss`. */
function buildCompactTimestamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '')
}

export function buildAssetStorageKey(category: AssetStorageCategory, mimeType: string, now = new Date()): string {
  const timestamp = buildCompactTimestamp(now)
  const shortId = randomUUID().slice(0, 8)
  const extension = getExtensionForMimeType(mimeType)
  return `${category}/${timestamp}-${shortId}.${extension}`
}

export async function parseUploadedAssetFromMultipart(
  event: Parameters<typeof readMultipartFormData>[0],
  options: { imageOnly?: boolean } = {}
): Promise<ParsedUploadedAsset> {
  const parts = (await readMultipartFormData(event)) as MultipartDataPart[] | null

  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 422,
      message: 'No se recibieron datos de subida'
    })
  }

  const filePart = getSingleFilePart(parts)
  const sizeBytes = filePart.data.length

  if (sizeBytes === 0) {
    throw createError({
      statusCode: 422,
      message: 'El archivo está vacío'
    })
  }

  if (sizeBytes > MAX_ASSET_SIZE_BYTES) {
    throw createError({
      statusCode: 422,
      message: `El archivo supera el máximo permitido de ${MAX_ASSET_SIZE_BYTES} bytes`
    })
  }

  if (options.imageOnly && !isAllowedGalleryImageMime(filePart.type)) {
    throw createError({
      statusCode: 422,
      message: 'Solo se permiten imágenes JPG, PNG, WebP o GIF'
    })
  }

  if (!isSupportedMimeType(filePart.type)) {
    throw createError({
      statusCode: 422,
      message: 'El tipo MIME del archivo no está permitido'
    })
  }

  const metadataRaw = {
    title: normalizeNullableText(readTextPart(parts, 'title')),
    description: normalizeNullableText(readTextPart(parts, 'description')),
    altText: normalizeNullableText(readTextPart(parts, 'altText')),
    mediaType: normalizeNullableText(readTextPart(parts, 'mediaType')) ?? undefined
  }

  const parsedMetadata = UploadedAssetMetadataSchema.safeParse(metadataRaw)
  if (!parsedMetadata.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: formatZodIssues(parsedMetadata.error)
    })
  }

  const inferredMediaType = inferMediaTypeFromMime(filePart.type)
  if (!inferredMediaType) {
    throw createError({
      statusCode: 422,
      message: 'No se pudo inferir el tipo de medio para el archivo'
    })
  }

  const mediaType = parsedMetadata.data.mediaType ?? inferredMediaType
  if (!isMimeAllowedForMediaType(filePart.type, mediaType)) {
    throw createError({
      statusCode: 422,
      message: 'El tipo MIME no coincide con el tipo de medio informado'
    })
  }

  const checksum = createHash('sha256').update(filePart.data).digest('hex')

  return {
    title: parsedMetadata.data.title ?? null,
    description: parsedMetadata.data.description ?? null,
    altText: parsedMetadata.data.altText ?? null,
    mediaType,
    originalFilename: filePart.filename,
    mimeType: filePart.type,
    sizeBytes,
    checksum,
    buffer: filePart.data
  }
}
