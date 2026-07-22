import { parsePositiveIntParam } from '~~/server/utils/http/params'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const tagId = parsePositiveIntParam(event, 'id', 'etiqueta')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Etiqueta no encontrada'
    })
  }

  try {
    await prisma.tag.delete({
      where: { id: tagId }
    })
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2003') {
      throw createError({
        statusCode: 409,
        message: 'No se puede eliminar una etiqueta en uso por consultas o temas'
      })
    }

    throw error
  }

  setResponseStatus(event, 204)
})
