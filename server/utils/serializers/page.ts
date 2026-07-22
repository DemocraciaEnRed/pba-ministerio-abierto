export type PageView = 'public' | 'admin'

type SitePageEntity = {
  id: number
  platformSettingsId: number | null
  pageKey: string
  title: string
  slug: string
  content: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicPageDTO {
  id: number
  title: string
  slug: string
  content: string | null
  updatedAt: string
}

export interface AdminPageDTO extends PublicPageDTO {
  platformSettingsId: number | null
  pageKey: string
  isPublished: boolean
  createdAt: string
}

export function serializePage(page: SitePageEntity, view: 'public'): PublicPageDTO
export function serializePage(page: SitePageEntity, view: 'admin'): AdminPageDTO
export function serializePage(page: SitePageEntity, view: PageView): PublicPageDTO | AdminPageDTO {
  const base: PublicPageDTO = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    updatedAt: page.updatedAt.toISOString()
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    platformSettingsId: page.platformSettingsId,
    pageKey: page.pageKey,
    isPublished: page.isPublished,
    createdAt: page.createdAt.toISOString()
  }
}
