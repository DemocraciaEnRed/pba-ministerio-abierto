import type { CommentWhereInput } from '~~/prisma/generated/models'
import type { CommentModerationStatus, CommentReactionType } from '~~/prisma/generated/enums'
import type {
  ConsultationCommentsExportFiltersInput,
  PlatformCommentsExportFiltersInput
} from '#shared/schemas/data-export'
import { consultationPermalinkPath } from '#shared/utils/consultation-url'
import { getInstitutionName } from '~~/server/utils/comments'
import {
  buildCommentSearchFilter,
  buildDayRangeFilter,
  buildModerationWhere
} from '~~/server/utils/comments/moderation-query'
import { resolveCommentAuthorLabel } from '~~/server/utils/serializers/comment'
import { exportCursorWhere, iterateExportBatchesById } from '../batches'
import { formatExportDate, type CsvValue } from '../csv'
import { defineDataExport } from '../types'

const REACTION_COLUMNS: { type: CommentReactionType, label: string }[] = [
  { type: 'heart', label: 'Me gusta' },
  { type: 'agree', label: 'De acuerdo' },
  { type: 'idea', label: 'Idea' },
  { type: 'relevant', label: 'Relevante' },
  { type: 'deepen', label: 'Profundizar' }
]

const STATUS_LABELS: Record<CommentModerationStatus, string> = {
  visible: 'Visible',
  hidden: 'Oculto',
  deleted: 'Borrado'
}

const COMMENT_EXPORT_HEADERS = [
  'ID',
  'ID del hilo',
  'Tipo',
  'ID de la consulta',
  'Consulta',
  'Tema',
  'Autor/a',
  'Correo',
  'Autoría',
  'Estado',
  'Comentario',
  'Adjunto',
  ...REACTION_COLUMNS.map(column => `Reacciones: ${column.label}`),
  'Respuestas',
  'Fecha',
  'Enlace público'
]

const consultationSelect = { select: { id: true, title: true } } as const

const commentExportInclude = {
  author: { select: { displayName: true, firstName: true, lastName: true, email: true } },
  attachmentAsset: { select: { originalFilename: true } },
  consultation: consultationSelect,
  topic: { select: { title: true, slug: true, consultation: consultationSelect } }
} as const

async function fetchCommentBatch(where: CommentWhereInput, cursor: number | undefined, take: number) {
  return prisma.comment.findMany({
    where: { AND: [where, exportCursorWhere(cursor)] },
    include: commentExportInclude,
    orderBy: { id: 'desc' },
    take
  })
}

type CommentExportRecord = Awaited<ReturnType<typeof fetchCommentBatch>>[number]

/**
 * Convierte una tanda de comentarios en filas. Los comentarios borrados se
 * exportan sin texto (solo metadatos).
 */
async function toCommentRows(
  comments: CommentExportRecord[],
  institutionName: string | null,
  appUrl: string
): Promise<CsvValue[][]> {
  const ids = comments.map(comment => comment.id)
  const rootIds = comments.filter(comment => comment.parentCommentId === null).map(comment => comment.id)

  const [reactions, replies] = await Promise.all([
    prisma.commentReaction.groupBy({
      by: ['commentId', 'reactionType'],
      where: { commentId: { in: ids } },
      _count: { _all: true }
    }),
    rootIds.length > 0
      ? prisma.comment.groupBy({
          by: ['parentCommentId'],
          where: { parentCommentId: { in: rootIds } },
          _count: { _all: true }
        })
      : Promise.resolve([])
  ])

  const reactionCounts = new Map<string, number>()
  for (const row of reactions) {
    reactionCounts.set(`${row.commentId}:${row.reactionType}`, row._count._all)
  }
  const replyCounts = new Map<number, number>()
  for (const row of replies) {
    if (row.parentCommentId !== null) replyCounts.set(row.parentCommentId, row._count._all)
  }

  return comments.map((comment) => {
    const consultation = comment.consultation ?? comment.topic?.consultation ?? null
    const isReply = comment.parentCommentId !== null
    const isDeleted = comment.moderationStatus === 'deleted'
    const publicPath = consultation
      ? consultationPermalinkPath(consultation.id, comment.topic ? `temas/${comment.topic.slug}` : null)
      : ''

    return [
      comment.id,
      comment.parentCommentId ?? comment.id,
      isReply ? 'Respuesta' : 'Comentario',
      consultation?.id ?? '',
      consultation?.title ?? '',
      comment.topic?.title ?? '',
      resolveCommentAuthorLabel(comment, institutionName) ?? '',
      comment.author.email,
      comment.authorMode === 'institution' ? 'Institucional' : 'Ciudadana',
      STATUS_LABELS[comment.moderationStatus],
      isDeleted ? '' : comment.body,
      comment.attachmentAsset?.originalFilename ?? '',
      ...REACTION_COLUMNS.map(column => reactionCounts.get(`${comment.id}:${column.type}`) ?? 0),
      isReply ? '' : (replyCounts.get(comment.id) ?? 0),
      formatExportDate(comment.createdAt),
      publicPath ? `${appUrl}${publicPath}` : ''
    ]
  })
}

