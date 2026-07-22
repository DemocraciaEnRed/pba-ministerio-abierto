import { assertTopicConfigEditable } from '~~/server/utils/topics/config-lock'
import { UpdateSurveyOptionSchema } from '#shared/schemas/topic'

export default defineEventHandler(async (event) => {
  const optionId = parseInt(getRouterParam(event, 'optionId') || '')
  if (!Number.isInteger(optionId) || optionId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'El ID de la opción de encuesta es inválido'
    })
  }

  const ctx = await getAuthContext(event)

  const option = await prisma.surveyOption.findUnique({
    where: { id: optionId },
    include: { topic: { select: { id: true, consultationId: true, visibility: true, configLockedAt: true } } }
  })

  if (!option) {
    throw createError({
      statusCode: 404,
      message: 'Opción de encuesta no encontrada'
    })
  }

  await assertCan(ctx, 'update', { type: 'consultation', id: option.topic.consultationId })

  if (event.node.req.method === 'PUT') {
    const body = await parseBody(event, UpdateSurveyOptionSchema)

    const updated = await prisma.surveyOption.update({
      where: { id: optionId },
      data: {
        label: body.label,
        description: body.description,
        displayOrder: body.displayOrder,
        isActive: body.isActive
      }
    })

    return updated
  }

  if (event.node.req.method === 'DELETE') {
    // Eliminar una opción solo se permite con la configuración desbloqueada.
    // Además, la FK Restrict impide borrar una opción que ya tenga respuestas.
    await assertTopicConfigEditable({
      id: option.topic.id,
      visibility: option.topic.visibility,
      configLockedAt: option.topic.configLockedAt
    })

    await prisma.surveyOption.delete({
      where: { id: optionId }
    })

    setResponseStatus(event, 204)
  }
})
