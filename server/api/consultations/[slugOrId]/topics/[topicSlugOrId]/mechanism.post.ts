import { assertTopicConfigEditable } from '~~/server/utils/topics/config-lock'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { SetTopicMechanismSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicMechanismSchema)
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

  // Sin cambio de mecanismo: no hay nada que hacer.
  if (body.mechanismType === topic.mechanismType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return serializeTopic(topic as any, 'admin')
  }

  // El mecanismo solo puede cambiarse mientras la configuración esté desbloqueada
  // (tema en borrador y sin participación). Si está bloqueado, se rechaza con 409
  // en lugar de borrar participación de forma silenciosa.
  await assertTopicConfigEditable({
    id: topic.id,
    visibility: topic.visibility,
    configLockedAt: topic.configLockedAt
  })

  // Al salir de 'survey' en borrador limpiamos las opciones huérfanas. Es seguro:
  // sin participación no hay respuestas que la FK Restrict deba proteger.
  if (topic.mechanismType === 'survey') {
    await prisma.surveyOption.deleteMany({ where: { topicId } })
  }

  // Al quitar el mecanismo, la consigna deja de tener sentido: se limpia para
  // no arrastrar una pregunta de un método que ya no existe.
  const clearQuestionText = body.mechanismType === null

  const updated = await prisma.topic.update({
    where: { id: topicId },
    data: {
      mechanismType: body.mechanismType,
      ...(clearQuestionText ? { questionText: null } : {})
    },
    include: { topicTags: { select: { tagId: true } } }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTopic(updated as any, 'admin')
})
