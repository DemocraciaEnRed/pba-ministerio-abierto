export type CategoryView = 'public' | 'admin'

type CategoryEntity = {
  id: number
  sectionId: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicCategoryDTO {
  id: number
  sectionId: number
  slug: string
  name: string
  description: string | null
}

export interface AdminCategoryDTO extends PublicCategoryDTO {
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function serializeCategory(category: CategoryEntity, view: 'public'): PublicCategoryDTO
export function serializeCategory(category: CategoryEntity, view: 'admin'): AdminCategoryDTO
export function serializeCategory(category: CategoryEntity, view: CategoryView): PublicCategoryDTO | AdminCategoryDTO {
  const base: PublicCategoryDTO = {
    id: category.id,
    sectionId: category.sectionId,
    slug: category.slug,
    name: category.name,
    description: category.description
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  }
}