async function* commentRows(where: CommentWhereInput, batchSize: number): AsyncGenerator<CsvValue[][]> {
  const institutionName = await getInstitutionName()
  const appUrl = String(useRuntimeConfig().public.appUrl ?? '').replace(/\/$/, '')
  const batches = iterateExportBatchesById(
    (cursor, take) => fetchCommentBatch(where, cursor, take),
    batchSize
  )
  for await (const batch of batches) {
    yield await toCommentRows(batch, institutionName, appUrl)
  }
}

async function loadExportConsultation(consultationId: number | null) {
  const consultation = consultationId === null
    ? null
    : await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { id: true, slug: true, title: true }
      })
  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }
  return consultation
}

type ConsultationCommentsFilters = ConsultationCommentsExportFiltersInput & { topicId?: number }

/**
 * Comentarios de una consulta, con los filtros de la bandeja de moderación.
 * Como la bandeja muestra hilos, se exportan los hilos que coinciden con los
 * filtros completos: la raíz y todas sus respuestas.
 */
export const consultationCommentsExport = defineDataExport<ConsultationCommentsFilters>({
  kind: 'consultation_comments',
  scope: 'consultation',
  headers: COMMENT_EXPORT_HEADERS,

  async describe({ consultationId, filters }) {
    const consultation = await loadExportConsultation(consultationId)

    let topic: { id: number, slug: string, title: string } | null = null
    const topicRef = filters.topicId !== undefined ? String(filters.topicId) : filters.topic
    if (topicRef) {
      const maybeId = Number(topicRef)
      topic = await prisma.topic.findFirst({
        where: Number.isInteger(maybeId) && maybeId > 0
          ? { id: maybeId, consultationId: consultation.id }
          : { slug: topicRef, consultationId: consultation.id },
        select: { id: true, slug: true, title: true }
      })
      if (!topic) {
        throw createError({ statusCode: 404, message: 'Tema no encontrado' })
      }
    }

    return {
      title: topic
        ? `Comentarios · ${consultation.title} › ${topic.title}`
        : `Comentarios · ${consultation.title}`,
      filenameBase: topic ? `comentarios-${consultation.slug}-${topic.slug}` : `comentarios-${consultation.slug}`,
      filters: { ...filters, topic: undefined, topicId: topic?.id }
    }
  },

  rows({ consultationId, filters }, batchSize) {
    const container: CommentWhereInput = filters.topicId !== undefined
      ? { topicId: filters.topicId }
      : { OR: [{ consultationId: consultationId! }, { topic: { consultationId: consultationId! } }] }

    const threads = buildModerationWhere(container, {
      level: 'top',
      order: 'recent',
      moderationStatus: filters.moderationStatus,
      q: filters.q,
      from: filters.from,
      to: filters.to,
      unanswered: filters.unanswered,
      withAttachment: filters.withAttachment
    })

    return commentRows({ OR: [threads, { parentComment: threads }] }, batchSize)
  }
})

/** Registro de comentarios de toda la plataforma, con sus mismos filtros. */
export const platformCommentsExport = defineDataExport<PlatformCommentsExportFiltersInput>({
  kind: 'platform_comments',
  scope: 'platform',
  headers: COMMENT_EXPORT_HEADERS,

  async describe({ filters }) {
    if (filters.consultationId !== undefined) {
      const consultation = await loadExportConsultation(filters.consultationId)
      return {
        title: `Comentarios de la plataforma · ${consultation.title}`,
        filenameBase: `comentarios-plataforma-${consultation.slug}`,
        filters
      }
    }
    return {
      title: 'Comentarios de la plataforma',
      filenameBase: 'comentarios-plataforma',
      filters
    }
  },

  rows({ filters }, batchSize) {
    const clauses: CommentWhereInput[] = []
    if (filters.consultationId !== undefined) {
      clauses.push({
        OR: [
          { consultationId: filters.consultationId },
          { topic: { consultationId: filters.consultationId } }
        ]
      })
    }
    if (filters.moderationStatus) {
      clauses.push({ moderationStatus: filters.moderationStatus })
    }
    if (filters.q) {
      clauses.push(buildCommentSearchFilter(filters.q))
    }
    const createdAt = buildDayRangeFilter(filters.from, filters.to)
    if (createdAt) {
      clauses.push({ createdAt })
    }
    return commentRows({ AND: clauses }, batchSize)
  }
})
