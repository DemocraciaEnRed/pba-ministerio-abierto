import type { PageCardProps } from '@nuxt/ui'

export type Visibility = 'hidden' | 'visible' | 'archived'
export type ParticipationState = 'scheduled' | 'open' | 'closed'
export type ConsultationFormat = 'single' | 'multiple'
export type ResultsVisibility = 'hidden' | 'participants_only' | 'public'

/**
 * Detalle público de una consulta, tal como lo devuelve `GET /api/consultations/:slug`.
 */
export interface ConsultationDetail {
  id: number
  slug: string
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
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
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
 * Tema de una consulta, tal como lo devuelve `GET /api/consultations/:slug/topics` (vista pública).
 */
export interface ConsultationTopic {
  id: number
  consultationId: number
  slug: string
  title: string
  summary: string | null
  body: string | null
  questionText: string | null
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
 * Resumen liviano de un tema embebido en el listado admin de consultas
 * (`GET /api/admin/consultations`). Solo lo necesario para un pantallazo.
 */
export interface ConsultationTopicSummary {
  id: number
  slug: string
  title: string
  visibility: Visibility
  participationState: ParticipationState
}

/**
 * Enlace relacionado de un tema, tal como lo devuelve
 * `GET /api/consultations/:slug/topics/:temaSlug/links` (vista pública).
 */
export interface TopicLink {
  id: number
  label: string
  url: string
  displayOrder: number
}

/**
 * Adjunto de un tema, tal como lo devuelve
 * `GET /api/consultations/:slug/topics/:temaSlug/attachments`.
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
 * devuelven `GET /api/consultations/:slug/gallery` y el endpoint análogo de
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
 * (`GET /api/consultations/:slug/topics/:temaSlug/detail`). Solo lo que el hero
 * y el breadcrumb necesitan.
 */
export interface TopicParentConsultation {
  slug: string
  title: string
  visibility: Visibility
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

/**
 * Item del listado público de consultas (`GET /api/consultations`, vista
 * pública). Es lo que consume la card de consulta en `/consultas` y la HOME.
 */
export interface PublicConsultationListItem {
  id: number
  slug: string
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
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
  /** Portada para la card; `null` cuando no hay imagen cargada. */
  coverUrl: string | null
  coverAltText: string | null
  /** Cantidad de temas visibles; `null` cuando el endpoint no la calcula. */
  topicsCount: number | null
}

/**
 * Item del listado admin de consultas (`GET /api/admin/consultations`, vista
 * admin). Incluye los campos de gestión más el resumen de temas embebidos.
 */
export interface AdminConsultationListItem {
  id: number
  slug: string
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
  categories: ConsultationCategory[]
  tags: ConsultationTaxonomy[]
  topics?: ConsultationTopicSummary[]
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
 * comentarios (`GET /api/consultations/:slug/comments`). El listado de primer
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
