import type { MediaType } from '../../../prisma/generated/enums'

export type AttachmentView = 'public' | 'admin'

/**
 * Un archivo adjunto es un `AssetLink` (role `attachment`) junto con su `Asset`.
 * Este DTO aplana ambos para la Card de descargas y el panel de administración.
 */
type AttachmentEntity = {
  id: number
  displayOrder: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  asset: {
    id: number
    title: string | null
    mediaType: MediaType
    originalFilename: string | null
    mimeType: string | null
    sizeBytes: number | null
    accessUrl: string | null
  }
}

export interface PublicAttachmentDTO {
  id: number
  displayOrder: number
  title: string | null
  filename: string | null
  mediaType: MediaType
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
}

export interface AdminAttachmentDTO extends PublicAttachmentDTO {
  assetId: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export function serializeAttachment(attachment: AttachmentEntity, view: 'public'): PublicAttachmentDTO
export function serializeAttachment(attachment: AttachmentEntity, view: 'admin'): AdminAttachmentDTO
export function serializeAttachment(attachment: AttachmentEntity, view: AttachmentView): PublicAttachmentDTO | AdminAttachmentDTO {
  const base: PublicAttachmentDTO = {
    id: attachment.id,
    displayOrder: attachment.displayOrder,
    title: attachment.asset.title,
    filename: attachment.asset.originalFilename,
    mediaType: attachment.asset.mediaType,
    mimeType: attachment.asset.mimeType,
    sizeBytes: attachment.asset.sizeBytes,
    url: attachment.asset.accessUrl
  }

  if (view === 'public') return base

  return {
    ...base,
    assetId: attachment.asset.id,
    isPublic: attachment.isPublic,
    createdAt: attachment.createdAt.toISOString(),
    updatedAt: attachment.updatedAt.toISOString()
  }
}
