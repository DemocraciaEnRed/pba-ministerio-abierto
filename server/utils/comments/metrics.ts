import type { CommentMetricsQueryInput } from '#shared/schemas/comment'
import type { CommentWhereInput } from '~~/prisma/generated/models'

export type CommentMetricsRange = CommentMetricsQueryInput['range']

/** Argentina no aplica horario de verano, así que un offset fijo alcanza para acotar "este mes". */
const ARGENTINA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000

const RANGE_DAYS: Record<'7d' | '14d', number> = { '7d': 7, '14d': 14 }
const DAY_MS = 24 * 60 * 60 * 1000

export interface CommentMetricsDTO {
  range: CommentMetricsRange
  /** Inicio de la ventana; `null` cuando el rango es histórico (`all`). */
  from: string | null
  to: string
  total: number
  topLevel: number
  replies: number
  hidden: number
  deleted: number
  /** Total del período anterior de igual duración; `null` si el rango no tiene comparación. */
  previousTotal: number | null
  deltaAbs: number | null
  deltaPct: number | null
  allTimeTotal: number
  lastCommentAt: string | null
}

interface MetricsWindow {
  from: Date | null
  to: Date
  previousFrom: Date | null
  previousTo: Date | null
}

export function resolveMetricsWindow(range: CommentMetricsRange, now: Date): MetricsWindow {
  if (range === 'all') {
    return { from: null, to: now, previousFrom: null, previousTo: null }
  }

  if (range === 'month') {
    const local = new Date(now.getTime() - ARGENTINA_UTC_OFFSET_MS)
    const from = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + ARGENTINA_UTC_OFFSET_MS)
    const previousFrom = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 1, 1) + ARGENTINA_UTC_OFFSET_MS)
    return { from, to: now, previousFrom, previousTo: from }
  }

  const rangeMs = RANGE_DAYS[range] * DAY_MS
  const from = new Date(now.getTime() - rangeMs)
  return { from, to: now, previousFrom: new Date(from.getTime() - rangeMs), previousTo: from }
}

/** Comentarios de la consulta y de sus temas. */
export function consultationCommentsWhere(consultationId: number): CommentWhereInput {
  return { OR: [{ consultationId }, { topic: { consultationId } }] }
}

/** Comentarios de todas las consultas de un tipo de consulta (sección) y de sus temas. */
export function sectionCommentsWhere(sectionSlug: string): CommentWhereInput {
  return {
    OR: [
      { consultation: { section: { slug: sectionSlug } } },
      { topic: { consultation: { section: { slug: sectionSlug } } } }
    ]
  }
}

function createdBetween(from: Date | null, to: Date) {
  return from ? { createdAt: { gte: from, lte: to } } : { createdAt: { lte: to } }
}

/**
 * Métricas agregadas de comentarios sobre un alcance arbitrario (una consulta,
 * un tipo de consulta, etc.) para los paneles de gestión.
 *
 * `hidden` y `deleted` cuentan comentarios **creados** en la ventana cuyo estado
 * de moderación actual es ese: no existe una fecha de moderación para `hidden`.
 */
export async function getCommentMetrics(
  containerWhere: CommentWhereInput,
  range: CommentMetricsRange,
  now: Date = new Date()
): Promise<CommentMetricsDTO> {
  const window = resolveMetricsWindow(range, now)
  const inWindow = { AND: [containerWhere, createdBetween(window.from, window.to)] }

  const [total, replies, hidden, deleted, allTimeTotal, previousTotal, lastComment] = await Promise.all([
    prisma.comment.count({ where: inWindow }),
    prisma.comment.count({ where: { AND: [inWindow, { parentCommentId: { not: null } }] } }),
    prisma.comment.count({ where: { AND: [inWindow, { moderationStatus: 'hidden' }] } }),
    prisma.comment.count({ where: { AND: [inWindow, { moderationStatus: 'deleted' }] } }),
    prisma.comment.count({ where: containerWhere }),
    window.previousFrom && window.previousTo
      ? prisma.comment.count({
          where: {
            AND: [containerWhere, { createdAt: { gte: window.previousFrom, lt: window.previousTo } }]
          }
        })
      : Promise.resolve(null),
    prisma.comment.findFirst({
      where: { AND: [containerWhere, { moderationStatus: { not: 'deleted' } }] },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  ])

  const deltaAbs = previousTotal === null ? null : total - previousTotal
  const deltaPct = previousTotal === null || previousTotal === 0
    ? null
    : Math.round(((total - previousTotal) / previousTotal) * 100)

  return {
    range,
    from: window.from?.toISOString() ?? null,
    to: window.to.toISOString(),
    total,
    topLevel: total - replies,
    replies,
    hidden,
    deleted,
    previousTotal,
    deltaAbs,
    deltaPct,
    allTimeTotal,
    lastCommentAt: lastComment?.createdAt.toISOString() ?? null
  }
}

export function getConsultationCommentMetrics(
  consultationId: number,
  range: CommentMetricsRange,
  now: Date = new Date()
): Promise<CommentMetricsDTO> {
  return getCommentMetrics(consultationCommentsWhere(consultationId), range, now)
}
