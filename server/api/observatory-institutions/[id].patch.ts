import { PatchObservatoryInstitutionSchema } from '#shared/schemas/observatory'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeObservatoryInstitution } from '~~/server/utils/serializers/observatoryInstitution'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

// La baja es lógica (`isActive: false`): no hay DELETE porque los aportes ya
// recibidos referencian la institución y conservan su nombre.
export default defineEventHandler(async (event) => {
  const institutionId = parsePositiveIntParam(event, 'id', 'institución')
  const body = await parseBody(event, PatchObservatoryInstitutionSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.observatoryInstitution.findUnique({
    where: { id: institutionId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Institución no encontrada' })
  }

  if (body.categoryId !== undefined) {
    const category = await prisma.observatoryInstitutionCategory.findUnique({
      where: { id: body.categoryId },
      select: { id: true }
    })

    if (!category) {
      throw createError({ statusCode: 422, message: 'La categoría indicada no existe' })
    }
  }

  try {
    const updated = await prisma.observatoryInstitution.update({
      where: { id: institutionId },
      data: body
    })

    return serializeObservatoryInstitution(updated, 'admin')
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
