import { MyParticipationsQuerySchema } from '#shared/schemas/participation'
import {
  serializeSupportHistoryItem,
  serializeVoteHistoryItem,
  serializeSurveyHistoryItem,
  type ParticipationHistoryItemDTO
} from '~~/server/utils/serializers/participation'

// Solo se listan participaciones en temas visibles de consultas visibles
// públicamente (no ocultas).
const visibleTopicWhere = {
  visibility: 'visible' as const,
  consultation: {
    visibility: { not: 'hidden' as const }
  }
}

const topicInclude = {
  topic: {
    select: {
      id: true,
      slug: true,
      title: true,
      mechanismType: true,
      consultation: {
        select: { id: true, slug: true, title: true }
      }
    }
  }
} as const

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, MyParticipationsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'self' })

  const userId = ctx.user!.id
  const where = { userId, topic: visibleTopicWhere }

  const [supports, votes, surveys] = await Promise.all([
    prisma.supportParticipation.findMany({ where, include: topicInclude }),
    prisma.voteParticipation.findMany({ where, include: topicInclude }),
    prisma.surveyParticipation.findMany({ where, include: topicInclude })
  ])

  const items: ParticipationHistoryItemDTO[] = [
    ...supports.map(serializeSupportHistoryItem),
    ...votes.map(serializeVoteHistoryItem),
    ...surveys.map(serializeSurveyHistoryItem)
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = items.length
  const skip = (query.page - 1) * query.perPage
  const pageItems = items.slice(skip, skip + query.perPage)

  return {
    items: pageItems,
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
