import type { Visibility } from '../../../prisma/generated/enums'
import type { ParticipationState } from '../participation-state'
import { deriveParticipationState } from '../participation-state'
import { consultationPublicPath } from '#shared/utils/consultation-url'
import { regionalMeetingYear } from '#shared/utils/regional-meetings'
import type { RegistrationState } from './consultationRegistrationForm'
import { resolveRegistrationState } from './consultationRegistrationForm'

export type RegionalMeetingAgendaItemView = 'public' | 'admin'

export type RegionalMeetingEntity = {
  id: number
  location: string
  heldAt: Date
  registrationUrl: string | null
  registrationOpensAt: Date | null
  registrationClosesAt: Date | null
}

type AgendaRegionEntity = {
  id: number
  slug: string
  name: string
}

type AgendaConsultationEntity = {
  id: number
  slug: string
  title: string
  visibility: Visibility
  startsAt: Date | null
  endsAt: Date | null
  section?: { slug: string } | null
  region: AgendaRegionEntity | null
}

export type RegionalMeetingAgendaItemEntity = RegionalMeetingEntity & {
  consultation: AgendaConsultationEntity
}

/**
 * Datos del encuentro presencial embebidos en la consulta. En la vista pública
 * la URL de inscripción solo se expone mientras la ventana está abierta.
 */
export interface PublicRegionalMeetingDTO {
  location: string
  heldAt: string
  year: number
  registrationUrl: string | null
  registrationOpensAt: string | null
  registrationClosesAt: string | null
  /** `null` cuando el encuentro no tiene inscripción. */
  registrationState: RegistrationState | null
}

export type AdminRegionalMeetingDTO = PublicRegionalMeetingDTO

export interface AgendaItemRegionDTO {
  id: number
  slug: string
  name: string
}

export interface PublicRegionalMeetingAgendaItemDTO extends PublicRegionalMeetingDTO {
  id: number
  region: AgendaItemRegionDTO | null
  consultation: {
    id: number
    title: string
    publicPath: string
    participationState: ParticipationState
  }
}

export interface AdminRegionalMeetingAgendaItemDTO extends PublicRegionalMeetingAgendaItemDTO {
  consultation: PublicRegionalMeetingAgendaItemDTO['consultation'] & {
    visibility: Visibility
  }
}

export function serializeRegionalMeeting(item: RegionalMeetingEntity, view: 'public'): PublicRegionalMeetingDTO
export function serializeRegionalMeeting(item: RegionalMeetingEntity, view: 'admin'): AdminRegionalMeetingDTO
export function serializeRegionalMeeting(item: RegionalMeetingEntity, view: RegionalMeetingAgendaItemView): PublicRegionalMeetingDTO | AdminRegionalMeetingDTO
export function serializeRegionalMeeting(
  item: RegionalMeetingEntity,
  view: RegionalMeetingAgendaItemView
): PublicRegionalMeetingDTO | AdminRegionalMeetingDTO {
  const registrationState = item.registrationUrl && item.registrationOpensAt && item.registrationClosesAt
    ? resolveRegistrationState({ opensAt: item.registrationOpensAt, closesAt: item.registrationClosesAt })
    : null

  return {
    location: item.location,
    heldAt: item.heldAt.toISOString(),
    year: regionalMeetingYear(item.heldAt),
    registrationUrl: view === 'admin' || registrationState === 'open' ? item.registrationUrl : null,
    registrationOpensAt: item.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: item.registrationClosesAt?.toISOString() ?? null,
    registrationState
  }
}

export function serializeRegionalMeetingAgendaItem(item: RegionalMeetingAgendaItemEntity, view: 'public'): PublicRegionalMeetingAgendaItemDTO
export function serializeRegionalMeetingAgendaItem(item: RegionalMeetingAgendaItemEntity, view: 'admin'): AdminRegionalMeetingAgendaItemDTO
export function serializeRegionalMeetingAgendaItem(
  item: RegionalMeetingAgendaItemEntity,
  view: RegionalMeetingAgendaItemView
): PublicRegionalMeetingAgendaItemDTO | AdminRegionalMeetingAgendaItemDTO {
  const { consultation } = item
  const region = consultation.region
    ? { id: consultation.region.id, slug: consultation.region.slug, name: consultation.region.name }
    : null
  const consultationBase = {
    id: consultation.id,
    title: consultation.title,
    publicPath: consultationPublicPath(consultation),
    participationState: deriveParticipationState(consultation)
  }

  if (view === 'public') {
    return {
      id: item.id,
      ...serializeRegionalMeeting(item, 'public'),
      region,
      consultation: consultationBase
    }
  }

  return {
    id: item.id,
    ...serializeRegionalMeeting(item, 'admin'),
    region,
    consultation: { ...consultationBase, visibility: consultation.visibility }
  }
}
