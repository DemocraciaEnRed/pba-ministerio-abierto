import type { AssetLinkRole, AssetOwnerType } from '../../../prisma/generated/enums'
import type { AdminAssetDTO, PublicAssetDTO } from './asset'

export type AssetLinkView = 'public' | 'admin'

type AssetLinkEntity = {
  id: number
  assetId: number
  ownerType: AssetOwnerType
  ownerId: number
  role: AssetLinkRole
  displayOrder: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  asset: PublicAssetDTO | AdminAssetDTO
}

export interface PublicAssetLinkDTO {
  id: number
  role: AssetLinkRole
  displayOrder: number
  asset: PublicAssetDTO
}

export interface AdminAssetLinkDTO {
  id: number
  assetId: number
  ownerType: AssetOwnerType
  ownerId: number
  role: AssetLinkRole
  displayOrder: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
  asset: AdminAssetDTO
}

export function serializeAssetLink(assetLink: AssetLinkEntity, view: 'public'): PublicAssetLinkDTO
export function serializeAssetLink(assetLink: AssetLinkEntity, view: 'admin'): AdminAssetLinkDTO
export function serializeAssetLink(assetLink: AssetLinkEntity, view: AssetLinkView): PublicAssetLinkDTO | AdminAssetLinkDTO {
  if (view === 'public') {
    return {
      id: assetLink.id,
      role: assetLink.role,
      displayOrder: assetLink.displayOrder,
      asset: assetLink.asset as PublicAssetDTO
    }
  }

  return {
    id: assetLink.id,
    assetId: assetLink.assetId,
    ownerType: assetLink.ownerType,
    ownerId: assetLink.ownerId,
    role: assetLink.role,
    displayOrder: assetLink.displayOrder,
    isPublic: assetLink.isPublic,
    createdAt: assetLink.createdAt.toISOString(),
    updatedAt: assetLink.updatedAt.toISOString(),
    asset: assetLink.asset as AdminAssetDTO
  }
}
