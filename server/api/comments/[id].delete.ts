import { loadCommentWithConsultation } from '~~/server/utils/comments'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)

  const { comment, consultationId } = await loadCommentWithConsultation(event, 'id')

  await assertCan(ctx, 'moderate', { type: 'consultation', id: consultationId })

  // Soft-delete final: se marca como borrado y se registra quién y cuándo.
  // Idempotente: borrar un comentario ya borrado no cambia el resultado.
  if (comment.moderationStatus !== 'deleted') {
    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        moderationStatus: 'deleted',
        deletedAt: new Date(),
        deletedByUserId: ctx.user!.id
      }
    })
  }

  setResponseStatus(event, 204)
  return null
})
