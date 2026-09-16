import { serializeObservatoryPublication } from '~~/server/utils/serializers/observatoryPublication'
import { publicationAssetSelect, withPublicationUrls } from '~~/server/utils/observatory/publication-assets'

// Público: solo publicaciones activas, más recientes primero. platform-admin ve
// el catálogo completo.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const publications = await prisma.observatoryPublication.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: [{ publicationYear: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      coverAsset: { select: publicationAssetSelect },
      documentAsset: { select: publicationAssetSelect }
    }
  })

  const withUrls = await withPublicationUrls(publications)

  if (isAdmin) {
    return withUrls.map(publication => serializeObservatoryPublication(publication, 'admin'))
  }

  return withUrls.map(publication => serializeObservatoryPublication(publication, 'public'))
})
