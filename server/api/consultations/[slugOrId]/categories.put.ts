import { SetConsultationCategoriesSchema } from '#shared/schemas/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, SetConsultationCategoriesSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const uniqueCategoryIds = Array.from(new Set(body.categories.map(category => category.categoryId)))
  if (uniqueCategoryIds.length !== body.categories.length) {
    throw createError({
      statusCode: 422,
      message: 'No podés repetir categorías en la asignación'
    })
  }

  if (uniqueCategoryIds.length > 0) {
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: uniqueCategoryIds },
        isActive: true
      },
      select: { id: true }
    })

    if (existingCategories.length !== uniqueCategoryIds.length) {
      throw createError({
        statusCode: 422,
        message: 'Alguna categoría no existe o está inactiva'
      })
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.consultationCategoryAssignment.deleteMany({
      where: { consultationId }
    })

    if (body.categories.length > 0) {
      await tx.consultationCategoryAssignment.createMany({
        data: body.categories.map(category => ({
          consultationId,
          categoryId: category.categoryId,
          isPrimary: category.isPrimary,
          displayOrder: category.displayOrder
        }))
      })
    }
  })

  const assignments = await prisma.consultationCategoryAssignment.findMany({
    where: { consultationId },
    include: {
      category: true
    },
    orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { id: 'asc' }]
  })

  return assignments.map(assignment => ({
    id: assignment.id,
    consultationId: assignment.consultationId,
    categoryId: assignment.categoryId,
    isPrimary: assignment.isPrimary,
    displayOrder: assignment.displayOrder,
    category: {
      id: assignment.category.id,
      slug: assignment.category.slug,
      name: assignment.category.name,
      description: assignment.category.description
    }
  }))
})
