export type TagView = 'public' | 'admin'

type TagEntity = {
  id: number
  slug: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicTagDTO {
  id: number
  slug: string
  name: string
  description: string | null
}

export interface AdminTagDTO extends PublicTagDTO {
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function serializeTag(tag: TagEntity, view: 'public'): PublicTagDTO
export function serializeTag(tag: TagEntity, view: 'admin'): AdminTagDTO
export function serializeTag(tag: TagEntity, view: TagView): PublicTagDTO | AdminTagDTO {
  const base: PublicTagDTO = {
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    description: tag.description
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    isActive: tag.isActive,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString()
  }
}
