import { UpdateCategorySchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeCategory } from '~~/server/utils/serializers/category'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const categoryId = parsePositiveIntParam(event, 'id', 'categoría')
  const body = await parseBody(event, UpdateCategorySchema)
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

  const section = await prisma.section.findUnique({
    where: { id: body.sectionId },
    select: { id: true }
  })

  if (!section) {
    throw createError({
      statusCode: 422,
      message: 'La sección indicada no existe'
    })
  }

  try {
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: body
    })

    return serializeCategory(updated, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe otra categoría con ese slug en esta sección'
      })
    }

    throw error
  }
})
