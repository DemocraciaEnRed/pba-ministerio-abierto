import { serializeTag } from '~~/server/utils/serializers/tag'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const tags = await prisma.tag.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }]
  })

  if (isAdmin) {
    return tags.map(tag => serializeTag(tag, 'admin'))
  }

  return tags.map(tag => serializeTag(tag, 'public'))
})
