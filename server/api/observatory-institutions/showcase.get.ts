import { ObservatoryInstitutionsShowcaseQuerySchema } from '#shared/schemas/observatory'
import { serializeObservatoryInstitution } from '~~/server/utils/serializers/observatoryInstitution'
import { institutionLogoSelect, withLogoUrls } from '~~/server/utils/observatory/institution-logo'

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// Muestra pública y aleatoria de instituciones con logo para el marquee.
// Siempre vista pública (también para admins) y sin caché: cada recarga sortea.
export default defineEventHandler(async (event) => {
  const { limit } = await parseQuery(event, ObservatoryInstitutionsShowcaseQuerySchema)

  const candidates = await prisma.observatoryInstitution.findMany({
    where: { isActive: true, logoAssetId: { not: null }, category: { isActive: true } },
    select: { id: true }
  })

  const pickedIds = shuffle(candidates.map(candidate => candidate.id)).slice(0, limit)

  setResponseHeader(event, 'Cache-Control', 'no-store')

  if (pickedIds.length === 0) {
    return []
  }

  const institutions = await prisma.observatoryInstitution.findMany({
    where: { id: { in: pickedIds } },
    include: { logoAsset: { select: institutionLogoSelect } }
  })

  const withLogos = await withLogoUrls(institutions)
  const byId = new Map(withLogos.map(institution => [institution.id, institution]))

  return pickedIds
    .map(id => byId.get(id))
    .filter(institution => institution?.logoUrl)
    .map(institution => serializeObservatoryInstitution(institution!, 'public'))
})
