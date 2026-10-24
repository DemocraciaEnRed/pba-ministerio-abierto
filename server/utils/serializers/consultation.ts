import type {
  ConsultationFormat,
  ResultsVisibility,
  Visibility,
  RegistrationEventMode
} from '../../../prisma/generated/enums'
import type { ParticipationState } from '../participation-state'
import { deriveParticipationState } from '../participation-state'
import { consultationPublicPath } from '#shared/utils/consultation-url'
import type { RegistrationState } from './consultationRegistrationForm'
import { resolveRegistrationState } from './consultationRegistrationForm'
import type { PublicRegionalMeetingDTO, RegionalMeetingEntity } from './regionalMeetingAgendaItem'
import { serializeRegionalMeeting } from './regionalMeetingAgendaItem'

export type ConsultationView = 'public' | 'admin'

type TaxonomyRelation = {
  id: number
  slug: string
  name: string
}

type ObservatoryWorkGroupRelation = TaxonomyRelation & {
  color: string
  iconColor: string
  icon: string
}

type ConsultationEntity = {
  id: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  visibility: Visibility
  featured: boolean
  startsAt: Date | null
  endsAt: Date | null
  publishedAt: Date | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: ResultsVisibility
  createdByUserId: number | null
  updatedByUserId: number | null
  createdAt: Date
  updatedAt: Date
  section?: TaxonomyRelation | null
  region?: TaxonomyRelation | null
  workGroupAssignments?: { workGroup: ObservatoryWorkGroupRelation }[]
  categoryAssignments?: { isPrimary: boolean, category: TaxonomyRelation }[]
  consultationTags?: { tag: TaxonomyRelation }[]
  /**
   * Formulario de inscripción; opcional, solo si el handler la incluye. Con
   * solo `id` indica presencia; con fechas y sede se arma el resumen público.
   */
  registrationForm?: ({ id: number } & Partial<RegistrationSummaryEntity>) | null
  /** Encuentro presencial (Encuentros Regionales); opcional, solo si el handler lo incluye. */
  regionalMeeting?: RegionalMeetingEntity | null
  /** URL de la portada resuelta por el handler (role `cover`); opcional. */
  coverUrl?: string | null
  /** Texto alternativo de la portada; opcional. */
  coverAltText?: string | null
  /** Cantidad de temas asociada por el handler; opcional. */
  topicsCount?: number | null
}

type RegistrationSummaryEntity = {
  eventAt: Date
  opensAt: Date
  closesAt: Date
  eventMode: RegistrationEventMode
  venueName: string | null
  venueCity: string | null
}

/**
 * Resumen del formulario de inscripción presencial para cards y agenda. El
 * detalle completo (cuerpo, dirección) se pide al endpoint del formulario.
 */
export interface ConsultationRegistrationSummaryDTO {
  /** Página pública de inscripción (`{publicPath}/inscripcion`). */
  path: string
  state: RegistrationState
  /** Fecha y hora del encuentro presencial. */
  eventAt: string
  opensAt: string
  closesAt: string
  venueName: string
  venueCity: string
  eventMode: RegistrationEventMode
}

export interface ConsultationTaxonomyDTO {
  id: number
  slug: string
  name: string
}

export interface ConsultationCategoryDTO extends ConsultationTaxonomyDTO {
  isPrimary: boolean
}

/** Incluye la presentación del grupo para pintar chips sin pedir el catálogo aparte. */
export interface ConsultationWorkGroupDTO extends ConsultationTaxonomyDTO {
  color: string
  iconColor: string
  icon: string
}

export interface PublicConsultationDTO {
  id: number
  slug: string
  /**
   * URL pública canónica (`/{seccion}/{id}/{nombre}`). Si el handler no cargó
   * la sección, cae en el enlace corto `/consultas/{id}`, que redirige.
   */
  publicPath: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  visibility: Visibility
  participationState: ParticipationState
  featured: boolean
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: ResultsVisibility
  section: ConsultationTaxonomyDTO | null
  region: ConsultationTaxonomyDTO | null
  observatoryWorkGroups: ConsultationWorkGroupDTO[]
  categories: ConsultationCategoryDTO[]
  tags: ConsultationTaxonomyDTO[]
  /** Portada para las cards públicas; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Cantidad de temas para la card; `null` cuando el handler no la calcula. */
  topicsCount: number | null
  /**
   * Inscripción presencial; `null` si no hay formulario o el handler no cargó
   * sus fechas.
   */
  registration: ConsultationRegistrationSummaryDTO | null
  /**
   * Encuentro presencial de Encuentros Regionales (lugar, fecha e inscripción
   * externa); `null` si no tiene o el handler no lo cargó.
   */
  regionalMeeting: PublicRegionalMeetingDTO | null
}

