import { UpdateSectionSchema } from '#shared/schemas/taxonomy'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeSection } from '~~/server/utils/serializers/section'

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

  const updated = await prisma.section.update({
    where: { id: sectionId },
    // El slug identifica al tipo de consulta en el código (catálogo fijo), así
    // que se ignora el que llegue: renombrarlo rompería la lógica por tipo.
    data: { name: body.name, description: body.description }
  })

  return serializeSection(updated, 'admin')
})
