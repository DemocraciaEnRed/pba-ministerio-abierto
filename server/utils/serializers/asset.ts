import type { AssetType, MediaType, StorageProvider } from '../../../prisma/generated/enums'

export type AssetView = 'public' | 'admin'

type AssetEntity = {
  id: number
  title: string | null
  description: string | null
  assetType: AssetType
  mediaType: MediaType
  storageProvider: StorageProvider
  storagePath: string | null
  externalUrl: string | null
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
  checksum: string | null
  metadata: unknown | null
  uploadedByUserId: number | null
  createdAt: Date
  updatedAt: Date
  accessUrl: string | null
}

export interface PublicAssetDTO {
  id: number
  title: string | null
  description: string | null
  assetType: AssetType
  mediaType: MediaType
  url: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminAssetDTO extends PublicAssetDTO {
  storageProvider: StorageProvider
  storagePath: string | null
  externalUrl: string | null
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
  checksum: string | null
  metadata: unknown | null
  uploadedByUserId: number | null
}

export function serializeAsset(asset: AssetEntity, view: 'public'): PublicAssetDTO
export function serializeAsset(asset: AssetEntity, view: 'admin'): AdminAssetDTO
export function serializeAsset(asset: AssetEntity, view: AssetView): PublicAssetDTO | AdminAssetDTO {
  const base: PublicAssetDTO = {
    id: asset.id,
    title: asset.title,
    description: asset.description,
    assetType: asset.assetType,
    mediaType: asset.mediaType,
    url: asset.accessUrl,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString()
  }

  if (view === 'public') {
    return base
  }

  return {
    id: base.id,
    title: base.title,
    description: base.description,
    assetType: base.assetType,
    mediaType: base.mediaType,
    url: base.url,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    storageProvider: asset.storageProvider,
    storagePath: asset.storagePath,
    externalUrl: asset.externalUrl,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    checksum: asset.checksum,
    metadata: asset.metadata,
    uploadedByUserId: asset.uploadedByUserId
  }
}
