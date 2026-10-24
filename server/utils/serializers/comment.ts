import type {
  CommentAuthorMode,
  CommentModerationStatus,
  CommentReactionType
} from '../../../prisma/generated/enums'
import type { AttachmentFileDTO } from '#shared/utils/attachments'
import { serializeAttachmentFiles, type AttachmentListEntity } from '../assets/multi-attachments'

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
  /** Respuestas por estado de moderación (solo bandeja admin con `level=top`). */
  replyCounts?: CommentReplyCounts
  /** URL del avatar del autor, resuelta en el handler (storage async). */
  authorAvatarUrl?: string | null
  /** Adjuntos (hasta 3). Los archivos solo se exponen en la vista admin/moderación. */
  attachments?: AttachmentListEntity[]
}

export interface CommentReplyCounts {
  total: number
  visible: number
  hidden: number
  deleted: number
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
  /** Cantidad de adjuntos (solo informativo, sin acceso a los archivos). */
  attachmentCount: number
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
  /** Adjuntos descargables por el endpoint protegido. */
  attachments: AttachmentFileDTO[]
  /** Respuestas por estado de moderación; presente en la bandeja por hilos. */
  replyCounts?: CommentReplyCounts
  replies?: AdminCommentDTO[]
}

function serializeCommentAttachments(comment: Pick<CommentEntity, 'id' | 'attachments'>): AttachmentFileDTO[] {
  return serializeAttachmentFiles(
    comment.attachments,
    attachmentId => `/api/comments/${comment.id}/attachments/${attachmentId}`
  )
}

const REACTION_TYPES: CommentReactionType[] = ['heart', 'agree', 'idea', 'relevant', 'deepen']

/**
 * Etiqueta pública de autoría. Para un ciudadano usa displayName y, si no
 * existe, nombre + apellido. Para la institución usa el nombre configurado.
 */
export function resolveCommentAuthorLabel(
  comment: Pick<CommentEntity, 'authorMode' | 'author'>,
  institutionName: string | null
): string | null {
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
    authorLabel: resolveCommentAuthorLabel(comment, context.institutionName),
    authorAvatarUrl: comment.authorAvatarUrl ?? null,
    attachmentCount: comment.attachments?.length ?? 0,
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
    topicSlug: comment.topic?.slug ?? null,
    attachments: serializeCommentAttachments(comment)
  }

  if (comment.replyCounts) {
    admin.replyCounts = {
      total: comment.replyCounts.total,
      visible: comment.replyCounts.visible,
      hidden: comment.replyCounts.hidden,
      deleted: comment.replyCounts.deleted
    }
  }

  if (comment.replies) {
    admin.replies = comment.replies.map(reply => serializeComment(reply, 'admin', context))
  }

  return admin
}

const LOG_EXCERPT_MAX_LENGTH = 280

/** Comentario con la consulta y el tema contenedores, para el registro de plataforma. */
export type CommentLogEntity = CommentEntity & {
  consultation: { id: number, slug: string, title: string } | null
  topic: { id: number, slug: string, title: string, consultation: { id: number, slug: string, title: string } } | null
}

/** Entrada del registro "quién comentó dónde" del panel de administración. */
export interface AdminCommentLogEntryDTO {
  id: number
  /** Comentario raíz del hilo (el propio id si es de primer nivel). */
  rootCommentId: number
  isReply: boolean
  excerpt: string
  authorUserId: number
  authorLabel: string | null
  authorEmail: string
  authorAvatarUrl: string | null
  authorMode: CommentAuthorMode
  moderationStatus: CommentModerationStatus
  attachmentCount: number
  /** Adjuntos descargables (para el popover del registro). */
  attachments: AttachmentFileDTO[]
  consultation: { id: number, slug: string, title: string }
  topic: { id: number, slug: string, title: string } | null
  createdAt: string
}

function buildExcerpt(body: string): string {
  const normalized = body.replace(/\s+/g, ' ').trim()
  if (normalized.length <= LOG_EXCERPT_MAX_LENGTH) return normalized
  return `${normalized.slice(0, LOG_EXCERPT_MAX_LENGTH - 1).trimEnd()}…`
}

/**
 * Serializa una entrada del registro de comentarios de la plataforma. Solo
 * existe la vista admin: expone el correo del autor y el estado de moderación.
 */
export function serializeCommentLogEntry(
  comment: CommentLogEntity,
  view: 'admin',
  context: SerializeCommentContext
): AdminCommentLogEntryDTO {
  const consultation = comment.consultation ?? comment.topic!.consultation

  return {
    id: comment.id,
    rootCommentId: comment.parentCommentId ?? comment.id,
    isReply: comment.parentCommentId !== null,
    excerpt: buildExcerpt(comment.body),
    authorUserId: comment.authorUserId,
    authorLabel: resolveCommentAuthorLabel(comment, context.institutionName),
    authorEmail: comment.author.email,
    authorAvatarUrl: comment.authorAvatarUrl ?? null,
    authorMode: comment.authorMode,
    moderationStatus: comment.moderationStatus,
    attachmentCount: comment.attachments?.length ?? 0,
    attachments: serializeCommentAttachments(comment),
    consultation: { id: consultation.id, slug: consultation.slug, title: consultation.title },
    topic: comment.topic
      ? { id: comment.topic.id, slug: comment.topic.slug, title: comment.topic.title }
      : null,
    createdAt: comment.createdAt.toISOString()
  }
}

export { REACTION_TYPES }
