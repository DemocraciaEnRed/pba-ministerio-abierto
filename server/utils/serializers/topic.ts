import type {
  MechanismType,
  Visibility
} from '../../../prisma/generated/enums'
import type { ParticipationState } from '../participation-state'
import { deriveParticipationState } from '../participation-state'

export type TopicView = 'public' | 'admin'

type TopicEntity = {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  questionText: string | null
  displayOrder: number
  participationStartsAt: Date | null
  participationEndsAt: Date | null
  visibility: Visibility
  mechanismType: MechanismType | null
  voteAllowAbstain: boolean
  surveyMinSelections: number
  surveyMaxSelections: number | null
  publishResultsWhenParticipationEnds: boolean
  configLockedAt: Date | null
  createdAt: Date
  updatedAt: Date
  /** URL de la portada resuelta por el handler (role `cover`); opcional. */
  coverUrl?: string | null
  /** Texto alternativo de la portada; opcional. */
  coverAltText?: string | null
}

export interface PublicTopicDTO {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  questionText: string | null
  displayOrder: number
  participationStartsAt: string | null
  participationEndsAt: string | null
  visibility: Visibility
  mechanismType: MechanismType | null
  voteAllowAbstain: boolean
  surveyMinSelections: number
  surveyMaxSelections: number | null
  participationState: ParticipationState
  participationOpen: boolean
  /** Portada para las cards públicas; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
}

export interface AdminTopicDTO extends PublicTopicDTO {
  publishResultsWhenParticipationEnds: boolean
  configLockedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Calcula si la participación está abierta para un tema.
 * Requiere que el tema esté visible (no oculto/archivado)
 * y que ahora esté dentro de la ventana de participación.
 */
export function isTopicParticipationOpen(topic: TopicEntity, now: Date = new Date()): boolean {
  // Sin un mecanismo seleccionado no hay forma de participar.
  if (!topic.mechanismType) {
    return false
  }

  if (topic.visibility !== 'visible') {
    return false
  }

  if (topic.participationStartsAt && now < topic.participationStartsAt) {
    return false
  }

  if (topic.participationEndsAt && now >= topic.participationEndsAt) {
    return false
  }

  return true
}

export function serializeTopic(topic: TopicEntity, view: 'public'): PublicTopicDTO
export function serializeTopic(topic: TopicEntity, view: 'admin'): AdminTopicDTO
export function serializeTopic(
  topic: TopicEntity,
  view: TopicView
): PublicTopicDTO | AdminTopicDTO {
  const participationOpen = isTopicParticipationOpen(topic)

  const base: PublicTopicDTO = {
    id: topic.id,
    consultationId: topic.consultationId,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary,
    body: topic.body,
    questionText: topic.questionText,
    displayOrder: topic.displayOrder,
    participationStartsAt: topic.participationStartsAt?.toISOString() ?? null,
    participationEndsAt: topic.participationEndsAt?.toISOString() ?? null,
    visibility: topic.visibility,
    mechanismType: topic.mechanismType,
    voteAllowAbstain: topic.voteAllowAbstain,
    surveyMinSelections: topic.surveyMinSelections,
    surveyMaxSelections: topic.surveyMaxSelections,
    participationState: deriveParticipationState({
      startsAt: topic.participationStartsAt,
      endsAt: topic.participationEndsAt
    }),
    participationOpen,
    coverUrl: topic.coverUrl ?? null,
    coverAltText: topic.coverAltText ?? null
  }

  if (view === 'public') {
    return base
  }

  return {
    ...base,
    publishResultsWhenParticipationEnds: topic.publishResultsWhenParticipationEnds,
    configLockedAt: topic.configLockedAt?.toISOString() ?? null,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString()
  }
}
