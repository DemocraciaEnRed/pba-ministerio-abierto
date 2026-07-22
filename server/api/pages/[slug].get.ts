import { serializePage } from '~~/server/utils/serializers/page'
import { findPageBySlug, parsePageSlug } from '~~/server/utils/pages/slug'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const slug = parsePageSlug(event)

  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const page = await findPageBySlug(slug)

  if (!page || (!isAdmin && !page.isPublished)) {
    throw createError({
      statusCode: 404,
      message: 'Página no encontrada'
    })
  }

  if (isAdmin) {
    return serializePage(page, 'admin')
  }

  return serializePage(page, 'public')
})
