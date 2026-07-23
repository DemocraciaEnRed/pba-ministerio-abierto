export type CoverImageView = 'admin'

/**
 * Una portada es un `AssetLink` (role `cover`) junto con su `Asset`. Este DTO
 * aplana ambos para el panel de administración. La lectura pública de la
 * portada (hero y cards) usa `getCoverImage`/`getCoverImagesByOwner`, que solo
 * exponen `url` + `altText`.
 */
type CoverImageEntity = {
  assetId: number
  altText: string | null
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
  accessUrl: string | null
}

export interface AdminCoverImageDTO {
  assetId: number
  url: string | null
  altText: string | null
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

export function serializeCoverImage(cover: CoverImageEntity, view: 'admin'): AdminCoverImageDTO
export function serializeCoverImage(cover: CoverImageEntity, _view: CoverImageView): AdminCoverImageDTO {
  return {
    assetId: cover.assetId,
    url: cover.accessUrl,
    altText: cover.altText,
    filename: cover.originalFilename,
    mimeType: cover.mimeType,
    sizeBytes: cover.sizeBytes
  }
}
