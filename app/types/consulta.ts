import type { PageCardProps } from '@nuxt/ui'
import type { AttachmentFileDTO } from '#shared/utils/attachments'

export type Visibility = 'hidden' | 'visible' | 'archived'
export type ParticipationState = 'scheduled' | 'open' | 'closed'
export type ConsultationFormat = 'single' | 'multiple'
export type ResultsVisibility = 'hidden' | 'participants_only' | 'public'

/**
 * Detalle público de una consulta, tal como lo devuelve `GET /api/consultations//:id`.
 */
export interface ConsultationDetail {
  id: number
  slug: string
  /** URL pública canónica (`/{seccion}/{id}/{nombre}`). */
  publicPath: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  visibility: Visibility
  participationState: ParticipationState
  featured: boolean
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  closedMessage: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  resultsVisibility: ResultsVisibility
  section: ConsultationTaxonomy | null
  region: ConsultationTaxonomy | null
  observatoryWorkGroups: ConsultationWorkGroup[]
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
  /** Portada de la consulta para el hero; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Encuentro presencial (Encuentros Regionales); `null` si no tiene. */
  regionalMeeting: RegionalMeetingSummary | null
  /** Indica si el usuario actual puede gestionar la consulta (admin o gestor). */
  canManage?: boolean
}

/**
 * Item de metadata que se muestra como tarjeta dentro del hero de una consulta.
 * La forma coincide con las props de `UPageCard`.
 */
export type ConsultaHeroMetadata = PageCardProps

export type MechanismType = 'support' | 'vote' | 'survey'

/**
 * Tema de una consulta, tal como lo devuelve `GET /api/consultations//:id/topics` (vista pública).
 */
export interface ConsultationTopic {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  questionText: string | null
  commentsEnabled: boolean
  commentsGuidance: string | null
  displayOrder: number
  participationStartsAt: string | null
  participationEndsAt: string | null
  visibility: Visibility
  mechanismType: MechanismType | null
  participationState: ParticipationState
  participationOpen: boolean
  /** Portada del tema para la card; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Indica si el usuario actual puede gestionar el tema/consulta (admin o gestor). */
  canManage?: boolean
}

/**
 * Enlace relacionado de un tema, tal como lo devuelve
 * `GET /api/consultations//:id/topics/:temaSlug/links` (vista pública).
 */
export interface TopicLink {
  id: number
  label: string
  url: string
  displayOrder: number
}

/**
 * Adjunto de un tema, tal como lo devuelve
 * `GET /api/consultations//:id/topics/:temaSlug/attachments`.
 */
export interface TopicAttachment {
  id: number
  displayOrder: number
  title: string | null
  filename: string | null
  mediaType: 'image' | 'document' | 'video' | 'audio' | 'other'
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
}

/**
 * Imagen de galería (vista pública) de una consulta o tema, tal como la
 * devuelven `GET /api/consultations//:id/gallery` y el endpoint análogo de
 * temas.
 */
export interface GalleryImage {
  id: number
  displayOrder: number
  title: string | null
  altText: string | null
  description: string | null
  url: string | null
}

/**
 * Resumen liviano de la consulta padre embebido en el detalle de un tema
 * (`GET /api/consultations//:id/topics/:temaSlug/detail`). Solo lo que el hero
 * y el breadcrumb necesitan.
 */
export interface TopicParentConsultation {
  id: number
  slug: string
  /** URL pública canónica de la consulta. */
  publicPath: string
  title: string
  visibility: Visibility
  startsAt: string | null
  participationState: ParticipationState
}

/**
 * Respuesta del endpoint de vista (BFF) del detalle de un tema: compone el tema
 * con sus enlaces y adjuntos, la consulta padre y los temas hermanos.
 */
export interface TopicDetailResponse {
  consultation: TopicParentConsultation
  topic: ConsultationTopic
  topics: ConsultationTopic[]
  links: TopicLink[]
  attachments: TopicAttachment[]
  gallery: GalleryImage[]
}

