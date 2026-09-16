import { PatchObservatoryInstitutionCategorySchema } from '#shared/schemas/observatory'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeObservatoryInstitutionCategory } from '~~/server/utils/serializers/observatoryInstitution'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

// La baja es lógica (`isActive: false`): no hay DELETE porque los aportes ya
// recibidos conservan el nombre de la categoría y no deben quedar huérfanos.
export default defineEventHandler(async (event) => {
  const categoryId = parsePositiveIntParam(event, 'id', 'categoría de instituciones')
  const body = await parseBody(event, PatchObservatoryInstitutionCategorySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.observatoryInstitutionCategory.findUnique({
    where: { id: categoryId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Categoría de instituciones no encontrada' })
  }

  try {
    const updated = await prisma.observatoryInstitutionCategory.update({
      where: { id: categoryId },
      data: body
    })

    return serializeObservatoryInstitutionCategory(updated, 'admin')
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
