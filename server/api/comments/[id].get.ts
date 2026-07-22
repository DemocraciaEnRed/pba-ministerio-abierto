import {
  commentWithRelationsInclude,
  getInstitutionName,
  resolveCommentAvatarUrl
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'

export default defineEventHandler(async (event) => {
  const commentId = parsePositiveIntParam(event, 'id', 'comentario')
  const ctx = await getAuthContext(event)

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      ...commentWithRelationsInclude,
      topic: { select: { consultationId: true, title: true, slug: true } }
    }
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const consultationId = comment.consultationId ?? comment.topic?.consultationId
  if (!consultationId) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const isAdmin = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  // Para el público, un comentario no visible no existe.
  if (!isAdmin && comment.moderationStatus !== 'visible') {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const currentUserId = ctx.user?.id ?? null
  const institutionName = await getInstitutionName()
  const authorAvatarUrl = await resolveCommentAvatarUrl(comment)
  const withAvatar = { ...comment, authorAvatarUrl }

  return isAdmin
    ? serializeComment(withAvatar, 'admin', { currentUserId, institutionName })
    : serializeComment(withAvatar, 'public', { currentUserId, institutionName })
})
