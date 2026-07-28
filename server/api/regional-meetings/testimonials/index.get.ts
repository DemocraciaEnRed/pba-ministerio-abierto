import { serializeRegionalMeetingTestimonialGroup } from '~~/server/utils/serializers/regionalMeetingTestimonialGroup'

// Lectura pública: la lista de testimonios se muestra en la página de
// Encuentros Regionales sin sesión.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const groups = await prisma.regionalMeetingTestimonialGroup.findMany({
    orderBy: { heldAt: 'asc' },
    include: {
      region: true,
      testimonials: { orderBy: { displayOrder: 'asc' } }
    }
  })

  if (isAdmin) {
    return groups.map(group => serializeRegionalMeetingTestimonialGroup(group, 'admin'))
  }

  return groups.map(group => serializeRegionalMeetingTestimonialGroup(group, 'public'))
})
