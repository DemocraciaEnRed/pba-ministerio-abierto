export type RegionView = 'public' | 'admin'

type RegionEntity = {
  id: number
  slug: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface PublicRegionDTO {
  id: number
  slug: string
  name: string
}

export interface AdminRegionDTO extends PublicRegionDTO {
  createdAt: string
  updatedAt: string
}

export function serializeRegion(region: RegionEntity, view: 'public'): PublicRegionDTO
export function serializeRegion(region: RegionEntity, view: 'admin'): AdminRegionDTO
export function serializeRegion(region: RegionEntity, view: RegionView): PublicRegionDTO | AdminRegionDTO {
  const base: PublicRegionDTO = {
    id: region.id,
    slug: region.slug,
    name: region.name
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    createdAt: region.createdAt.toISOString(),
    updatedAt: region.updatedAt.toISOString()
  }
}
