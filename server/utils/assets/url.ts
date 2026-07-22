import type { StorageDriver } from '../storage/types'
import type { AssetType } from '../../../prisma/generated/enums'

export interface AssetUrlResolvable {
  assetType: AssetType
  storagePath: string | null
  externalUrl: string | null
}

export async function resolveAssetAccessUrl(asset: AssetUrlResolvable, driver: StorageDriver): Promise<string | null> {
  if (asset.assetType === 'external_link') {
    return asset.externalUrl
  }

  if (!asset.storagePath) {
    return null
  }

  return driver.url(asset.storagePath)
}
