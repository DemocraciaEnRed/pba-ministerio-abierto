import { UpdateObservatoryMetricSchema } from '#shared/schemas/observatory'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeObservatoryMetric } from '~~/server/utils/serializers/observatoryMetric'

// Solo edición: las métricas son un catálogo fijo sembrado, sin altas ni bajas.
export default defineEventHandler(async (event) => {
  const metricId = parsePositiveIntParam(event, 'id', 'métrica')
  const body = await parseBody(event, UpdateObservatoryMetricSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.observatoryMetric.findUnique({
    where: { id: metricId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Métrica no encontrada'
    })
  }

  const updated = await prisma.observatoryMetric.update({
    where: { id: metricId },
    data: {
      label: body.label,
      value: body.value
    }
  })

  return serializeObservatoryMetric(updated, 'admin')
})