/**
 * Taxonomía asociada a una consulta (sección, categoría o etiqueta) tal como
 * la exponen las vistas serializadas.
 */
export interface ConsultationTaxonomy {
  id: number
  slug: string
  name: string
}

export interface ConsultationCategory extends ConsultationTaxonomy {
  isPrimary: boolean
}

/** Grupo de trabajo del Observatorio, con su presentación para pintar chips. */
export interface ConsultationWorkGroup extends ConsultationTaxonomy {
  color: string
  iconColor: string
  icon: string
}

/**
 * Item del listado público de consultas (`GET /api/consultations`, vista
 * pública). Es lo que consume la card de consulta en los listados de sección y la HOME.
 */
export interface PublicConsultationListItem {
  id: number
  slug: string
  /** URL pública canónica (`/{seccion}/{id}/{nombre}`). */
  publicPath: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  visibility: Visibility
  participationState: ParticipationState
  featured: boolean
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  closedMessage: string | null
  resultsVisibility: ResultsVisibility
  section: ConsultationTaxonomy | null
  region: ConsultationTaxonomy | null
  observatoryWorkGroups: ConsultationWorkGroup[]
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
  /** Portada para la card; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Cantidad de temas visibles; `null` cuando el endpoint no la calcula. */
  topicsCount: number | null
  /** Inscripción presencial; `null` si la instancia no tiene formulario. */
  registration: ConsultationRegistrationSummary | null
  /** Encuentro presencial (Encuentros Regionales); `null` si no tiene. */
  regionalMeeting?: RegionalMeetingSummary | null
}

/**
 * Datos del encuentro presencial de una consulta de Encuentros Regionales. En
 * la vista pública `registrationUrl` solo viene con la inscripción abierta.
 */
export interface RegionalMeetingSummary {
  location: string
  heldAt: string
  year: number
  registrationUrl: string | null
  registrationOpensAt: string | null
  registrationClosesAt: string | null
  registrationState: 'scheduled' | 'open' | 'closed' | null
}

/** Resumen del formulario de inscripción presencial de una instancia. */
export interface ConsultationRegistrationSummary {
  eventMode: 'in_person' | 'virtual' | 'hybrid'
  /** Página pública de inscripción. */
  path: string
  state: 'scheduled' | 'open' | 'closed'
  /** Fecha y hora del encuentro presencial. */
  eventAt: string
  opensAt: string
  closesAt: string
  venueName: string
  venueCity: string
}

/**
 * Item del listado admin de consultas (`GET /api/admin/consultations`, vista
 * admin). Incluye los campos de gestión más el resumen de temas embebidos.
 */
export interface AdminConsultationListItem {
  id: number
  slug: string
  /** URL pública canónica (`/{seccion}/{id}/{nombre}`). */
  publicPath: string
  title: string
  summary: string | null
  body: string | null
  consultationFormat: ConsultationFormat
  visibility: Visibility
  participationState: ParticipationState
  featured: boolean
  startsAt: string | null
  endsAt: string | null
  publishedAt: string | null
  closedMessage: string | null
  resultsVisibility: ResultsVisibility
  createdByUserId: number | null
  updatedByUserId: number | null
  createdAt: string
  updatedAt: string
  section: ConsultationTaxonomy | null
  region: ConsultationTaxonomy | null
  observatoryWorkGroups: ConsultationWorkGroup[]
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
  /** Si ya tiene un formulario de inscripción cargado; solo la completa el listado admin. */
  hasRegistrationForm?: boolean
}

export type CommentAuthorMode = 'citizen' | 'institution'
export type CommentReactionType = 'heart' | 'agree' | 'idea' | 'relevant' | 'deepen'

/** Orden del hilo de comentarios y respuestas. */
export type CommentOrder = 'recent' | 'oldest'

