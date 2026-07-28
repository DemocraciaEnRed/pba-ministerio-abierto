import { CreateTestimonialGroupSchema } from '#shared/schemas/regional-meetings'
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

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateTestimonialGroupSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  await assertRegionExists(body.regionId)

  const created = await prisma.regionalMeetingTestimonialGroup.create({
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

  setResponseStatus(event, 201)
  return serializeRegionalMeetingTestimonialGroup(created, 'admin')
})
