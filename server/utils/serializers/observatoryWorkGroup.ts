export type ObservatoryWorkGroupView = 'public' | 'admin'

type ObservatoryWorkGroupEntity = {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicObservatoryWorkGroupDTO {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
  displayOrder: number
}

export interface AdminObservatoryWorkGroupDTO extends PublicObservatoryWorkGroupDTO {
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function serializeObservatoryWorkGroup(group: ObservatoryWorkGroupEntity, view: 'public'): PublicObservatoryWorkGroupDTO
export function serializeObservatoryWorkGroup(group: ObservatoryWorkGroupEntity, view: 'admin'): AdminObservatoryWorkGroupDTO
export function serializeObservatoryWorkGroup(
  group: ObservatoryWorkGroupEntity,
  view: ObservatoryWorkGroupView
): PublicObservatoryWorkGroupDTO | AdminObservatoryWorkGroupDTO {
  const base: PublicObservatoryWorkGroupDTO = {
    id: group.id,
    slug: group.slug,
    name: group.name,
    description: group.description,
    color: group.color,
    iconColor: group.iconColor,
    icon: group.icon,
    displayOrder: group.displayOrder
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: group.isActive,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString()
  }
}
