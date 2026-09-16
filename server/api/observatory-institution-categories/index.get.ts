import { serializeObservatoryInstitutionCategory } from '~~/server/utils/serializers/observatoryInstitution'

// Público: solo las categorías activas (las usa el formulario de aportes para
// agrupar el selector). platform-admin ve además las dadas de baja.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const categories = await prisma.observatoryInstitutionCategory.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
  })

  if (isAdmin) {
    return categories.map(category => serializeObservatoryInstitutionCategory(category, 'admin'))
  }

  return categories.map(category => serializeObservatoryInstitutionCategory(category, 'public'))
})
