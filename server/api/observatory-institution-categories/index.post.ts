import { CreateObservatoryInstitutionCategorySchema } from '#shared/schemas/observatory'
import { serializeObservatoryInstitutionCategory } from '~~/server/utils/serializers/observatoryInstitution'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateObservatoryInstitutionCategorySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  try {
    const created = await prisma.observatoryInstitutionCategory.create({ data: body })

    setResponseStatus(event, 201)
    return serializeObservatoryInstitutionCategory(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una categoría de instituciones con ese slug'
      })
    }

    throw error
  }
})
