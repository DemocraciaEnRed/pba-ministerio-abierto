export type TopicLinkView = 'public' | 'admin'

type TopicLinkEntity = {
  id: number
  topicId: number
  label: string
  url: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicTopicLinkDTO {
  id: number
  topicId: number
  label: string
  url: string
  displayOrder: number
}

export interface AdminTopicLinkDTO extends PublicTopicLinkDTO {
  createdAt: string
  updatedAt: string
}

export function serializeTopicLink(link: TopicLinkEntity, view: 'public'): PublicTopicLinkDTO
export function serializeTopicLink(link: TopicLinkEntity, view: 'admin'): AdminTopicLinkDTO
export function serializeTopicLink(
  link: TopicLinkEntity,
  view: TopicLinkView
): PublicTopicLinkDTO | AdminTopicLinkDTO {
  const base: PublicTopicLinkDTO = {
    id: link.id,
    topicId: link.topicId,
    label: link.label,
    url: link.url,
    displayOrder: link.displayOrder
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString()
  }
}
