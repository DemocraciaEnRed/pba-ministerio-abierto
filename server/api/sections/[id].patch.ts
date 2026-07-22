import { PatchSectionSchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeSection } from '~~/server/utils/serializers/section'

export default defineEventHandler(async (event) => {
  const sectionId = parsePositiveIntParam(event, 'id', 'sección')
  const body = await parseBody(event, PatchSectionSchema)
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

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: body
  })

  return serializeSection(updated, 'admin')
})
