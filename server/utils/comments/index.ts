import type { H3Event } from 'h3'
import type { CommentAuthorMode } from '../../../prisma/generated/enums'
import type { AuthContext } from '../auth/context'
import { isTopicParticipationWindowOpen } from '../topics/participation-window'
import { deriveParticipationState } from '../participation-state'
import { resolveAssetAccessUrl, type AssetUrlResolvable } from '../assets/url'
import { useStorageDriver } from '../storage'

/**
 * Include estándar para traer un comentario con su autor y reacciones,
 * en la forma que espera `serializeComment`.
 */
export const commentAuthorInclude = {
  select: {
    displayName: true,
    firstName: true,
    lastName: true,
    email: true,
    avatarAsset: { select: { id: true, assetType: true, storagePath: true, externalUrl: true } }
  }
} as const

export const commentWithRelationsInclude = {
  author: commentAuthorInclude,
  reactions: { select: { reactionType: true, userId: true } }
} as const

/**
 * Cuenta las respuestas visibles de un conjunto de comentarios de primer nivel.
 * Devuelve un mapa `parentCommentId -> cantidad`, para adjuntar `replyCount`
 * al listado sin traer las respuestas anidadas.
 */
export async function countVisibleReplies(parentIds: number[]): Promise<Map<number, number>> {
  if (parentIds.length === 0) {
    return new Map()
  }

  const grouped = await prisma.comment.groupBy({
    by: ['parentCommentId'],
    where: { parentCommentId: { in: parentIds }, moderationStatus: 'visible' },
    _count: { _all: true }
  })

  return new Map(
    grouped
      .filter((row): row is typeof row & { parentCommentId: number } => row.parentCommentId !== null)
      .map(row => [row.parentCommentId, row._count._all])
  )
}

type AvatarAssetSelect = AssetUrlResolvable & { id: number }

/**
 * Resuelve las URLs de avatar de los autores de un conjunto de comentarios.
 * Devuelve un mapa `commentId -> url | null`. La resolución es asíncrona
 * (el driver de storage puede firmar la URL) y cachea por asset para no
 * repetir trabajo cuando varios comentarios comparten autor.
 */
export async function resolveCommentAvatarUrls(
  comments: { id: number, author: { avatarAsset?: AvatarAssetSelect | null } }[]
): Promise<Map<number, string | null>> {
  const byComment = new Map<number, string | null>()

  if (!comments.some(comment => comment.author.avatarAsset)) {
    for (const comment of comments) {
      byComment.set(comment.id, null)
    }
    return byComment
  }

  const driver = useStorageDriver()
  const byAsset = new Map<number, string | null>()

  for (const comment of comments) {
    const asset = comment.author.avatarAsset
    if (!asset) {
      byComment.set(comment.id, null)
      continue
    }
    if (!byAsset.has(asset.id)) {
      byAsset.set(asset.id, await resolveAssetAccessUrl(asset, driver))
    }
    byComment.set(comment.id, byAsset.get(asset.id) ?? null)
  }

  return byComment
}

/** Resuelve la URL de avatar del autor de un único comentario. */
export async function resolveCommentAvatarUrl(
  comment: { id: number, author: { avatarAsset?: AvatarAssetSelect | null } }
): Promise<string | null> {
  const urls = await resolveCommentAvatarUrls([comment])
  return urls.get(comment.id) ?? null
}

/**
 * Devuelve el nombre configurado de la institución (para la autoría
 * institucional de comentarios). Puede ser null si no está configurada.
 */
export async function getInstitutionName(): Promise<string | null> {
  const settings = await prisma.platformSettings.findFirst({
    select: { name: true },
    orderBy: { id: 'asc' }
  })
  return settings?.name ?? null
}

type ConsultationWindow = {
  visibility: string
  startsAt: Date | null
  endsAt: Date | null
}

/**
 * ¿Está abierta la ventana efectiva para comentar a nivel consulta?
 * La consulta debe estar visible y su estado temporal derivado debe ser `open`
 * (dentro de la ventana de fechas).
 */
