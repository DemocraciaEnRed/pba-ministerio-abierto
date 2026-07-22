export type ConsultationLinkView = 'public' | 'admin'

type ConsultationLinkEntity = {
  id: number
  consultationId: number
  label: string
  url: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PublicConsultationLinkDTO {
  id: number
  consultationId: number
  label: string
  url: string
  displayOrder: number
}

export interface AdminConsultationLinkDTO extends PublicConsultationLinkDTO {
  createdAt: string
  updatedAt: string
}

export function serializeConsultationLink(link: ConsultationLinkEntity, view: 'public'): PublicConsultationLinkDTO
export function serializeConsultationLink(link: ConsultationLinkEntity, view: 'admin'): AdminConsultationLinkDTO
export function serializeConsultationLink(
  link: ConsultationLinkEntity,
  view: ConsultationLinkView
): PublicConsultationLinkDTO | AdminConsultationLinkDTO {
  const base: PublicConsultationLinkDTO = {
    id: link.id,
    consultationId: link.consultationId,
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
