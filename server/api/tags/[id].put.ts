import { UpdateTagSchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeTag } from '~~/server/utils/serializers/tag'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const tagId = parsePositiveIntParam(event, 'id', 'etiqueta')
  const body = await parseBody(event, UpdateTagSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

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
    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: body
    })

    return serializeTag(updated, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe otra etiqueta con ese slug'
      })
    }

    throw error
  }
})
