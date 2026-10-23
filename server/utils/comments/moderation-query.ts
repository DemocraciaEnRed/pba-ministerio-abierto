import type { CommentOrderByWithRelationInput, CommentWhereInput } from '~~/prisma/generated/models'
import type { CommentModerationStatus } from '~~/prisma/generated/enums'
import type { CommentsModerationQueryInput } from '#shared/schemas/comment'

// Argentina no tiene horario de verano: los días de calendario se cortan en UTC-3.
const ARGENTINA_OFFSET = '-03:00'

/** Filtros de contenido compartidos por las bandejas de moderación. */
export type ModerationFilters = Pick<
  CommentsModerationQueryInput,
  'level' | 'moderationStatus' | 'q' | 'from' | 'to' | 'unanswered' | 'withAttachment' | 'order'
>

/**
 * Convierte un rango de días (`YYYY-MM-DD`, inclusivo en ambos extremos) en un
 * filtro de `createdAt`, interpretando cada día completo en hora de Argentina.
 */
export function buildDayRangeFilter(from?: string, to?: string): { gte?: Date, lte?: Date } | undefined {
  if (!from && !to) return undefined
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000${ARGENTINA_OFFSET}`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999${ARGENTINA_OFFSET}`) } : {})
  }
}

/** Búsqueda por texto en el cuerpo y en los datos del autor (nombre, alias o correo). */
export function buildCommentSearchFilter(q: string): CommentWhereInput {
  return {
    OR: [
      { body: { contains: q } },
      { author: { displayName: { contains: q } } },
      { author: { firstName: { contains: q } } },
      { author: { lastName: { contains: q } } },
      { author: { email: { contains: q } } }
    ]
  }
}

/** Condiciones que debe cumplir un comentario individual (raíz o respuesta). */
function buildCommentPredicate(filters: ModerationFilters): CommentWhereInput | null {
  const clauses: CommentWhereInput[] = []

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
  if (filters.withAttachment) {
    clauses.push({ attachments: { some: {} } })
  }

  return clauses.length > 0 ? { AND: clauses } : null
}

/**
 * Arma el `where` de la bandeja de moderación a partir del contenedor (consulta,
 * tema o ambos) y los filtros.
 *
 * - `level=all`: listado plano; los filtros aplican a cada comentario.
 * - `level=top`: solo hilos (comentarios de primer nivel). Un hilo coincide si
 *   la raíz **o alguna de sus respuestas** cumple los filtros de contenido, para
 *   no perder de vista, por ejemplo, una respuesta oculta o un adjunto.
 *
 * `unanswered` siempre apunta a hilos: comentarios ciudadanos de primer nivel,
 * no borrados y sin respuesta institucional vigente.
 */
export function buildModerationWhere(container: CommentWhereInput, filters: ModerationFilters): CommentWhereInput {
  const clauses: CommentWhereInput[] = [container]
  const predicate = buildCommentPredicate(filters)

  if (filters.level === 'top') {
    clauses.push({ parentCommentId: null })
    if (predicate) {
      clauses.push({ OR: [predicate, { replies: { some: predicate } }] })
    }
  } else if (predicate) {
    clauses.push(predicate)
  }

  if (filters.unanswered) {
    clauses.push({
      parentCommentId: null,
      authorMode: 'citizen',
      moderationStatus: { not: 'deleted' },
      replies: { none: { authorMode: 'institution', moderationStatus: { not: 'deleted' } } }
    })
  }

  return { AND: clauses }
}

/** Orden de la bandeja. El `id` desempata para que la paginación sea estable. */
export function buildModerationOrderBy(order: ModerationFilters['order']): CommentOrderByWithRelationInput[] {
  if (order === 'oldest') {
    return [{ createdAt: 'asc' }, { id: 'asc' }]
  }
  if (order === 'mostReplied') {
    return [{ replies: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }]
  }
  return [{ createdAt: 'desc' }, { id: 'desc' }]
}

export interface ReplyCountsByStatus {
  total: number
  visible: number
  hidden: number
  deleted: number
}

export const EMPTY_REPLY_COUNTS: Readonly<ReplyCountsByStatus> = { total: 0, visible: 0, hidden: 0, deleted: 0 }

/**
 * Cuenta las respuestas de cada hilo agrupadas por estado de moderación (para
 * la bandeja admin, que también debe ver las ocultas y borradas).
 */
export async function countRepliesByStatus(parentIds: number[]): Promise<Map<number, ReplyCountsByStatus>> {
  const counts = new Map<number, ReplyCountsByStatus>()
  if (parentIds.length === 0) return counts

  const grouped = await prisma.comment.groupBy({
    by: ['parentCommentId', 'moderationStatus'],
    where: { parentCommentId: { in: parentIds } },
    _count: { _all: true }
  })

  for (const row of grouped) {
    if (row.parentCommentId === null) continue
    const entry = counts.get(row.parentCommentId) ?? { total: 0, visible: 0, hidden: 0, deleted: 0 }
    const status: CommentModerationStatus = row.moderationStatus
    entry[status] += row._count._all
    entry.total += row._count._all
    counts.set(row.parentCommentId, entry)
  }

  return counts
}
