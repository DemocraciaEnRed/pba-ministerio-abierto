import { serializeSection } from '~~/server/utils/serializers/section'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const sections = await prisma.section.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }]
  })

  if (isAdmin) {
    return sections.map(section => serializeSection(section, 'admin'))
  }

  return sections.map(section => serializeSection(section, 'public'))
})
