import type {
  RegistrationParticipantCharacter,
  RegistrationParticipationMode
} from '../../../prisma/generated/enums'

export type ConsultationRegistrationView = 'admin'

type RegistrationQuestionEntity = {
  id: number
  body: string
  displayOrder: number
}

type RegistrationProofEntity = {
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

type RegistrationEntity = {
  id: number
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  character: RegistrationParticipantCharacter
  entityName: string | null
  entityAddress: string | null
  entityEmail: string | null
  entityPhone: string | null
  proofAssetId: number | null
  proofUrl: string | null
  participationMode: RegistrationParticipationMode | null
  presentationSummary: string | null
  documentationDetail: string | null
  createdAt: Date
  questions: RegistrationQuestionEntity[]
  proofAsset: RegistrationProofEntity | null
}

export interface ConsultationRegistrationProofDTO {
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

export interface AdminConsultationRegistrationDTO {
  id: number
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  character: RegistrationParticipantCharacter
  entityName: string | null
  entityAddress: string | null
  entityEmail: string | null
  entityPhone: string | null
  proofUrl: string | null
  proof: ConsultationRegistrationProofDTO | null
  participationMode: RegistrationParticipationMode | null
  presentationSummary: string | null
  documentationDetail: string | null
  questions: string[]
  createdAt: string
}

export function serializeConsultationRegistration(
  registration: RegistrationEntity,
  view: 'admin'
): AdminConsultationRegistrationDTO {
  // Solo existe la vista admin: las inscripciones nunca se exponen públicamente.
  void view
  return {
    id: registration.id,
    firstName: registration.firstName,
    lastName: registration.lastName,
    dni: registration.dni,
    email: registration.email,
    phone: registration.phone,
    character: registration.character,
    entityName: registration.entityName,
    entityAddress: registration.entityAddress,
    entityEmail: registration.entityEmail,
    entityPhone: registration.entityPhone,
    proofUrl: registration.proofUrl,
    proof: registration.proofAsset
      ? {
          filename: registration.proofAsset.originalFilename,
          mimeType: registration.proofAsset.mimeType,
          sizeBytes: registration.proofAsset.sizeBytes
        }
      : null,
    participationMode: registration.participationMode,
    presentationSummary: registration.presentationSummary,
    documentationDetail: registration.documentationDetail,
    questions: [...registration.questions]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(question => question.body),
    createdAt: registration.createdAt.toISOString()
  }
}
