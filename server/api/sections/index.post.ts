import { CreateSectionSchema } from '#shared/schemas/taxonomy'
import { serializeSection } from '~~/server/utils/serializers/section'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateSectionSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  try {
    const created = await prisma.section.create({
      data: body
    })

    setResponseStatus(event, 201)
    return serializeSection(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una sección con ese slug'
      })
    }

    throw error
  }
})
