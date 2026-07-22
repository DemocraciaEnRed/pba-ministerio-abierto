export type SectionView = 'public' | 'admin'

type SectionEntity = {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicSectionDTO {
  id: number
  slug: string
  name: string
  description: string | null
}

export interface AdminSectionDTO extends PublicSectionDTO {
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function serializeSection(section: SectionEntity, view: 'public'): PublicSectionDTO
export function serializeSection(section: SectionEntity, view: 'admin'): AdminSectionDTO
export function serializeSection(section: SectionEntity, view: SectionView): PublicSectionDTO | AdminSectionDTO {
  const base: PublicSectionDTO = {
    id: section.id,
    slug: section.slug,
    name: section.name,
    description: section.description
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: section.isActive,
    displayOrder: section.displayOrder,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString()
  }
}
