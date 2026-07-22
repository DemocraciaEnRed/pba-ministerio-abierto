import { assertTopicConfigEditable } from '~~/server/utils/topics/config-lock'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeTopic } from '~~/server/utils/serializers/topic'
import { SetTopicMechanismConfigSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SetTopicMechanismConfigSchema)
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

  // La configuración del método solo se ajusta con la configuración desbloqueada.
  await assertTopicConfigEditable({
    id: topic.id,
    visibility: topic.visibility,
    configLockedAt: topic.configLockedAt
  })

  // La consigna (questionText) es propia del mecanismo: solo se puede definir
  // cuando el tema tiene un método de participación asignado.
  if (body.questionText !== undefined && topic.mechanismType === null) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'questionText', message: 'Definí un método de participación antes de cargar la consigna.' }]
    })
  }

  // El máximo (si se define) no puede quedar por debajo del mínimo efectivo.
  const nextMin = body.surveyMinSelections ?? topic.surveyMinSelections
  const nextMax = body.surveyMaxSelections === undefined ? topic.surveyMaxSelections : body.surveyMaxSelections
  if (nextMax !== null && nextMax < nextMin) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'surveyMaxSelections', message: 'El máximo no puede ser menor que el mínimo' }]
    })
  }

  const updated = await prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(body.questionText !== undefined ? { questionText: body.questionText } : {}),
      ...(body.voteAllowAbstain !== undefined ? { voteAllowAbstain: body.voteAllowAbstain } : {}),
      ...(body.surveyMinSelections !== undefined ? { surveyMinSelections: body.surveyMinSelections } : {}),
      ...(body.surveyMaxSelections !== undefined ? { surveyMaxSelections: body.surveyMaxSelections } : {})
    },
    include: { topicTags: { select: { tagId: true } } }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeTopic(updated as any, 'admin')
})
