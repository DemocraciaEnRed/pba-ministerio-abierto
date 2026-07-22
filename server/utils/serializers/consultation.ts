import type {
  ConsultationFormat,
  ResultsVisibility,
  Visibility
} from '../../../prisma/generated/enums'
import type { ParticipationState } from '../participation-state'
import { deriveParticipationState } from '../participation-state'

export type ConsultationView = 'public' | 'admin'

type TaxonomyRelation = {
  id: number
  slug: string
  name: string
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
  resultsVisibility: ResultsVisibility
  createdByUserId: number | null
  updatedByUserId: number | null
  createdAt: Date
  updatedAt: Date
  section?: TaxonomyRelation | null
  categoryAssignments?: { isPrimary: boolean, category: TaxonomyRelation }[]
  consultationTags?: { tag: TaxonomyRelation }[]
  topics?: TopicSummaryRelation[]
  /** URL de la portada resuelta por el handler (role `cover`); opcional. */
  coverUrl?: string | null
  /** Texto alternativo de la portada; opcional. */
  coverAltText?: string | null
  /** Cantidad de temas asociada por el handler; opcional. */
  topicsCount?: number | null
}

type TopicSummaryRelation = {
  id: number
  slug: string
  title: string
  visibility: Visibility
  participationStartsAt: Date | null
  participationEndsAt: Date | null
}

export interface ConsultationTaxonomyDTO {
  id: number
  slug: string
  name: string
}

export interface ConsultationCategoryDTO extends ConsultationTaxonomyDTO {
  isPrimary: boolean
}

export interface PublicConsultationDTO {
  id: number
  slug: string
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
  resultsVisibility: ResultsVisibility
  section: ConsultationTaxonomyDTO | null
  categories: ConsultationCategoryDTO[]
  tags: ConsultationTaxonomyDTO[]
  /** Portada para las cards públicas; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Cantidad de temas para la card; `null` cuando el handler no la calcula. */
  topicsCount: number | null
}

/**
 * Resumen liviano de un tema para las vistas de agregación admin (listado de
 * consultas). Solo incluye lo necesario para un pantallazo: identidad, estado
 * de visibilidad y el estado temporal derivado de sus fechas de participación.
 */
export interface ConsultationTopicSummaryDTO {
  id: number
  slug: string
  title: string
  visibility: Visibility
  participationState: ParticipationState
}

export interface AdminConsultationDTO extends PublicConsultationDTO {
  createdByUserId: number | null
  updatedByUserId: number | null
  createdAt: string
  updatedAt: string
  /**
   * Temas embebidos. Solo se completa cuando el handler los incluye
   * explícitamente (p. ej. el endpoint de listado admin); en el resto de las
   * vistas admin permanece `undefined`.
   */
  topics?: ConsultationTopicSummaryDTO[]
}

export function serializeConsultation(consultation: ConsultationEntity, view: 'public'): PublicConsultationDTO
export function serializeConsultation(consultation: ConsultationEntity, view: 'admin'): AdminConsultationDTO
export function serializeConsultation(
  consultation: ConsultationEntity,
  view: ConsultationView
): PublicConsultationDTO | AdminConsultationDTO {
  const base: PublicConsultationDTO = {
    id: consultation.id,
    slug: consultation.slug,
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
    resultsVisibility: consultation.resultsVisibility,
    section: consultation.section
      ? {
          id: consultation.section.id,
          slug: consultation.section.slug,
          name: consultation.section.name
        }
      : null,
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
    topicsCount: consultation.topicsCount ?? null
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
    ...(consultation.topics
      ? {
          topics: consultation.topics.map(topic => ({
            id: topic.id,
            slug: topic.slug,
            title: topic.title,
            visibility: topic.visibility,
            participationState: deriveParticipationState({
              startsAt: topic.participationStartsAt,
              endsAt: topic.participationEndsAt
            })
          }))
        }
      : {})
  }
}
