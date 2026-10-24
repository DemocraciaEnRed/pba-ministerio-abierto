import { TagsQuerySchema } from '#shared/schemas/taxonomy'
import { serializeTag } from '~~/server/utils/serializers/tag'

export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, TagsQuerySchema)
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const tags = await prisma.tag.findMany({
    where: query.sectionSlug
      ? {
          isActive: true,
          consultationTags: {
            some: {
              consultation: {
                section: { slug: query.sectionSlug },
                visibility: { not: 'hidden' }
              }
            }
          }
        }
      : isAdmin ? undefined : { isActive: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }]
  })

  if (isAdmin) {
    return tags.map(tag => serializeTag(tag, 'admin'))
  }

  return tags.map(tag => serializeTag(tag, 'public'))
})
