export type ObservatoryInstitutionCategoryView = 'public' | 'admin'

type InstitutionCategoryEntity = {
  id: number
  slug: string
  name: string
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

type InstitutionEntity = {
  id: number
  categoryId: number
  slug: string
  name: string
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicObservatoryInstitutionCategoryDTO {
  id: number
  slug: string
  name: string
}

export interface AdminObservatoryInstitutionCategoryDTO extends PublicObservatoryInstitutionCategoryDTO {
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface PublicObservatoryInstitutionDTO {
  id: number
  categoryId: number
  slug: string
  name: string
}

export interface AdminObservatoryInstitutionDTO extends PublicObservatoryInstitutionDTO {
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export function serializeObservatoryInstitutionCategory(
  category: InstitutionCategoryEntity,
  view: 'public'
): PublicObservatoryInstitutionCategoryDTO
export function serializeObservatoryInstitutionCategory(
  category: InstitutionCategoryEntity,
  view: 'admin'
): AdminObservatoryInstitutionCategoryDTO
export function serializeObservatoryInstitutionCategory(
  category: InstitutionCategoryEntity,
  view: ObservatoryInstitutionCategoryView
): PublicObservatoryInstitutionCategoryDTO | AdminObservatoryInstitutionCategoryDTO {
  const base: PublicObservatoryInstitutionCategoryDTO = {
    id: category.id,
    slug: category.slug,
    name: category.name
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

export function serializeObservatoryInstitution(
  institution: InstitutionEntity,
  view: 'public'
): PublicObservatoryInstitutionDTO
export function serializeObservatoryInstitution(
  institution: InstitutionEntity,
  view: 'admin'
): AdminObservatoryInstitutionDTO
export function serializeObservatoryInstitution(
  institution: InstitutionEntity,
  view: ObservatoryInstitutionCategoryView
): PublicObservatoryInstitutionDTO | AdminObservatoryInstitutionDTO {
  const base: PublicObservatoryInstitutionDTO = {
    id: institution.id,
    categoryId: institution.categoryId,
    slug: institution.slug,
    name: institution.name
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: institution.isActive,
    displayOrder: institution.displayOrder,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString()
  }
}
