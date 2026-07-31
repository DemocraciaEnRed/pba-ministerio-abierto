import { UpdateMetricSchema } from '#shared/schemas/regional-meetings'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeRegionalMeetingMetric } from '~~/server/utils/serializers/regionalMeetingMetric'

// Solo edición: las métricas son un catálogo fijo sembrado. No se crean ni eliminan.
export default defineEventHandler(async (event) => {
  const metricId = parsePositiveIntParam(event, 'id', 'métrica')
  const body = await parseBody(event, UpdateMetricSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.regionalMeetingMetric.findUnique({
    where: { id: metricId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Métrica no encontrada'
    })
  }

  const updated = await prisma.regionalMeetingMetric.update({
    where: { id: metricId },
    data: {
      label: body.label,
      value: body.value
    }
  })

  return serializeRegionalMeetingMetric(updated, 'admin')
})
