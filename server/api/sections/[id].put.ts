import { UpdateSectionSchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeSection } from '~~/server/utils/serializers/section'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const sectionId = parsePositiveIntParam(event, 'id', 'sección')
  const body = await parseBody(event, UpdateSectionSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

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

  try {
    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: body
    })

    return serializeSection(updated, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe otra sección con ese slug'
      })
    }

    throw error
  }
})
