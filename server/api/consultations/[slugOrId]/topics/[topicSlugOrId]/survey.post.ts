import { loadParticipationContext } from '~~/server/utils/topics/participation-guard'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { serializeSurveyParticipationSet } from '~~/server/utils/serializers/participation'
import { SurveyParticipationSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const body = await parseBody(event, SurveyParticipationSchema)
  const ctx = await getAuthContext(event)

  await assertCan(ctx, 'participate', { type: 'consultation', id: consultationId })
  const userId = ctx.user!.id

  const { topic } = await loadParticipationContext(consultationId, topicId, 'survey')

  // Opciones únicas elegidas por el usuario.
  const optionIds = [...new Set(body.surveyOptionIds)]

  // Todas las opciones deben pertenecer al tema y estar activas.
  const validOptions = await prisma.surveyOption.findMany({
    where: { id: { in: optionIds }, topicId: topic.id, isActive: true },
    select: { id: true }
  })

  if (validOptions.length !== optionIds.length) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'surveyOptionIds', message: 'Alguna opción no pertenece al tema o no está activa' }]
    })
  }

  // Reglas de cantidad configuradas en el tema.
  const config = await prisma.topic.findUnique({
    where: { id: topic.id },
    select: { surveyMinSelections: true, surveyMaxSelections: true }
  })
  const min = config?.surveyMinSelections ?? 1
  const max = config?.surveyMaxSelections ?? null

  if (optionIds.length < min) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'surveyOptionIds', message: `Elegí al menos ${min} ${min === 1 ? 'opción' : 'opciones'}` }]
    })
  }

  if (max !== null && optionIds.length > max) {
    throw createError({
      statusCode: 422,
      message: 'Validation error',
      data: [{ field: 'surveyOptionIds', message: `Elegí como máximo ${max} ${max === 1 ? 'opción' : 'opciones'}` }]
    })
  }

  // Reemplazamos el conjunto de respuestas del usuario de forma atómica.
  await prisma.$transaction([
    prisma.surveyParticipation.deleteMany({
      where: { topicId: topic.id, userId }
    }),
    prisma.surveyParticipation.createMany({
      data: optionIds.map(surveyOptionId => ({ topicId: topic.id, userId, surveyOptionId }))
    })
  ])

  setResponseStatus(event, 201)
  return serializeSurveyParticipationSet(topic.id, userId, optionIds)
})
