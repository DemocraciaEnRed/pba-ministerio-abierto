import { assertTopicConfigEditable } from '~~/server/utils/topics/config-lock'
import { resolveTopicIdFromParam } from '~~/server/utils/topics/slug'
import { CreateSurveyOptionSchema } from '#shared/schemas/topic'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const topicId = await resolveTopicIdFromParam(event, consultationId)
  const ctx = await getAuthContext(event)

  // Verify topic exists and belongs to consultation
  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  })

  if (!topic || topic.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  if (event.node.req.method === 'GET') {
    // List survey options
    const options = await prisma.surveyOption.findMany({
      where: { topicId },
      orderBy: { displayOrder: 'asc' }
    })

    return options
  }

  if (event.node.req.method === 'POST') {
    // Create survey option
    const body = await parseBody(event, CreateSurveyOptionSchema)
    await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

    // Topic must be a survey mechanism
    if (topic.mechanismType !== 'survey') {
      throw createError({
        statusCode: 400,
        message: 'El tema no es de tipo encuesta'
      })
    }

    // La estructura de opciones solo se puede modificar con la configuración desbloqueada.
    await assertTopicConfigEditable({
      id: topic.id,
      visibility: topic.visibility,
      configLockedAt: topic.configLockedAt
    })

    // Get max displayOrder
    const maxOrder = await prisma.surveyOption.aggregate({
      where: { topicId },
      _max: { displayOrder: true }
    })

    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    const option = await prisma.surveyOption.create({
      data: {
        ...body,
        displayOrder: body.displayOrder !== 0 ? body.displayOrder : nextOrder,
        topicId,
        isActive: true
      }
    })

    return option
  }

  throw createError({
    statusCode: 405,
    message: 'Método no permitido'
  })
})
