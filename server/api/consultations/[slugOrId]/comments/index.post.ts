import {
  assertConsultationCommentingOpen,
  assertValidParent,
  commentWithRelationsInclude,
  getInstitutionName,
  parseCommentInput,
  persistCommentAttachment,
  resolveAuthorMode,
  resolveCommentAvatarUrl
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { data: body, attachment } = await parseCommentInput(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, visibility: true, commentsEnabled: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  assertConsultationCommentingOpen(consultation)

  const authorMode = await resolveAuthorMode(ctx, consultationId, body.authorMode)

  if (body.parentCommentId !== null) {
    await assertValidParent(body.parentCommentId, { consultationId, topicId: null })
  }

  const attachmentAssetId = attachment ? await persistCommentAttachment(attachment, userId) : null

  const comment = await prisma.comment.create({
    data: {
      consultationId,
      topicId: null,
      authorUserId: userId,
      parentCommentId: body.parentCommentId,
      body: body.body,
      authorMode,
      attachmentAssetId
    },
    include: commentWithRelationsInclude
  })

  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(comment)

  setResponseStatus(event, 201)
  return serializeComment({ ...comment, authorAvatarUrl }, 'public', { currentUserId: userId, institutionName })
})
