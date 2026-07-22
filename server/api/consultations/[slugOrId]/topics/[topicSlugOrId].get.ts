import { parseTopicSlugOrId, resolveTopicBySlugOrId } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicIdentifier = parseTopicSlugOrId(event, 'topicSlugOrId')
  const ctx = await getAuthContext(event)

  // Verify consultation exists
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const topic = await resolveTopicBySlugOrId(
    consultationId,
    topicIdentifier,
    {
      topicTags: { select: { tagId: true } },
      supportParticipations: { select: { id: true } },
      voteParticipations: { select: { voteValue: true } },
      surveyParticipations: { select: { id: true } }
    }
  )

  // Check authorization
  const isAdmin = ctx.isPlatformAdmin
    || await prisma.consultationMembership.findFirst({
      where: {
        userId: ctx.user?.id ?? -1,
        consultationId
      }
    }) !== null

  const isPublic = topic.visibility !== 'hidden'

  if (!isAdmin && !isPublic) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  return isAdmin
    ? { ...serializeTopic(topic as any, 'admin'), canManage: true } // eslint-disable-line @typescript-eslint/no-explicit-any
    : { ...serializeTopic(topic as any, 'public'), canManage: false } // eslint-disable-line @typescript-eslint/no-explicit-any
})
