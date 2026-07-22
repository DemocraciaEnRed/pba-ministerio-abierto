import type {
  CommentAuthorMode,
  CommentModerationStatus,
  CommentReactionType
} from '../../../prisma/generated/enums'

export type CommentView = 'public' | 'admin'

type CommentAuthor = {
  displayName: string | null
  firstName: string | null
  lastName: string | null
  email: string
  avatarAsset?: { id: number } | null
}

type CommentReactionEntity = {
  reactionType: CommentReactionType
  userId: number
}

export type CommentEntity = {
  id: number
  consultationId: number | null
  topicId: number | null
  authorUserId: number
  parentCommentId: number | null
  body: string
  authorMode: CommentAuthorMode
  moderationStatus: CommentModerationStatus
  deletedAt: Date | null
  deletedByUserId: number | null
  createdAt: Date
  updatedAt: Date
  author: CommentAuthor
  /** Tema contenedor (solo presente en la bandeja admin de la consulta). */
  topic?: { title?: string | null, slug?: string | null } | null
  reactions?: CommentReactionEntity[]
  replies?: CommentEntity[]
  /** Cantidad de respuestas visibles (para cargarlas bajo demanda). */
  replyCount?: number
  /** URL del avatar del autor, resuelta en el handler (storage async). */
  authorAvatarUrl?: string | null
}

export interface SerializeCommentContext {
  currentUserId: number | null
  institutionName: string | null
}

export interface CommentReactionsSummary {
  counts: Record<CommentReactionType, number>
  mine: CommentReactionType[]
}

export interface PublicCommentDTO {
  id: number
  containerType: 'consultation' | 'topic'
  consultationId: number | null
  topicId: number | null
  parentCommentId: number | null
  body: string
  authorMode: CommentAuthorMode
  authorLabel: string | null
  authorAvatarUrl: string | null
  reactions: CommentReactionsSummary
  createdAt: string
  updatedAt: string
  /** Cantidad de respuestas visibles; presente en el listado de primer nivel. */
  replyCount?: number
  replies?: PublicCommentDTO[]
}

export interface AdminCommentDTO extends Omit<PublicCommentDTO, 'replies'> {
  authorUserId: number
  authorEmail: string
  moderationStatus: CommentModerationStatus
  deletedAt: string | null
  deletedByUserId: number | null
  /** Título del tema contenedor (null si el comentario es de la consulta). */
  topicTitle: string | null
  topicSlug: string | null
  replies?: AdminCommentDTO[]
}

const REACTION_TYPES: CommentReactionType[] = ['heart', 'agree', 'idea', 'relevant', 'deepen']

/**
 * Etiqueta pública de autoría. Para un ciudadano usa displayName y, si no
 * existe, nombre + apellido. Para la institución usa el nombre configurado.
 */
function resolveAuthorLabel(comment: CommentEntity, institutionName: string | null): string | null {
  if (comment.authorMode === 'institution') {
    return institutionName
  }

  const displayName = comment.author.displayName?.trim()
  if (displayName) {
    return displayName
  }

  const fullName = [comment.author.firstName, comment.author.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || null
}

function buildReactionsSummary(
  reactions: CommentReactionEntity[] | undefined,
  currentUserId: number | null
): CommentReactionsSummary {
  const counts: Record<CommentReactionType, number> = {
    heart: 0,
    agree: 0,
    idea: 0,
    relevant: 0,
    deepen: 0
  }
  const mine: CommentReactionType[] = []

  for (const reaction of reactions ?? []) {
    counts[reaction.reactionType] += 1
    if (currentUserId !== null && reaction.userId === currentUserId) {
      mine.push(reaction.reactionType)
    }
  }

  return { counts, mine }
}

export function serializeComment(comment: CommentEntity, view: 'public', context: SerializeCommentContext): PublicCommentDTO
export function serializeComment(comment: CommentEntity, view: 'admin', context: SerializeCommentContext): AdminCommentDTO
export function serializeComment(
  comment: CommentEntity,
  view: CommentView,
  context: SerializeCommentContext
): PublicCommentDTO | AdminCommentDTO {
  const base: Omit<PublicCommentDTO, 'replies'> = {
    id: comment.id,
    containerType: comment.topicId !== null ? 'topic' : 'consultation',
    consultationId: comment.consultationId,
    topicId: comment.topicId,
    parentCommentId: comment.parentCommentId,
    body: comment.body,
    authorMode: comment.authorMode,
    authorLabel: resolveAuthorLabel(comment, context.institutionName),
    authorAvatarUrl: comment.authorAvatarUrl ?? null,
    reactions: buildReactionsSummary(comment.reactions, context.currentUserId),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    ...(comment.replyCount !== undefined ? { replyCount: comment.replyCount } : {})
  }

  if (view === 'public') {
    const publicDto: PublicCommentDTO = { ...base }
    if (comment.replies) {
      publicDto.replies = comment.replies.map(reply => serializeComment(reply, 'public', context))
    }
    return publicDto
  }

  const admin: AdminCommentDTO = {
    ...base,
    authorUserId: comment.authorUserId,
    authorEmail: comment.author.email,
    moderationStatus: comment.moderationStatus,
    deletedAt: comment.deletedAt?.toISOString() ?? null,
    deletedByUserId: comment.deletedByUserId,
    topicTitle: comment.topic?.title ?? null,
    topicSlug: comment.topic?.slug ?? null
  }

  if (comment.replies) {
    admin.replies = comment.replies.map(reply => serializeComment(reply, 'admin', context))
  }

  return admin
}

export { REACTION_TYPES }
