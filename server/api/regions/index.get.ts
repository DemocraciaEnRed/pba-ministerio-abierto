import { serializeRegion } from '~~/server/utils/serializers/region'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' }
  })

  if (isAdmin) {
    return regions.map(region => serializeRegion(region, 'admin'))
  }

  return regions.map(region => serializeRegion(region, 'public'))
})