/**
 * Resumen de reacciones de un comentario: conteo por tipo y las reacciones
 * del usuario actual.
 */
export interface CommentReactionsSummary {
  counts: Record<CommentReactionType, number>
  mine: CommentReactionType[]
}

/**
 * Comentario en su vista pública, tal como lo devolverá el endpoint de
 * comentarios (`GET /api/consultations//:id/comments`). El listado de primer
 * nivel trae `replyCount`; las respuestas se cargan bajo demanda y paginadas
 * desde `GET /api/comments/:id/replies`.
 */
export interface PublicComment {
  id: number
  containerType: 'consultation' | 'topic'
  consultationId: number | null
  topicId: number | null
  parentCommentId: number | null
  body: string
  authorMode: CommentAuthorMode
  authorLabel: string | null
  authorAvatarUrl: string | null
  /** Cantidad de adjuntos (la descarga es exclusiva de gestores/admins). */
  attachmentCount: number
  reactions: CommentReactionsSummary
  createdAt: string
  updatedAt: string
  replyCount?: number
  replies?: PublicComment[]
}

/**
 * Metadatos de paginación devueltos por los endpoints paginados.
 */
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

/**
 * Respuesta paginada del hilo de respuestas de un comentario.
 */
export interface CommentRepliesResponse {
  items: PublicComment[]
  pagination: PaginationMeta
}

/** Ventana temporal del panel de actividad de comentarios. */
export type CommentMetricsRange = '7d' | '14d' | 'month' | 'all'

/**
 * Métricas agregadas de comentarios de un alcance (una consulta o un tipo de
 * consulta), tal como las devuelven los endpoints de panel.
 */
export interface CommentMetrics {
  range: CommentMetricsRange
  from: string | null
  to: string
  total: number
  topLevel: number
  replies: number
  hidden: number
  deleted: number
  previousTotal: number | null
  deltaAbs: number | null
  deltaPct: number | null
  allTimeTotal: number
  lastCommentAt: string | null
}

/** Estado de moderación de un comentario en la vista admin. */
export type CommentModerationStatus = 'visible' | 'hidden' | 'deleted'

/** Respuestas de un hilo agrupadas por estado de moderación. */
export interface CommentReplyCounts {
  total: number
  visible: number
  hidden: number
  deleted: number
}

/**
 * Comentario en su vista admin (bandeja de moderación, detalle y respuestas con
 * `view=moderation`). `replyCounts` solo viene en la bandeja por hilos.
 */
export interface AdminComment {
  id: number
  containerType: 'consultation' | 'topic'
  consultationId: number | null
  topicId: number | null
  parentCommentId: number | null
  body: string
  authorMode: CommentAuthorMode
  authorLabel: string | null
  authorEmail: string
  authorAvatarUrl: string | null
  authorUserId: number
  moderationStatus: CommentModerationStatus
  deletedAt: string | null
  topicTitle: string | null
  topicSlug: string | null
  attachments: AttachmentFileDTO[]
  reactions: CommentReactionsSummary
  replyCounts?: CommentReplyCounts
  createdAt: string
  updatedAt: string
}

/** Respuesta paginada de la bandeja de moderación o del hilo en modo moderación. */
export interface AdminCommentsResponse {
  items: AdminComment[]
  pagination: PaginationMeta
}

/** Orden de la bandeja de moderación. */
export type CommentModerationOrder = 'recent' | 'oldest' | 'mostReplied'

/** Entrada del registro de comentarios de la plataforma (`GET /api/admin/comments`). */
export interface AdminCommentLogEntry {
  id: number
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
  attachments: AttachmentFileDTO[]
  consultation: { id: number, slug: string, title: string }
  topic: { id: number, slug: string, title: string } | null
  createdAt: string
}

export interface AdminCommentLogResponse {
  items: AdminCommentLogEntry[]
  pagination: PaginationMeta
}
