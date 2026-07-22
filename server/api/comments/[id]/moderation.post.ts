import { ModerateCommentSchema } from '#shared/schemas/comment'
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

  await assertCan(ctx, 'moderate', { type: 'consultation', id: consultationId })

  const body = await parseBody(event, ModerateCommentSchema)

  // El borrado es final: no se revierte desde moderación.
  if (comment.moderationStatus === 'deleted') {
    throw createError({
      statusCode: 409,
      message: 'Un comentario borrado no puede volver a moderarse'
    })
  }

  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { moderationStatus: body.moderationStatus },
    include: commentWithRelationsInclude
  })

  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(updated)

  return serializeComment({ ...updated, authorAvatarUrl }, 'admin', { currentUserId: ctx.user!.id, institutionName })
})
