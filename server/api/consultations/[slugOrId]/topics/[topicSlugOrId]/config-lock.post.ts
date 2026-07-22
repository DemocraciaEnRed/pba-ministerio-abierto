import {
  assertTopicMechanismConfigValid,
  topicHasParticipation
} from '~~/server/utils/topics/config-lock'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { SetTopicConfigLockSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicConfigLockSchema)
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

  if (body.locked) {
    // Cerrar la configuración: si el tema tiene mecanismo, su configuración
    // debe estar completa antes de fijarla.
    await assertTopicMechanismConfigValid({
      id: topic.id,
      mechanismType: topic.mechanismType,
      surveyMinSelections: topic.surveyMinSelections
    })

    if (topic.configLockedAt) {
      // Ya estaba bloqueada: idempotente.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return serializeTopic(topic as any, 'admin')
    }

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: { configLockedAt: new Date() },
      include: { topicTags: { select: { tagId: true } } }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializeTopic(updated as any, 'admin')
  }

  // Reabrir la configuración: solo posible mientras el tema siga oculto y
  // sin participación. Visible/archivado quedan bloqueados por su visibilidad.
  if (topic.visibility !== 'hidden' || (await topicHasParticipation(topic.id))) {
    throw createError({
      statusCode: 409,
      message: 'No se puede reabrir la configuración: el tema ya no está oculto o tiene participación registrada.'
    })
  }

  if (!topic.configLockedAt) {
    // Ya estaba desbloqueada: idempotente.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializeTopic(topic as any, 'admin')
  }

  const updated = await prisma.topic.update({
    where: { id: topicId },
    data: { configLockedAt: null },
    include: { topicTags: { select: { tagId: true } } }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTopic(updated as any, 'admin')
})
