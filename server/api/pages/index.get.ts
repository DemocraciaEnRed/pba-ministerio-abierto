import { serializePage } from '~~/server/utils/serializers/page'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const pages = await prisma.sitePage.findMany({
    where: isAdmin ? undefined : { isPublished: true },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
  })

  if (isAdmin) {
    return pages.map(page => serializePage(page, 'admin'))
  }

  return pages.map(page => serializePage(page, 'public'))
})
