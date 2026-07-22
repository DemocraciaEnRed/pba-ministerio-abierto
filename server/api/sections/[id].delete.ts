import { parsePositiveIntParam } from '~~/server/utils/http/params'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const sectionId = parsePositiveIntParam(event, 'id', 'sección')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Sección no encontrada'
    })
  }

  const categoriesInSection = await prisma.category.count({
    where: { sectionId }
  })

  if (categoriesInSection > 0) {
    throw createError({
      statusCode: 409,
      message: 'No se puede eliminar una sección con categorías. Movelas o eliminalas primero.'
    })
  }

  try {
    await prisma.section.delete({
      where: { id: sectionId }
    })
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2003') {
      throw createError({
        statusCode: 409,
        message: 'No se puede eliminar una sección en uso'
      })
    }

    throw error
  }

  setResponseStatus(event, 204)
})
