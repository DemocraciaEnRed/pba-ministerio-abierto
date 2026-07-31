import { serializeRegionalMeetingMetric } from '~~/server/utils/serializers/regionalMeetingMetric'

// Lectura pública: las métricas de alcance se muestran en la landing.
// Los administradores reciben la vista con metadatos (timestamps).
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const metrics = await prisma.regionalMeetingMetric.findMany({
    orderBy: { displayOrder: 'asc' }
  })

  if (isAdmin) {
    return metrics.map(metric => serializeRegionalMeetingMetric(metric, 'admin'))
  }

  return metrics.map(metric => serializeRegionalMeetingMetric(metric, 'public'))
})
