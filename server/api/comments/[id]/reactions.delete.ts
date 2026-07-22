import { CommentReactionSchema } from '#shared/schemas/comment'
import { loadCommentWithConsultation } from '~~/server/utils/comments'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)

  const { comment, consultationId } = await loadCommentWithConsultation(event, 'id')

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const body = await parseBody(event, CommentReactionSchema)

  await prisma.commentReaction.deleteMany({
    where: {
      commentId: comment.id,
      userId,
      reactionType: body.reactionType
    }
  })

  setResponseStatus(event, 204)
  return null
})
