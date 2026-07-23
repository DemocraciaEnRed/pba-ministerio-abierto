import { parseTopicSlugOrId, resolveTopicBySlugOrId } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { serializeTopicLink } from '~~/server/utils/serializers/topicLink'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'
import { deriveParticipationState } from '~~/server/utils/participation-state'
import { listAttachments } from '~~/server/utils/assets/attachments'
import { listGalleryImages } from '~~/server/utils/assets/gallery'
import { getCoverImage, getCoverImagesByOwner } from '~~/server/utils/assets/cover'
import type { TopicModel, TopicRelatedLinkModel } from '~~/prisma/generated/models'

function isPubliclyVisible(entity: { visibility: string }): boolean {
  return entity.visibility !== 'hidden'
}

/**
 * Endpoint de vista (BFF) para el detalle público de un tema.
 *
 * Compone en una sola respuesta lo que la pantalla
 * `/consultas/:slug/temas/:temaSlug` necesita —tema + enlaces + adjuntos, un
 * resumen liviano de la consulta padre (para el hero y el breadcrumb) y los
 * temas hermanos (para el carrusel de "otros temas")— evitando las tres
 * llamadas independientes que hacía la página y sumando datos que antes no
 * estaban disponibles en el cliente.
 *
 * La autorización sigue siendo por recurso: quien puede gestionar la consulta
 * (admin de plataforma o gestor con `ConsultationMembership`) ve la vista admin
 * y los temas ocultos; el resto ve solo la vista pública y los temas visibles.
 * Ver la excepción documentada en `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicIdentifier = parseTopicSlugOrId(event, 'topicSlugOrId')
  const ctx = await getAuthContext(event)

  // Resumen liviano de la consulta padre: solo lo que el hero y el breadcrumb
  // necesitan. No se serializa la consulta completa a propósito.
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, slug: true, title: true, visibility: true, startsAt: true, endsAt: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const topic = await resolveTopicBySlugOrId(
    consultationId,
    topicIdentifier,
    {
      relatedLinks: { orderBy: { displayOrder: 'asc' } }
    }
  )

  const isAdminView = ctx.isPlatformAdmin
    || await prisma.consultationMembership.findFirst({
      where: {
        userId: ctx.user?.id ?? -1,
        consultationId
      }
    }) !== null

  if (!isAdminView && !isPubliclyVisible(topic)) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  // Temas hermanos para el carrusel. Los no-gestores solo ven temas visibles.
  const siblings = await prisma.topic.findMany({
    where: { consultationId },
    orderBy: { displayOrder: 'asc' }
  })
  const visibleSiblings = isAdminView
    ? siblings
    : siblings.filter(isPubliclyVisible)

  // `resolveTopicBySlugOrId` no propaga el tipo de los `include`; tipamos la
  // relación cargada con el modelo generado por Prisma.
  const relatedLinks = (topic as unknown as { relatedLinks: TopicRelatedLinkModel[] }).relatedLinks

  const attachments = await listAttachments(
    { ownerType: 'topic', ownerId: topic.id },
    { adminView: isAdminView }
  )

  const gallery = await listGalleryImages(
    { ownerType: 'topic', ownerId: topic.id },
    { adminView: isAdminView }
  )

  // Portada propia del tema (fondo del hero) y portadas de los hermanos
  // (carrusel de "otros temas"), resueltas por lote para evitar el N+1.
  const topicCover = await getCoverImage(
    { ownerType: 'topic', ownerId: topic.id },
    { adminView: isAdminView }
  )
  const topicWithCover = {
    ...(topic as unknown as TopicModel),
    coverUrl: topicCover?.url ?? null,
    coverAltText: topicCover?.altText ?? null
  }

  const siblingCovers = await getCoverImagesByOwner(
    'topic',
    visibleSiblings.map(sibling => sibling.id),
    { adminView: isAdminView }
  )
  const attachSiblingCover = (sibling: TopicModel) => {
    const cover = siblingCovers.get(sibling.id)
    return {
      ...sibling,
      coverUrl: cover?.url ?? null,
      coverAltText: cover?.altText ?? null
    }
  }
  const consultationSummary = {
    slug: consultation.slug,
    title: consultation.title,
    visibility: consultation.visibility,
    participationState: deriveParticipationState({
      startsAt: consultation.startsAt,
      endsAt: consultation.endsAt
    })
  }

  if (isAdminView) {
    return {
      consultation: consultationSummary,
      topic: { ...serializeTopic(topicWithCover, 'admin'), canManage: true },
      topics: visibleSiblings.map(sibling => serializeTopic(attachSiblingCover(sibling as unknown as TopicModel), 'admin')),
      links: relatedLinks.map(link => serializeTopicLink(link, 'admin')),
      attachments,
      gallery
    }
  }

  return {
    consultation: consultationSummary,
    topic: { ...serializeTopic(topicWithCover, 'public'), canManage: false },
    topics: visibleSiblings.map(sibling => serializeTopic(attachSiblingCover(sibling as unknown as TopicModel), 'public')),
    links: relatedLinks.map(link => serializeTopicLink(link, 'public')),
    attachments,
    gallery
  }
})
