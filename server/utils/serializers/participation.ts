import type { MechanismType, VoteValue } from '../../../prisma/generated/enums'

/**
 * DTOs de participación individual (respuesta de los endpoints POST).
 * Nunca se exponen participaciones de otros usuarios: solo la propia.
 */

export interface SupportParticipationDTO {
  id: number
  topicId: number
  userId: number
  createdAt: string
}

export interface VoteParticipationDTO {
  id: number
  topicId: number
  userId: number
  voteValue: VoteValue
  createdAt: string
}

export interface SurveyParticipationDTO {
  topicId: number
  userId: number
  surveyOptionIds: number[]
}

export type ParticipationDTO
  = | SupportParticipationDTO
    | VoteParticipationDTO
    | SurveyParticipationDTO

interface SupportEntity {
  id: number
  topicId: number
  userId: number
  createdAt: Date
}

interface VoteEntity {
  id: number
  topicId: number
  userId: number
  voteValue: VoteValue
  createdAt: Date
}

export function serializeSupportParticipation(entity: SupportEntity): SupportParticipationDTO {
  return {
    id: entity.id,
    topicId: entity.topicId,
    userId: entity.userId,
    createdAt: entity.createdAt.toISOString()
  }
}

export function serializeVoteParticipation(entity: VoteEntity): VoteParticipationDTO {
  return {
    id: entity.id,
    topicId: entity.topicId,
    userId: entity.userId,
    voteValue: entity.voteValue,
    createdAt: entity.createdAt.toISOString()
  }
}

export function serializeSurveyParticipationSet(
  topicId: number,
  userId: number,
  surveyOptionIds: number[]
): SurveyParticipationDTO {
  return {
    topicId,
    userId,
    surveyOptionIds
  }
}

/**
 * DTOs de resultados agregados (respuesta del endpoint GET results).
 *
 * `userParticipation` refleja cómo participó el usuario actual (null si no
 * participó o si no hay sesión). `aggregates` incluye conteos y porcentajes.
 * La visibilidad de `aggregates` se decide en el handler: los ciudadanos solo
 * ven agregados cuando la ventana cerró y el tema tiene
 * `publishResultsWhenParticipationEnds = true`; los
 * administradores los ven siempre.
 */

export interface VoteResultsAggregate {
  mechanismType: 'vote'
  totalParticipants: number
  counts: {
    inFavor: number
    abstain: number
    against: number
  }
  percentages: {
    inFavor: number
    abstain: number
    against: number
  }
}

export interface SupportResultsAggregate {
  mechanismType: 'support'
  totalParticipants: number
}

export interface SurveyOptionResult {
  optionId: number
  label: string
  count: number
  percentage: number
}

export interface SurveyResultsAggregate {
  mechanismType: 'survey'
  totalParticipants: number
  options: SurveyOptionResult[]
}

export type ResultsAggregate
  = | VoteResultsAggregate
    | SupportResultsAggregate
    | SurveyResultsAggregate

export interface TopicResultsDTO {
  topicId: number
  mechanismType: MechanismType | null
  resultsVisible: boolean
  userParticipation: ParticipationDTO | null
  aggregates: ResultsAggregate | null
}

function toPercentage(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 1000) / 10
}

export function buildVoteAggregate(
  counts: { inFavor: number, abstain: number, against: number }
): VoteResultsAggregate {
  const total = counts.inFavor + counts.abstain + counts.against
  return {
    mechanismType: 'vote',
    totalParticipants: total,
    counts,
    percentages: {
      inFavor: toPercentage(counts.inFavor, total),
      abstain: toPercentage(counts.abstain, total),
      against: toPercentage(counts.against, total)
    }
  }
}

export function buildSupportAggregate(totalParticipants: number): SupportResultsAggregate {
  return {
    mechanismType: 'support',
    totalParticipants
  }
}

export function buildSurveyAggregate(
  totalParticipants: number,
  options: { optionId: number, label: string, count: number }[]
): SurveyResultsAggregate {
  return {
    mechanismType: 'survey',
    totalParticipants,
    options: options.map(o => ({
      optionId: o.optionId,
      label: o.label,
      count: o.count,
      percentage: toPercentage(o.count, totalParticipants)
    }))
  }
}

/**
 * DTO del historial transversal de participaciones del usuario autenticado
 * (`GET /api/me/participations`). Solo incluye participaciones en temas
 * publicados de consultas visibles. `value` depende del mecanismo:
 * `voteValue` para votaciones, `surveyOptionId` para encuestas y `null` para
 * apoyos.
 */
export interface ParticipationHistoryItemDTO {
  type: MechanismType
  value: VoteValue | number | null
  createdAt: string
  topic: {
    id: number
    slug: string
    title: string
    mechanismType: MechanismType | null
  }
  consultation: {
    id: number
    slug: string
    title: string
  }
}

interface HistoryTopicRelation {
  id: number
  slug: string
  title: string
  mechanismType: MechanismType | null
  consultation: {
    id: number
    slug: string
    title: string
  }
}

function serializeHistoryTopic(topic: HistoryTopicRelation) {
  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      mechanismType: topic.mechanismType
    },
    consultation: {
      id: topic.consultation.id,
      slug: topic.consultation.slug,
      title: topic.consultation.title
    }
  }
}

export function serializeSupportHistoryItem(
  entity: { createdAt: Date, topic: HistoryTopicRelation }
): ParticipationHistoryItemDTO {
  return {
    type: 'support',
    value: null,
    createdAt: entity.createdAt.toISOString(),
    ...serializeHistoryTopic(entity.topic)
  }
}

export function serializeVoteHistoryItem(
  entity: { createdAt: Date, voteValue: VoteValue, topic: HistoryTopicRelation }
): ParticipationHistoryItemDTO {
  return {
    type: 'vote',
    value: entity.voteValue,
    createdAt: entity.createdAt.toISOString(),
    ...serializeHistoryTopic(entity.topic)
  }
}

export function serializeSurveyHistoryItem(
  entity: { createdAt: Date, surveyOptionId: number, topic: HistoryTopicRelation }
): ParticipationHistoryItemDTO {
  return {
    type: 'survey',
    value: entity.surveyOptionId,
    createdAt: entity.createdAt.toISOString(),
    ...serializeHistoryTopic(entity.topic)
  }
}
