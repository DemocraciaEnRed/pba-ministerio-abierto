import { UpdateTestimonialGroupSchema } from '#shared/schemas/regional-meetings'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeRegionalMeetingTestimonialGroup } from '~~/server/utils/serializers/regionalMeetingTestimonialGroup'

async function assertRegionExists(regionId: number | null) {
  if (regionId === null) return

  const region = await prisma.region.findUnique({
    where: { id: regionId },
    select: { id: true }
  })

  if (!region) {
    throw createError({
      statusCode: 422,
      message: 'La región indicada no existe'
    })
  }
}

// Reemplaza los datos del grupo y su lista de testimonios (replace-all): los
// testimonios se manejan embebidos en el payload del grupo (máximo 3, validado
// por Zod).
export default defineEventHandler(async (event) => {
  const groupId = parsePositiveIntParam(event, 'id', 'grupo de testimonios')
  const body = await parseBody(event, UpdateTestimonialGroupSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.regionalMeetingTestimonialGroup.findUnique({
    where: { id: groupId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Grupo de testimonios no encontrado'
    })
  }

  await assertRegionExists(body.regionId)

  const updated = await prisma.$transaction(async (tx) => {
    await tx.regionalMeetingTestimonial.deleteMany({ where: { groupId } })

    return tx.regionalMeetingTestimonialGroup.update({
      where: { id: groupId },
      data: {
        name: body.name,
        municipality: body.municipality,
        heldAt: body.heldAt,
        regionId: body.regionId,
        testimonials: {
          create: body.testimonials.map((testimonial, index) => ({
            body: testimonial.body,
            authorName: testimonial.authorName,
            municipality: testimonial.municipality,
            displayOrder: index
          }))
        }
      },
      include: {
        region: true,
        testimonials: { orderBy: { displayOrder: 'asc' } }
      }
    })
  })

  return serializeRegionalMeetingTestimonialGroup(updated, 'admin')
})
