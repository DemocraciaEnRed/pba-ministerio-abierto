import { RepliesQuerySchema } from '#shared/schemas/comment'
import {
  commentWithRelationsInclude,
  getInstitutionName,
  resolveCommentAvatarUrls
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'

/**
 * Lista paginada de respuestas visibles de un comentario de primer nivel.
 * Las respuestas se cargan bajo demanda (5 por página, botón "cargar más")
 * para no anidar todo el hilo en el listado principal.
 */
export default defineEventHandler(async (event) => {
  const commentId = parsePositiveIntParam(event, 'id', 'comentario')
  const ctx = await getAuthContext(event)

  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      parentCommentId: true,
      moderationStatus: true,
      consultationId: true,
      topicId: true,
      consultation: { select: { visibility: true } },
      topic: {
        select: {
          visibility: true,
          consultationId: true,
          consultation: { select: { visibility: true } }
        }
      }
    }
  })

  if (!parent) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const consultationId = parent.consultationId ?? parent.topic?.consultationId

  if (!consultationId) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const isAdmin = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  const consultationVisibility = parent.consultation?.visibility
    ?? parent.topic?.consultation?.visibility
  const isPubliclyVisible = consultationVisibility !== 'hidden'
    && parent.topic?.visibility !== 'hidden'

  // Para el ciudadano, un comentario oculto o de un contenedor no visible no existe.
  if (!isAdmin && (!isPubliclyVisible || parent.moderationStatus !== 'visible')) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const query = await parseQuery(event, RepliesQuerySchema)
  const skip = (query.page - 1) * query.perPage

  const where = { parentCommentId: commentId, moderationStatus: 'visible' as const }

  const [replies, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: commentWithRelationsInclude,
      orderBy: { createdAt: query.order === 'recent' ? 'desc' : 'asc' },
      skip,
      take: query.perPage
    }),
    prisma.comment.count({ where })
  ])

  const currentUserId = ctx.user?.id ?? null
  const institutionName = await getInstitutionName()
  const avatarUrls = await resolveCommentAvatarUrls(replies)

  return {
    items: replies.map(reply => serializeComment(
      { ...reply, authorAvatarUrl: avatarUrls.get(reply.id) ?? null },
      'public',
      { currentUserId, institutionName }
    )),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
