import { serializeObservatoryInstitution } from '~~/server/utils/serializers/observatoryInstitution'
import { institutionLogoSelect, withLogoUrls } from '~~/server/utils/observatory/institution-logo'

// Público: solo instituciones activas dentro de categorías activas (una
// categoría dada de baja oculta también sus instituciones en el formulario).
// platform-admin ve el catálogo completo.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const institutions = await prisma.observatoryInstitution.findMany({
    where: isAdmin ? undefined : { isActive: true, category: { isActive: true } },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { logoAsset: { select: institutionLogoSelect } }
  })

  const withLogos = await withLogoUrls(institutions)

  if (isAdmin) {
    return withLogos.map(institution => serializeObservatoryInstitution(institution, 'admin'))
  }

  return withLogos.map(institution => serializeObservatoryInstitution(institution, 'public'))
})
