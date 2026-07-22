import { CommentReactionSchema } from '#shared/schemas/comment'
import {
  commentWithRelationsInclude,
  getInstitutionName,
  loadCommentWithConsultation,
  resolveCommentAvatarUrl
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)

  const { comment, consultationId } = await loadCommentWithConsultation(event, 'id')

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  // Solo se reacciona sobre comentarios visibles.
  if (comment.moderationStatus !== 'visible') {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const body = await parseBody(event, CommentReactionSchema)

  // Idempotente por (comentario, usuario, tipo).
  await prisma.commentReaction.upsert({
    where: {
      commentId_userId_reactionType: {
        commentId: comment.id,
        userId,
        reactionType: body.reactionType
      }
    },
    update: {},
    create: {
      commentId: comment.id,
      userId,
      reactionType: body.reactionType
    }
  })

  const updated = await prisma.comment.findUniqueOrThrow({
    where: { id: comment.id },
    include: commentWithRelationsInclude
  })

  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(updated)

  setResponseStatus(event, 201)
  return serializeComment({ ...updated, authorAvatarUrl }, 'public', { currentUserId: userId, institutionName })
})
