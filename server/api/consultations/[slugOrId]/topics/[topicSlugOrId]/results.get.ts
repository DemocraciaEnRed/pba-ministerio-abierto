import { hasParticipationWindowClosed } from '~~/server/utils/topics/participation-window'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import {
  serializeSupportParticipation,
  serializeVoteParticipation,
  serializeSurveyParticipationSet,
  buildSupportAggregate,
  buildVoteAggregate,
  buildSurveyAggregate,
  type ParticipationDTO,
  type ResultsAggregate,
  type TopicResultsDTO
} from '~~/server/utils/serializers/participation'

export default defineEventHandler(async (event): Promise<TopicResultsDTO> => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      consultationId: true,
      visibility: true,
      mechanismType: true,
      publishResultsWhenParticipationEnds: true,
      participationStartsAt: true,
      participationEndsAt: true
    }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({ statusCode: 404, message: 'Tema no encontrado' })
  }

  const isAdmin = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  // Un tema no visible no existe para el ciudadano.
  if (!isAdmin && topic.visibility === 'hidden') {
    throw createError({ statusCode: 404, message: 'Tema no encontrado' })
  }

  // Participación propia del usuario actual (null si no hay sesión o no participó).
  const userParticipation = ctx.user && topic.mechanismType
    ? await loadUserParticipation(topic.id, topic.mechanismType, ctx.user.id)
    : null

  // Los administradores ven agregados siempre; los ciudadanos solo si la ventana
  // de participación cerró y el tema está configurado para publicar resultados
  // automáticamente al cierre.
  const windowClosed = hasParticipationWindowClosed(topic, consultation)
  const resultsVisible = isAdmin || (topic.publishResultsWhenParticipationEnds && windowClosed)

  const aggregates = resultsVisible && topic.mechanismType
    ? await buildAggregates(topic.id, topic.mechanismType)
    : null

  return {
    topicId: topic.id,
    mechanismType: topic.mechanismType,
    resultsVisible,
    userParticipation,
    aggregates
  }
})

async function loadUserParticipation(
  topicId: number,
  mechanismType: string,
  userId: number
): Promise<ParticipationDTO | null> {
  if (mechanismType === 'support') {
    const support = await prisma.supportParticipation.findUnique({
      where: { topicId_userId: { topicId, userId } }
    })
    return support ? serializeSupportParticipation(support) : null
  }

  if (mechanismType === 'vote') {
    const vote = await prisma.voteParticipation.findUnique({
      where: { topicId_userId: { topicId, userId } }
    })
    return vote ? serializeVoteParticipation(vote) : null
  }

  const survey = await prisma.surveyParticipation.findMany({
    where: { topicId, userId },
    select: { surveyOptionId: true }
  })
  return survey.length
    ? serializeSurveyParticipationSet(topicId, userId, survey.map(row => row.surveyOptionId))
    : null
}

async function buildAggregates(
  topicId: number,
  mechanismType: string
): Promise<ResultsAggregate> {
  if (mechanismType === 'support') {
    const total = await prisma.supportParticipation.count({ where: { topicId } })
    return buildSupportAggregate(total)
  }

  if (mechanismType === 'vote') {
    const grouped = await prisma.voteParticipation.groupBy({
      by: ['voteValue'],
      where: { topicId },
      _count: { _all: true }
    })

    const counts = { inFavor: 0, abstain: 0, against: 0 }
    for (const row of grouped) {
      if (row.voteValue === 'in_favor') counts.inFavor = row._count._all
      else if (row.voteValue === 'abstain') counts.abstain = row._count._all
      else if (row.voteValue === 'against') counts.against = row._count._all
    }

    return buildVoteAggregate(counts)
  }

  // survey
  const options = await prisma.surveyOption.findMany({
    where: { topicId },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      label: true,
      _count: { select: { surveyParticipations: true } }
    }
  })

  // Participantes distintos: en selección múltiple una persona puede elegir varias
  // opciones, así que los participantes no son la suma de conteos por opción.
  const distinctUsers = await prisma.surveyParticipation.findMany({
    where: { topicId },
    distinct: ['userId'],
    select: { userId: true }
  })

  return buildSurveyAggregate(
    distinctUsers.length,
    options.map(o => ({
      optionId: o.id,
      label: o.label,
      count: o._count.surveyParticipations
    }))
  )
}
