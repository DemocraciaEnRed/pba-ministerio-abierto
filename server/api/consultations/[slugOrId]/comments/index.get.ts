import { CommentsModerationQuerySchema, CommentsThreadQuerySchema } from '#shared/schemas/comment'
import {
  commentWithRelationsInclude,
  countVisibleReplies,
  getInstitutionName,
  resolveCommentAvatarUrls
} from '~~/server/utils/comments'
import { serializeComment } from '~~/server/utils/serializers/comment'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

function isPubliclyVisibleConsultation(consultation: { visibility: string }): boolean {
  return consultation.visibility !== 'hidden'
}

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const ctx = await getAuthContext(event)

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, visibility: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  const isAdmin = ctx.isPlatformAdmin
    || (ctx.user ? await ctx.isConsultationAdmin(consultationId) : false)

  const institutionName = await getInstitutionName()
  const currentUserId = ctx.user?.id ?? null

  // `view=thread` fuerza el hilo público anidado incluso para administradores,
  // que por defecto reciben la bandeja de moderación en esta misma URL.
  const { view } = await parseQuery(event, CommentsThreadQuerySchema)

  // Bandeja de moderación: todos los comentarios de la consulta y sus temas,
  // con filtros por alcance, tema y estado de moderación.
  if (isAdmin && view !== 'thread') {
    const query = await parseQuery(event, CommentsModerationQuerySchema)

    let containerWhere
    if (query.scope === 'consultation') {
      containerWhere = { consultationId }
    } else if (query.scope === 'topic') {
      if (query.topicId === undefined) {
        throw createError({
          statusCode: 422,
          message: VALIDATION_ERROR_MESSAGE,
          data: [{ field: 'topicId', message: 'Indicá el tema a filtrar' }]
        })
      }
      const topic = await prisma.topic.findFirst({
        where: { id: query.topicId, consultationId },
        select: { id: true }
      })
      if (!topic) {
        throw createError({ statusCode: 404, message: 'Tema no encontrado' })
      }
      containerWhere = { topicId: query.topicId }
    } else {
      containerWhere = {
        OR: [
          { consultationId },
          { topic: { consultationId } }
        ]
      }
    }

    const where = {
      ...containerWhere,
      ...(query.moderationStatus ? { moderationStatus: query.moderationStatus } : {})
    }

    const skip = (query.page - 1) * query.perPage

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          ...commentWithRelationsInclude,
          topic: { select: { title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.perPage
      }),
      prisma.comment.count({ where })
    ])

    const avatarUrls = await resolveCommentAvatarUrls(comments)

    return {
      items: comments.map(comment => serializeComment(
        { ...comment, authorAvatarUrl: avatarUrls.get(comment.id) ?? null },
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

  // Vista pública: solo si la consulta es visible públicamente.
  if (!isAdmin && !isPubliclyVisibleConsultation(consultation)) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  // Solo comentarios de primer nivel: las respuestas se cargan bajo demanda y
  // paginadas desde `GET /api/comments/:id/replies`.
  const comments = await prisma.comment.findMany({
    where: {
      consultationId,
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
