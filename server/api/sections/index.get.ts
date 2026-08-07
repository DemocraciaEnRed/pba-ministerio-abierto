import { CONSULTATION_TYPE_SLUGS } from '#shared/data/consultation-types'
import { serializeSection } from '~~/server/utils/serializers/section'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const sections = await prisma.section.findMany({
    where: {
      // El catálogo lo define el registro tipado: filas legacy fuera de él se ignoran.
      slug: { in: [...CONSULTATION_TYPE_SLUGS] },
      ...(isAdmin ? {} : { isActive: true })
    },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }]
  })

  if (isAdmin) {
    return sections.map(section => serializeSection(section, 'admin'))
  }

  return sections.map(section => serializeSection(section, 'public'))
})
