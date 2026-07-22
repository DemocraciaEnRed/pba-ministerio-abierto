import { CreateCategorySchema } from '#shared/schemas/taxonomy'
import { serializeCategory } from '~~/server/utils/serializers/category'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateCategorySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

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
    const created = await prisma.category.create({
      data: body
    })

    setResponseStatus(event, 201)
    return serializeCategory(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una categoría con ese slug en esta sección'
      })
    }

    throw error
  }
})
