import type {
  RegistrationParticipantCharacter,
  RegistrationParticipationMode,
  RegistrationAttendanceMode,
  RegistrationInstitutionSource
} from '../../../prisma/generated/enums'
import type { RegistrationConfirmation } from '#shared/data/consultation-registrations'

export type ConsultationRegistrationView = 'admin'

export function serializeRegistrationConfirmation(confirmation: RegistrationConfirmation): RegistrationConfirmation {
  return {
    consultationId: confirmation.consultationId,
    attendanceMode: confirmation.attendanceMode,
    meetingUrl: confirmation.attendanceMode === 'virtual' ? confirmation.meetingUrl : null,
    emailSent: confirmation.emailSent
  }
}

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
  attendanceMode: RegistrationAttendanceMode | null
  institutionSource: RegistrationInstitutionSource | null
  institutionId: number | null
  institutionName: string | null
  institutionCategoryName: string | null
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
  attendanceMode: RegistrationAttendanceMode | null
  institutionSource: RegistrationInstitutionSource | null
  institutionId: number | null
  institutionName: string | null
  institutionCategoryName: string | null
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
    attendanceMode: registration.attendanceMode,
    institutionSource: registration.institutionSource,
    institutionId: registration.institutionId,
    institutionName: registration.institutionName,
    institutionCategoryName: registration.institutionCategoryName,
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
