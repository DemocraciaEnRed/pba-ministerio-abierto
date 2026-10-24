import { parseTopicSlugOrId, resolveTopicBySlugOrId } from '~~/server/utils/topics/slug'
import { CommentsThreadQuerySchema, TopicCommentsModerationQuerySchema } from '#shared/schemas/comment'
import {
  assertCommentsVisible,
  commentWithRelationsInclude,
  countVisibleReplies,
  getInstitutionName,
  resolveCommentAvatarUrls
} from '~~/server/utils/comments'
import {
  buildModerationOrderBy,
  buildModerationWhere,
  countRepliesByStatus,
  EMPTY_REPLY_COUNTS
} from '~~/server/utils/comments/moderation-query'
import { serializeComment } from '~~/server/utils/serializers/comment'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/resolve'

function isPubliclyVisibleConsultation(consultation: { visibility: string }): boolean {
  return consultation.visibility !== 'hidden'
}

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicIdentifier = parseTopicSlugOrId(event, 'topicSlugOrId')
  const ctx = await getAuthContext(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, visibility: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  const topic = await resolveTopicBySlugOrId(consultationId, topicIdentifier)

  if (topic.consultationId !== consultationId) {
    throw createError({ statusCode: 404, message: 'Tema no encontrado' })
  }

  const isAdmin = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  const currentUserId = ctx.user?.id ?? null
  const institutionName = await getInstitutionName()

  // `view=thread` fuerza el hilo público anidado incluso para administradores,
  // que por defecto reciben la bandeja de moderación en esta misma URL.
  const { view } = await parseQuery(event, CommentsThreadQuerySchema)

  // Bandeja de moderación del tema: todos los comentarios del tema (o solo los
  // hilos con `level=top`), con filtros de contenido, estado y paginación.
  if (isAdmin && view !== 'thread') {
    const query = await parseQuery(event, TopicCommentsModerationQuerySchema)

    const where = buildModerationWhere({ topicId: topic.id }, query)
    const skip = (query.page - 1) * query.perPage

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: commentWithRelationsInclude,
        orderBy: buildModerationOrderBy(query.order),
        skip,
        take: query.perPage
      }),
      prisma.comment.count({ where })
    ])

    const replyCounts = query.level === 'top'
      ? await countRepliesByStatus(comments.map(comment => comment.id))
      : null
    const avatarUrls = await resolveCommentAvatarUrls(comments)

    return {
      items: comments.map(comment => serializeComment(
        {
          ...comment,
          authorAvatarUrl: avatarUrls.get(comment.id) ?? null,
          ...(replyCounts ? { replyCounts: replyCounts.get(comment.id) ?? EMPTY_REPLY_COUNTS } : {})
        },
        'admin',
        { currentUserId, institutionName }
      )),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage)
      }
    }
  }

  // Para el ciudadano, un tema no visible o una consulta no visible no existen.
  if (!isAdmin && (!isPubliclyVisibleConsultation(consultation) || topic.visibility === 'hidden')) {
    throw createError({ statusCode: 404, message: 'Tema no encontrado' })
  }

  assertCommentsVisible(topic, 'topic')

  // Solo comentarios de primer nivel: las respuestas se cargan bajo demanda y
  // paginadas desde `GET /api/comments/:id/replies`.
  const comments = await prisma.comment.findMany({
    where: {
      topicId: topic.id,
      parentCommentId: null,
      moderationStatus: 'visible'
    },
    include: commentWithRelationsInclude,
    orderBy: { createdAt: 'asc' }
  })

  const replyCounts = await countVisibleReplies(comments.map(comment => comment.id))
  const avatarUrls = await resolveCommentAvatarUrls(comments)

  return comments.map(comment => serializeComment(
    {
      ...comment,
      replyCount: replyCounts.get(comment.id) ?? 0,
      authorAvatarUrl: avatarUrls.get(comment.id) ?? null
    },
    'public',
    { currentUserId, institutionName }
  ))
})
