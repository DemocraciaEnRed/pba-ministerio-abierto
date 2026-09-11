import { CreateObservatoryInstitutionSchema } from '#shared/schemas/observatory'
import { serializeObservatoryInstitution } from '~~/server/utils/serializers/observatoryInstitution'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateObservatoryInstitutionSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  const category = await prisma.observatoryInstitutionCategory.findUnique({
    where: { id: body.categoryId },
    select: { id: true }
  })

  if (!category) {
    throw createError({ statusCode: 422, message: 'La categoría indicada no existe' })
  }

  try {
    const created = await prisma.observatoryInstitution.create({ data: body })

    setResponseStatus(event, 201)
    return serializeObservatoryInstitution(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una institución con ese slug'
      })
    }

    throw error
  }
})
