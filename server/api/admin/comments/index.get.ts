import { PlatformCommentsLogQuerySchema } from '#shared/schemas/comment'
import type { CommentWhereInput } from '~~/prisma/generated/models'
import {
  commentWithRelationsInclude,
  getInstitutionName,
  resolveCommentAvatarUrls
} from '~~/server/utils/comments'
import { buildCommentSearchFilter, buildDayRangeFilter } from '~~/server/utils/comments/moderation-query'
import { serializeCommentLogEntry } from '~~/server/utils/serializers/comment'

const containerConsultationSelect = { select: { id: true, slug: true, title: true } } as const

/**
 * Endpoint orientado al panel de administración de plataforma (BFF).
 *
 * Registro de "quién comentó dónde": comentarios y respuestas de todas las
 * consultas (y sus temas), con la consulta contenedora resuelta para enlazar al
 * hilo en el panel. Solo lectura; la moderación sigue por las rutas
 * entity-driven del comentario. Reservado a administradores de plataforma; ver
 * la excepción documentada en `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, PlatformCommentsLogQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const clauses: CommentWhereInput[] = []

  if (query.consultationId !== undefined) {
    clauses.push({
      OR: [
        { consultationId: query.consultationId },
        { topic: { consultationId: query.consultationId } }
      ]
    })
  }
  if (query.moderationStatus) {
    clauses.push({ moderationStatus: query.moderationStatus })
  }
  if (query.q) {
    clauses.push(buildCommentSearchFilter(query.q))
  }
  const createdAt = buildDayRangeFilter(query.from, query.to)
  if (createdAt) {
    clauses.push({ createdAt })
  }

  const where: CommentWhereInput = { AND: clauses }
  const skip = (query.page - 1) * query.perPage

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        ...commentWithRelationsInclude,
        consultation: containerConsultationSelect,
        topic: {
          select: {
            id: true,
            slug: true,
            title: true,
            consultation: containerConsultationSelect
          }
        }
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: query.perPage
    }),
    prisma.comment.count({ where })
  ])

  const institutionName = await getInstitutionName()
  const avatarUrls = await resolveCommentAvatarUrls(comments)
  const context = { currentUserId: ctx.user!.id, institutionName }

  return {
    items: comments.map(comment => serializeCommentLogEntry(
      { ...comment, authorAvatarUrl: avatarUrls.get(comment.id) ?? null },
      'admin',
      context
    )),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
