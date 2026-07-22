import { CategoriesQuerySchema } from '#shared/schemas/taxonomy'
import { serializeCategory } from '~~/server/utils/serializers/category'

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, CategoriesQuerySchema)
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const categories = await prisma.category.findMany({
    where: {
      ...(isAdmin ? {} : { isActive: true }),
      ...(query.sectionSlug ? { section: { slug: query.sectionSlug } } : {})
    },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }]
  })

  if (isAdmin) {
    return categories.map(category => serializeCategory(category, 'admin'))
  }

  return categories.map(category => serializeCategory(category, 'public'))
})