export interface AdminConsultationDTO extends PublicConsultationDTO {
  createdByUserId: number | null
  updatedByUserId: number | null
  createdAt: string
  updatedAt: string
  /**
   * Si la consulta ya tiene un formulario de inscripción cargado. Solo se
   * completa cuando el handler incluye la relación (p. ej. listado admin).
   */
  hasRegistrationForm?: boolean
}

export function serializeConsultation(consultation: ConsultationEntity, view: 'public'): PublicConsultationDTO
export function serializeConsultation(consultation: ConsultationEntity, view: 'admin'): AdminConsultationDTO
export function serializeConsultation(
  consultation: ConsultationEntity,
  view: ConsultationView
): PublicConsultationDTO | AdminConsultationDTO {
  const publicPath = consultationPublicPath(consultation)
  const base: PublicConsultationDTO = {
    id: consultation.id,
    slug: consultation.slug,
    publicPath,
    title: consultation.title,
    summary: consultation.summary,
    body: consultation.body,
    consultationFormat: consultation.consultationFormat,
    visibility: consultation.visibility,
    participationState: deriveParticipationState(consultation),
    featured: consultation.featured,
    startsAt: consultation.startsAt?.toISOString() ?? null,
    endsAt: consultation.endsAt?.toISOString() ?? null,
    publishedAt: consultation.publishedAt?.toISOString() ?? null,
    closedMessage: consultation.closedMessage,
    commentsEnabled: consultation.commentsEnabled,
    commentsGuidance: consultation.commentsGuidance,
    resultsVisibility: consultation.resultsVisibility,
    section: consultation.section
      ? {
          id: consultation.section.id,
          slug: consultation.section.slug,
          name: consultation.section.name
        }
      : null,
    region: consultation.region
      ? {
          id: consultation.region.id,
          slug: consultation.region.slug,
          name: consultation.region.name
        }
      : null,
    observatoryWorkGroups: (consultation.workGroupAssignments ?? []).map(assignment => ({
      id: assignment.workGroup.id,
      slug: assignment.workGroup.slug,
      name: assignment.workGroup.name,
      color: assignment.workGroup.color,
      iconColor: assignment.workGroup.iconColor,
      icon: assignment.workGroup.icon
    })),
    categories: (consultation.categoryAssignments ?? []).map(assignment => ({
      id: assignment.category.id,
      slug: assignment.category.slug,
      name: assignment.category.name,
      isPrimary: assignment.isPrimary
    })),
    tags: (consultation.consultationTags ?? []).map(consultationTag => ({
      id: consultationTag.tag.id,
      slug: consultationTag.tag.slug,
      name: consultationTag.tag.name
    })),
    coverUrl: consultation.coverUrl ?? null,
    coverAltText: consultation.coverAltText ?? null,
    topicsCount: consultation.topicsCount ?? null,
    registration: serializeRegistrationSummary(consultation.registrationForm, publicPath),
    regionalMeeting: consultation.regionalMeeting
      ? serializeRegionalMeeting(consultation.regionalMeeting, view === 'admin' ? 'admin' : 'public')
      : null
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    createdByUserId: consultation.createdByUserId,
    updatedByUserId: consultation.updatedByUserId,
    createdAt: consultation.createdAt.toISOString(),
    updatedAt: consultation.updatedAt.toISOString(),
    ...(consultation.registrationForm !== undefined
      ? { hasRegistrationForm: Boolean(consultation.registrationForm) }
      : {})
  }
}

function serializeRegistrationSummary(
  form: ConsultationEntity['registrationForm'],
  publicPath: string
): ConsultationRegistrationSummaryDTO | null {
  if (!form?.eventAt || !form.opensAt || !form.closesAt) return null

  return {
    path: `${publicPath}/inscripcion`,
    state: resolveRegistrationState({ opensAt: form.opensAt, closesAt: form.closesAt }),
    eventAt: form.eventAt.toISOString(),
    opensAt: form.opensAt.toISOString(),
    closesAt: form.closesAt.toISOString(),
    eventMode: form.eventMode ?? 'in_person',
    venueName: form.venueName ?? '',
    venueCity: form.venueCity ?? ''
  }
}
