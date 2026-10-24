import type { AttachmentFileDTO } from '#shared/utils/attachments'
import { serializeAttachmentFiles, type AttachmentListEntity } from '../assets/multi-attachments'

export type ObservatoryContributionView = 'admin'

type ContributionLinkEntity = {
  id: number
  url: string
  title: string | null
}

type ContributionWorkGroupEntity = {
  slug: string
  name: string
}

type ContributionEntity = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  provincia: string
  municipio: string | null
  institutionId: number | null
  institutionName: string
  institutionCategoryName: string
  description: string | null
  createdAt: Date
  workGroupAssignments: { workGroup: ContributionWorkGroupEntity }[]
  links: ContributionLinkEntity[]
  attachments: AttachmentListEntity[]
}

export interface ObservatoryContributionLinkDTO {
  id: number
  url: string
  title: string | null
}

export interface ObservatoryContributionWorkGroupDTO {
  slug: string
  name: string
}

export interface AdminObservatoryContributionDTO {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  provincia: string
  municipio: string | null
  institutionId: number | null
  institutionName: string
  institutionCategoryName: string
  workGroups: ObservatoryContributionWorkGroupDTO[]
  description: string | null
  links: ObservatoryContributionLinkDTO[]
  attachments: AttachmentFileDTO[]
  createdAt: string
}

export function serializeObservatoryContribution(
  contribution: ContributionEntity,
  view: 'admin'
): AdminObservatoryContributionDTO {
  // Solo existe la vista admin: los aportes nunca se exponen públicamente.
  void view
  return {
    id: contribution.id,
    firstName: contribution.firstName,
    lastName: contribution.lastName,
    email: contribution.email,
    phone: contribution.phone,
    provincia: contribution.provincia,
    municipio: contribution.municipio,
    institutionId: contribution.institutionId,
    institutionName: contribution.institutionName,
    institutionCategoryName: contribution.institutionCategoryName,
    workGroups: contribution.workGroupAssignments.map(assignment => ({
      slug: assignment.workGroup.slug,
      name: assignment.workGroup.name
    })),
    description: contribution.description,
    links: contribution.links.map(link => ({
      id: link.id,
      url: link.url,
      title: link.title
    })),
    attachments: serializeAttachmentFiles(
      contribution.attachments,
      attachmentId => `/api/observatory-contributions/${contribution.id}/attachments/${attachmentId}`
    ),
    createdAt: contribution.createdAt.toISOString()
  }
}
