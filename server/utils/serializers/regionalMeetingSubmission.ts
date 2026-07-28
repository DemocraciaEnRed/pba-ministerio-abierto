export type RegionalMeetingSubmissionView = 'admin'

type SubmissionLinkEntity = {
  id: number
  url: string
  title: string | null
}

type SubmissionAttachmentEntity = {
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

type SubmissionEntity = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  provincia: string
  municipio: string | null
  organization: string | null
  ejeTematico: string
  subejeTematico: string | null
  ideaProyecto: string | null
  comentarios: string | null
  attachmentAssetId: number | null
  createdAt: Date
  links: SubmissionLinkEntity[]
  attachmentAsset: SubmissionAttachmentEntity | null
}

export interface RegionalMeetingSubmissionLinkDTO {
  id: number
  url: string
  title: string | null
}

export interface RegionalMeetingSubmissionAttachmentDTO {
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

export interface AdminRegionalMeetingSubmissionDTO {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  provincia: string
  municipio: string | null
  organization: string | null
  ejeTematico: string
  subejeTematico: string | null
  ideaProyecto: string | null
  comentarios: string | null
  links: RegionalMeetingSubmissionLinkDTO[]
  attachment: RegionalMeetingSubmissionAttachmentDTO | null
  createdAt: string
}

export function serializeRegionalMeetingSubmission(
  submission: SubmissionEntity,
  view: 'admin'
): AdminRegionalMeetingSubmissionDTO {
  // Solo existe la vista admin: los aportes nunca se exponen públicamente.
  void view
  return {
    id: submission.id,
    firstName: submission.firstName,
    lastName: submission.lastName,
    email: submission.email,
    phone: submission.phone,
    provincia: submission.provincia,
    municipio: submission.municipio,
    organization: submission.organization,
    ejeTematico: submission.ejeTematico,
    subejeTematico: submission.subejeTematico,
    ideaProyecto: submission.ideaProyecto,
    comentarios: submission.comentarios,
    links: submission.links.map(link => ({
      id: link.id,
      url: link.url,
      title: link.title
    })),
    attachment: submission.attachmentAsset
      ? {
          filename: submission.attachmentAsset.originalFilename,
          mimeType: submission.attachmentAsset.mimeType,
          sizeBytes: submission.attachmentAsset.sizeBytes
        }
      : null,
    createdAt: submission.createdAt.toISOString()
  }
}
