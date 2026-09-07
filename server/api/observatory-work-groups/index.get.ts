import { serializeObservatoryWorkGroup } from '~~/server/utils/serializers/observatoryWorkGroup'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const groups = await prisma.observatoryWorkGroup.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  if (isAdmin) {
    return groups.map(group => serializeObservatoryWorkGroup(group, 'admin'))
  }

  return groups.map(group => serializeObservatoryWorkGroup(group, 'public'))
})
