import {
  assertConsultationCommentingOpen,
  assertValidParent,
  buildCommentAttachmentCreates,
  commentWithRelationsInclude,
  getInstitutionName,
  parseCommentInput,
  resolveAuthorMode,
  resolveCommentAvatarUrl
} from '~~/server/utils/comments'
import { withStoredAttachments } from '~~/server/utils/assets/multi-attachments'
import { serializeComment } from '~~/server/utils/serializers/comment'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/resolve'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { data: body, attachments } = await parseCommentInput(event)

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

  const comment = await withStoredAttachments(attachments, stored => prisma.comment.create({
    data: {
      consultationId,
      topicId: null,
      authorUserId: userId,
      parentCommentId: body.parentCommentId,
      body: body.body,
      authorMode,
      attachments: buildCommentAttachmentCreates(stored, userId)
    },
    include: commentWithRelationsInclude
  }))

  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(comment)

  setResponseStatus(event, 201)
  return serializeComment({ ...comment, authorAvatarUrl }, 'public', { currentUserId: userId, institutionName })
})
