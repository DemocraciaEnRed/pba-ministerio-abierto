import { CreateObservatoryPublicationSchema } from '#shared/schemas/observatory'
import { serializeObservatoryPublication } from '~~/server/utils/serializers/observatoryPublication'
import {
  assertCoverAssetIsImage,
  assertDocumentAssetIsPdf,
  publicationAssetSelect,
  withPublicationUrls
} from '~~/server/utils/observatory/publication-assets'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateObservatoryPublicationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  // El schema garantiza portada presente; el guard satisface al tipo nullable.
  if (body.coverAssetId != null) {
    await assertCoverAssetIsImage(body.coverAssetId)
  }

  if (body.documentAssetId !== null) {
    await assertDocumentAssetIsPdf(body.documentAssetId)
  }

  const created = await prisma.observatoryPublication.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      publicationYear: body.publicationYear,
      coverAssetId: body.coverAssetId,
      documentAssetId: body.documentAssetId,
      externalUrl: body.externalUrl,
      isActive: body.isActive,
      displayOrder: body.displayOrder
    },
    include: {
      coverAsset: { select: publicationAssetSelect },
      documentAsset: { select: publicationAssetSelect }
    }
  })

  const [withUrls] = await withPublicationUrls([created])

  setResponseStatus(event, 201)
  return serializeObservatoryPublication(withUrls!, 'admin')
})
