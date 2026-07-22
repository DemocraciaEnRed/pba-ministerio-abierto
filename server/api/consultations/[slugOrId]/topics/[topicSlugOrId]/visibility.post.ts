import { assertTopicMechanismConfigValid } from '~~/server/utils/topics/config-lock'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { SetTopicVisibilitySchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

// Transiciones de visibilidad permitidas. Archivar es terminal.
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  hidden: ['visible', 'archived'],
  visible: ['hidden', 'archived'],
  archived: []
}

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicVisibilitySchema)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { topicTags: { select: { tagId: true } } }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  // Sin cambio de visibilidad: no-op.
  if (body.visibility === topic.visibility) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializeTopic(topic as any, 'admin')
  }

  if (!(ALLOWED_TRANSITIONS[topic.visibility] ?? []).includes(body.visibility)) {
    throw createError({
      statusCode: 409,
      message: `No se puede cambiar la visibilidad del tema de "${topic.visibility}" a "${body.visibility}".`
    })
  }

  const data: { visibility: typeof body.visibility, configLockedAt?: Date } = {
    visibility: body.visibility
  }

  // Al hacer visible: si el tema tiene un mecanismo seleccionado, su
  // configuración debe estar completa. Se fija la configuración (config lock)
  // para preservar la integridad aunque luego se vuelva a ocultar.
  if (body.visibility === 'visible') {
    await assertTopicMechanismConfigValid({
      id: topic.id,
      mechanismType: topic.mechanismType,
      surveyMinSelections: topic.surveyMinSelections
    })
    if (topic.configLockedAt === null) {
      data.configLockedAt = new Date()
    }
  }

  const updated = await prisma.topic.update({
    where: { id: topicId },
    data,
    include: { topicTags: { select: { tagId: true } } }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTopic(updated as any, 'admin')
})
