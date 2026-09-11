export type ObservatoryContributionView = 'admin'

type ContributionLinkEntity = {
  id: number
  url: string
  title: string | null
}

type ContributionAttachmentEntity = {
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
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
  workGroup: ContributionWorkGroupEntity
  links: ContributionLinkEntity[]
  attachmentAsset: ContributionAttachmentEntity | null
}

export interface ObservatoryContributionLinkDTO {
  id: number
  url: string
  title: string | null
}

export interface ObservatoryContributionAttachmentDTO {
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
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
  workGroupSlug: string
  workGroupName: string
  description: string | null
  links: ObservatoryContributionLinkDTO[]
  attachment: ObservatoryContributionAttachmentDTO | null
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
    workGroupSlug: contribution.workGroup.slug,
    workGroupName: contribution.workGroup.name,
    description: contribution.description,
    links: contribution.links.map(link => ({
      id: link.id,
      url: link.url,
      title: link.title
    })),
    attachment: contribution.attachmentAsset
      ? {
          filename: contribution.attachmentAsset.originalFilename,
          mimeType: contribution.attachmentAsset.mimeType,
          sizeBytes: contribution.attachmentAsset.sizeBytes
        }
      : null,
    createdAt: contribution.createdAt.toISOString()
  }
}
