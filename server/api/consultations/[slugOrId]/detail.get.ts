import { parseConsultationSlugOrId, resolveConsultationBySlugOrId } from '~~/server/utils/consultations/slug'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { serializeConsultationLink } from '~~/server/utils/serializers/consultationLink'
import { listAttachments } from '~~/server/utils/assets/attachments'
import { listGalleryImages } from '~~/server/utils/assets/gallery'
import { getCoverImagesByOwner } from '~~/server/utils/assets/cover'
import type { ConsultationRelatedLinkModel, TopicModel } from '~~/prisma/generated/models'

function isPubliclyVisible(entity: { visibility: string }): boolean {
  return entity.visibility !== 'hidden'
}

/**
 * Endpoint de vista (BFF) para el detalle público de una consulta.
 *
 * Compone en una sola respuesta lo que la pantalla `/consultas/:slug` necesita
 * —consulta + temas + enlaces— evitando las tres llamadas independientes que
 * hacía la página. La autorización sigue siendo por recurso: quien puede
 * gestionar la consulta (admin de plataforma o gestor con `ConsultationMembership`)
 * ve la vista admin y los temas ocultos; el resto ve solo la vista pública y
 * los temas visibles. Ver la excepción documentada en
 * `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const identifier = parseConsultationSlugOrId(event)
  const ctx = await getAuthContext(event)
  const userId = ctx.user?.id ?? null

  const consultation = await resolveConsultationBySlugOrId(identifier, {
    section: true,
    categoryAssignments: {
      include: { category: true },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { id: 'asc' }]
    },
    consultationTags: {
      include: { tag: true }
    },
    topics: {
      orderBy: { displayOrder: 'asc' }
    },
    relatedLinks: {
      orderBy: { displayOrder: 'asc' }
    },
    ...(userId
      ? {
          memberships: {
            where: { userId },
            select: { id: true }
          }
        }
      : {})
  })

  const isAdminView = ctx.isPlatformAdmin
    || ('memberships' in consultation && Array.isArray(consultation.memberships) && consultation.memberships.length > 0)

  if (!isAdminView && !isPubliclyVisible(consultation)) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  // `resolveConsultationBySlugOrId` no propaga el tipo de los `include`; tipamos
  // las relaciones cargadas con los modelos generados por Prisma.
  const topics = (consultation as unknown as { topics: TopicModel[] }).topics
  const relatedLinks = (consultation as unknown as { relatedLinks: ConsultationRelatedLinkModel[] }).relatedLinks

  // Los no-gestores solo ven temas visibles: nunca se filtran temas ocultos al
  // público desde este endpoint.
  const visibleTopics = isAdminView
    ? topics
    : topics.filter(isPubliclyVisible)

  const attachments = await listAttachments(
    { ownerType: 'consultation', ownerId: consultation.id },
    { adminView: isAdminView }
  )

  const gallery = await listGalleryImages(
    { ownerType: 'consultation', ownerId: consultation.id },
    { adminView: isAdminView }
  )

  // Portadas de los temas del carrusel, resueltas por lote para evitar el N+1.
  const topicCovers = await getCoverImagesByOwner(
    'topic',
    visibleTopics.map(topic => topic.id),
    { adminView: isAdminView }
  )

  const attachCover = (topic: TopicModel) => {
    const cover = topicCovers.get(topic.id)
    return {
      ...topic,
      coverUrl: cover?.url ?? null,
      coverAltText: cover?.altText ?? null
    }
  }

  if (isAdminView) {
    return {
      consultation: { ...serializeConsultation(consultation, 'admin'), canManage: true },
      topics: visibleTopics.map(topic => serializeTopic(attachCover(topic), 'admin')),
      links: relatedLinks.map(link => serializeConsultationLink(link, 'admin')),
      attachments,
      gallery
    }
  }

  return {
    consultation: { ...serializeConsultation(consultation, 'public'), canManage: false },
    topics: visibleTopics.map(topic => serializeTopic(attachCover(topic), 'public')),
    links: relatedLinks.map(link => serializeConsultationLink(link, 'public')),
    attachments,
    gallery
  }
})
