import { CreateCommentSchema } from '#shared/schemas/comment'
import { parseTopicSlugOrId, resolveTopicBySlugOrId } from '~~/server/utils/topics/slug'
import {
  assertTopicCommentingOpen,
  assertValidParent,
  commentWithRelationsInclude,
  getInstitutionName,
  resolveAuthorMode,
  resolveCommentAvatarUrl
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicIdentifier = parseTopicSlugOrId(event, 'topicSlugOrId')
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const body = await parseBody(event, CreateCommentSchema)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, visibility: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  const topic = await resolveTopicBySlugOrId(consultationId, topicIdentifier)

  if (topic.consultationId !== consultationId) {
    throw createError({ statusCode: 404, message: 'Tema no encontrado' })
  }

  assertTopicCommentingOpen(topic, consultation)

  const authorMode = await resolveAuthorMode(ctx, consultationId, body.authorMode)

  if (body.parentCommentId !== null) {
    await assertValidParent(body.parentCommentId, { consultationId: null, topicId: topic.id })
  }

  const comment = await prisma.comment.create({
    data: {
      consultationId: null,
      topicId: topic.id,
      authorUserId: userId,
      parentCommentId: body.parentCommentId,
      body: body.body,
      authorMode
    },
    include: commentWithRelationsInclude
  })

  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(comment)

  setResponseStatus(event, 201)
  return serializeComment({ ...comment, authorAvatarUrl }, 'public', { currentUserId: userId, institutionName })
})
