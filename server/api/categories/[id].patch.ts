import { PatchCategorySchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeCategory } from '~~/server/utils/serializers/category'

export default defineEventHandler(async (event) => {
  const categoryId = parsePositiveIntParam(event, 'id', 'categoría')
  const body = await parseBody(event, PatchCategorySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Categoría no encontrada'
    })
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: body
  })

  return serializeCategory(updated, 'admin')
})
