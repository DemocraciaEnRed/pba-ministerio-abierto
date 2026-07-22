import { UpdatePageSchema } from '#shared/schemas/page'
import { serializePage } from '~~/server/utils/serializers/page'
import { parsePageSlug } from '~~/server/utils/pages/slug'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const slug = parsePageSlug(event)
  const body = await parseBody(event, UpdatePageSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.sitePage.findUnique({
    where: { slug },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Página no encontrada'
    })
  }

  try {
    const updated = await prisma.sitePage.update({
      where: { slug },
      data: {
        title: body.title,
        slug: body.slug,
        content: body.content,
        isPublished: body.isPublished
      }
    })

    return serializePage(updated, 'admin')
  } catch (error) {
    const code = getPrismaErrorCode(error)

    if (code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe otra página con ese slug'
      })
    }

    throw error
  }
})
