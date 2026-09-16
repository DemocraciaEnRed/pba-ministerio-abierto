import { serializeObservatoryMetric } from '~~/server/utils/serializers/observatoryMetric'

// Lectura pública para la portada; platform-admin recibe además timestamps.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const metrics = await prisma.observatoryMetric.findMany({
    orderBy: { displayOrder: 'asc' }
  })

  if (isAdmin) {
    return metrics.map(metric => serializeObservatoryMetric(metric, 'admin'))
  }

  return metrics.map(metric => serializeObservatoryMetric(metric, 'public'))
})
