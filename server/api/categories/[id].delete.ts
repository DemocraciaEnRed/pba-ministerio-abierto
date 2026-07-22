import { parsePositiveIntParam } from '~~/server/utils/http/params'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const categoryId = parsePositiveIntParam(event, 'id', 'categoría')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

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

  try {
    await prisma.category.delete({
      where: { id: categoryId }
    })
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2003') {
      throw createError({
        statusCode: 409,
        message: 'No se puede eliminar una categoría en uso por consultas'
      })
    }

    throw error
  }

  setResponseStatus(event, 204)
})
