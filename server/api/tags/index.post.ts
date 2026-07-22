import { CreateTagSchema } from '#shared/schemas/taxonomy'
import { serializeTag } from '~~/server/utils/serializers/tag'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateTagSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  try {
    const created = await prisma.tag.create({
      data: body
    })

    setResponseStatus(event, 201)
    return serializeTag(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una etiqueta con ese slug'
      })
    }

    throw error
  }
})