export function isConsultationCommentingOpen(
  consultation: ConsultationWindow,
  now: Date = new Date()
): boolean {
  if (consultation.visibility !== 'visible') {
    return false
  }
  return deriveParticipationState(consultation, now) === 'open'
}

/**
 * Lanza 403 si no se puede comentar en la consulta (ventana efectiva cerrada).
 */
export function assertConsultationCommentingOpen(consultation: ConsultationWindow): void {
  if (!isConsultationCommentingOpen(consultation)) {
    throw createError({
      statusCode: 403,
      message: 'Los comentarios de esta consulta están cerrados'
    })
  }
}

/**
 * Lanza 403 si no se puede comentar en el tema. Reutiliza la ventana efectiva
 * de participación: la consulta debe estar abierta y el tema publicado y dentro
 * de su ventana efectiva.
 */
export function assertTopicCommentingOpen(
  topic: { visibility: string, participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: ConsultationWindow
): void {
  if (!isConsultationCommentingOpen(consultation)) {
    throw createError({
      statusCode: 403,
      message: 'Los comentarios de esta consulta están cerrados'
    })
  }
  if (!isTopicParticipationWindowOpen(topic, consultation)) {
    throw createError({
      statusCode: 403,
      message: 'Los comentarios de este tema están cerrados'
    })
  }
}

/**
 * Resuelve el `authorMode` de un comentario nuevo.
 * Un ciudadano común siempre comenta como `citizen`. Un administrador de la
 * consulta (o de plataforma) puede elegir `institution` o `citizen`.
 */
export async function resolveAuthorMode(
  ctx: AuthContext,
  consultationId: number,
  requested: CommentAuthorMode | undefined
): Promise<CommentAuthorMode> {
  if (requested !== 'institution') {
    return 'citizen'
  }

  const isAdmin = ctx.isPlatformAdmin || await ctx.isConsultationAdmin(consultationId)
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Solo un administrador puede comentar como institución'
    })
  }

  return 'institution'
}

/**
 * Valida un `parentCommentId` para una respuesta de un único nivel dentro del
 * mismo contenedor (misma consulta o mismo tema). Lanza 422 si es inválido.
 */
export async function assertValidParent(
  parentCommentId: number,
  container: { consultationId: number | null, topicId: number | null }
): Promise<void> {
  const parent = await prisma.comment.findUnique({
    where: { id: parentCommentId },
    select: {
      consultationId: true,
      topicId: true,
      parentCommentId: true,
      moderationStatus: true
    }
  })

  const sameContainer = parent
    && parent.consultationId === container.consultationId
    && parent.topicId === container.topicId

  if (!parent || !sameContainer || parent.moderationStatus !== 'visible') {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'parentCommentId', message: 'El comentario al que respondés no es válido' }]
    })
  }

  // Un único nivel de anidamiento: no se puede responder a una respuesta.
  if (parent.parentCommentId !== null) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'parentCommentId', message: 'Solo se puede responder a un comentario principal' }]
    })
  }
}

type LoadedComment = {
  id: number
  consultationId: number | null
  topicId: number | null
  moderationStatus: string
}

/**
 * Carga un comentario por id de la ruta y resuelve la consulta a la que
 * pertenece (directa o a través de su tema), necesaria para autorizar.
 */
export async function loadCommentWithConsultation(
  event: H3Event,
  paramName: string = 'id'
): Promise<{ comment: LoadedComment, consultationId: number }> {
  const commentId = parsePositiveIntParam(event, paramName, 'comentario')

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      consultationId: true,
      topicId: true,
      moderationStatus: true,
      topic: { select: { consultationId: true } }
    }
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const consultationId = comment.consultationId ?? comment.topic?.consultationId

  if (!consultationId) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  return {
    comment: {
      id: comment.id,
      consultationId: comment.consultationId,
      topicId: comment.topicId,
      moderationStatus: comment.moderationStatus
    },
    consultationId
  }
}
