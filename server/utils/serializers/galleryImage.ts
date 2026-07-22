export type GalleryImageView = 'public' | 'admin'

/**
 * Una imagen de galería es un `AssetLink` (role `gallery`) junto con su `Asset`.
 * Este DTO aplana ambos para el carrusel público y el panel de administración.
 */
type GalleryImageEntity = {
  id: number
  displayOrder: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  asset: {
    id: number
    title: string | null
    altText: string | null
    description: string | null
    originalFilename: string | null
    mimeType: string | null
    sizeBytes: number | null
    accessUrl: string | null
  }
}

export interface PublicGalleryImageDTO {
  id: number
  displayOrder: number
  title: string | null
  altText: string | null
  description: string | null
  url: string | null
}

export interface AdminGalleryImageDTO extends PublicGalleryImageDTO {
  assetId: number
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export function serializeGalleryImage(image: GalleryImageEntity, view: 'public'): PublicGalleryImageDTO
export function serializeGalleryImage(image: GalleryImageEntity, view: 'admin'): AdminGalleryImageDTO
export function serializeGalleryImage(image: GalleryImageEntity, view: GalleryImageView): PublicGalleryImageDTO | AdminGalleryImageDTO {
  const base: PublicGalleryImageDTO = {
    id: image.id,
    displayOrder: image.displayOrder,
    title: image.asset.title,
    altText: image.asset.altText,
    description: image.asset.description,
    url: image.asset.accessUrl
  }

  if (view === 'public') return base

  return {
    ...base,
    assetId: image.asset.id,
    filename: image.asset.originalFilename,
    mimeType: image.asset.mimeType,
    sizeBytes: image.asset.sizeBytes,
    isPublic: image.isPublic,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString()
  }
}
