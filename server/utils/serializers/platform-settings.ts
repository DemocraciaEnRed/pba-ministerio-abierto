export type PlatformSettingsView = 'public' | 'admin'

type PlatformSettingsEntity = {
  id: number
  name: string
  platformName: string | null
  logoLightAssetId: number | null
  logoDarkAssetId: number | null
  symbolLightAssetId: number | null
  symbolDarkAssetId: number | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PublicPlatformSettingsDTO {
  name: string
  platformName: string | null
  logoLightAssetId: number | null
  logoDarkAssetId: number | null
  symbolLightAssetId: number | null
  symbolDarkAssetId: number | null
  contactEmail: string | null
}

export interface AdminPlatformSettingsDTO extends PublicPlatformSettingsDTO {
  id: number
  createdAt: string
  updatedAt: string
}

export function serializePlatformSettings(settings: PlatformSettingsEntity, view: 'public'): PublicPlatformSettingsDTO
export function serializePlatformSettings(settings: PlatformSettingsEntity, view: 'admin'): AdminPlatformSettingsDTO
export function serializePlatformSettings(settings: PlatformSettingsEntity, view: PlatformSettingsView): PublicPlatformSettingsDTO | AdminPlatformSettingsDTO {
  const base: PublicPlatformSettingsDTO = {
    name: settings.name,
    platformName: settings.platformName,
    logoLightAssetId: settings.logoLightAssetId,
    logoDarkAssetId: settings.logoDarkAssetId,
    symbolLightAssetId: settings.symbolLightAssetId,
    symbolDarkAssetId: settings.symbolDarkAssetId,
    contactEmail: settings.contactEmail
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    id: settings.id,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString()
  }
}
