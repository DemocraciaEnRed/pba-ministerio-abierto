import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'
import type { CommentAuthorMode } from '../../../prisma/generated/enums'
import type { AuthContext } from '../auth/context'
import { isTopicParticipationWindowOpen } from '../topics/participation-window'
import { deriveParticipationState } from '../participation-state'
import { resolveAssetAccessUrl, type AssetUrlResolvable } from '../assets/url'
import { useStorageDriver } from '../storage'
import { buildAssetStorageKey } from '../assets/upload'
import { COMMENT_ATTACHMENT_MAX_SIZE_BYTES, isAllowedCommentAttachmentMime } from '../assets/policy'
import { parseData } from '../validate'
import { CreateCommentSchema, type CreateCommentInput } from '#shared/schemas/comment'

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
  reactions: { select: { reactionType: true, userId: true } },
  attachmentAsset: { select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true } }
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

/** Contenedor (consulta o tema) con el interruptor de la sección de comentarios. */
type CommentsToggle = { commentsEnabled: boolean }

/**
 * Lanza 403 si la sección de comentarios del contenedor está oculta. Ocultarla
 * también deshabilita leer el hilo, comentar, responder y reaccionar; el panel
 * de moderación es el único que sigue accediendo.
 */
export function assertCommentsVisible(
  container: CommentsToggle,
  containerType: 'consultation' | 'topic'
): void {
  if (container.commentsEnabled) {
    return
  }

  throw createError({
    statusCode: 403,
    message: containerType === 'consultation'
      ? 'Los comentarios de esta consulta están ocultos'
      : 'Los comentarios de este tema están ocultos'
  })
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
 * Lanza 403 si no se puede comentar en la consulta (sección oculta o ventana
 * efectiva cerrada).
 */
export function assertConsultationCommentingOpen(consultation: ConsultationWindow & CommentsToggle): void {
  assertCommentsVisible(consultation, 'consultation')

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
 * de su ventana efectiva. El interruptor de comentarios del tema es propio: no
 * se hereda el de la consulta.
 */
export function assertTopicCommentingOpen(
  topic: CommentsToggle & { visibility: string, participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: ConsultationWindow
): void {
  assertCommentsVisible(topic, 'topic')

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
      message: VALIDATION_ERROR_MESSAGE,
      data: [{ field: 'parentCommentId', message: 'El comentario al que respondés no es válido' }]
    })
  }

  // Un único nivel de anidamiento: no se puede responder a una respuesta.
  if (parent.parentCommentId !== null) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: [{ field: 'parentCommentId', message: 'Solo se puede responder a un comentario principal' }]
    })
  }
}

type LoadedComment = {
  id: number
  consultationId: number | null
  topicId: number | null
  moderationStatus: string
  /** Tipo de contenedor del comentario, para mensajes y guards. */
  containerType: 'consultation' | 'topic'
  /** Interruptor de la sección de comentarios del contenedor. */
  commentsEnabled: boolean
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
      consultation: { select: { commentsEnabled: true } },
      topic: { select: { consultationId: true, commentsEnabled: true } }
    }
  })

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const consultationId = comment.consultationId ?? comment.topic?.consultationId

  if (!consultationId) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const containerType = comment.topicId !== null ? 'topic' : 'consultation'

  return {
    comment: {
      id: comment.id,
      consultationId: comment.consultationId,
      topicId: comment.topicId,
      moderationStatus: comment.moderationStatus,
      containerType,
      commentsEnabled: containerType === 'topic'
        ? comment.topic!.commentsEnabled
        : comment.consultation!.commentsEnabled
    },
    consultationId
  }
}

interface CommentMultipartPart {
  name?: string
  data?: Buffer
  filename?: string
  type?: string
}

export interface ParsedCommentAttachment {
  buffer: Buffer
  originalFilename: string
  mimeType: string
  sizeBytes: number
  checksum: string
}

export interface ParsedCommentInput {
  data: CreateCommentInput
  attachment: ParsedCommentAttachment | null
}

function readCommentTextPart(parts: CommentMultipartPart[], name: string): string | undefined {
  const part = parts.find(item => item.name === name && item.data && !item.filename)
  return part?.data?.toString('utf8')
}

/** Valida y arma el adjunto opcional del comentario (documento/imagen ≤ 10 MB). */
function parseOptionalCommentAttachment(parts: CommentMultipartPart[]): ParsedCommentAttachment | null {
  const filePart = parts.find(part => part.name === 'file' && part.data && part.filename)
  if (!filePart?.data) return null

  const mimeType = filePart.type?.trim()
  if (!mimeType || !isAllowedCommentAttachmentMime(mimeType)) {
    throw createError({
      statusCode: 422,
      message: 'El archivo debe ser un PDF, un documento de Office, texto o una imagen (.jpg/.png/.webp).'
    })
  }

  const sizeBytes = filePart.data.length
  if (sizeBytes === 0) {
    throw createError({ statusCode: 422, message: 'El archivo está vacío.' })
  }
  if (sizeBytes > COMMENT_ATTACHMENT_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 422, message: 'El archivo supera el máximo permitido de 10 MB.' })
  }

  return {
    buffer: filePart.data,
    originalFilename: filePart.filename ?? 'adjunto',
    mimeType,
    sizeBytes,
    checksum: createHash('sha256').update(filePart.data).digest('hex')
  }
}

/**
 * Lee la entrada de creación de un comentario. Acepta `multipart/form-data`
 * (campos de texto + parte `file` opcional) y, si no es multipart, cae al body
 * JSON para mantener compatibilidad. El adjunto se valida acá pero se persiste
 * aparte (`persistCommentAttachment`).
 */
export async function parseCommentInput(event: H3Event): Promise<ParsedCommentInput> {
  const parts = (await readMultipartFormData(event)) as CommentMultipartPart[] | null

  if (!parts || parts.length === 0) {
    const data = await parseBody(event, CreateCommentSchema)
    return { data, attachment: null }
  }

  const rawBody = readCommentTextPart(parts, 'body')
  const rawParent = readCommentTextPart(parts, 'parentCommentId')
  const rawAuthorMode = readCommentTextPart(parts, 'authorMode')

  const candidate: Record<string, unknown> = {
    parentCommentId: rawParent && rawParent !== 'null' ? Number(rawParent) : null
  }
  if (rawBody !== undefined) candidate.body = rawBody
  if (rawAuthorMode) candidate.authorMode = rawAuthorMode

  const data = parseData(CreateCommentSchema, candidate)
  const attachment = parseOptionalCommentAttachment(parts)

  return { data, attachment }
}

/**
 * Sube el adjunto al storage (privado) y crea su `Asset`. Devuelve el id del
 * asset para vincularlo al comentario.
 */
export async function persistCommentAttachment(
  attachment: ParsedCommentAttachment,
  uploadedByUserId: number
): Promise<number> {
  const driver = useStorageDriver()
  const storageKey = buildAssetStorageKey('assets', attachment.mimeType)
  // `public: false`: el adjunto solo se sirve por el endpoint protegido.
  await driver.put({
    key: storageKey,
    body: attachment.buffer,
    contentType: attachment.mimeType,
    public: false
  })

  const asset = await prisma.asset.create({
    data: {
      assetType: 'uploaded_file',
      mediaType: attachment.mimeType.startsWith('image/') ? 'image' : 'document',
      storageProvider: driver.name,
      storagePath: storageKey,
      originalFilename: attachment.originalFilename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      checksum: attachment.checksum,
      uploadedByUserId
    }
  })

  return asset.id
}
