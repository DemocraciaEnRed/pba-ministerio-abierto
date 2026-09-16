import { PatchObservatoryPublicationSchema } from '#shared/schemas/observatory'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeObservatoryPublication } from '~~/server/utils/serializers/observatoryPublication'
import {
  assertCoverAssetIsImage,
  assertDocumentAssetIsPdf,
  publicationAssetSelect,
  withPublicationUrls
} from '~~/server/utils/observatory/publication-assets'

export default defineEventHandler(async (event) => {
  const publicationId = parsePositiveIntParam(event, 'id', 'publicación')
  const body = await parseBody(event, PatchObservatoryPublicationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.observatoryPublication.findUnique({
    where: { id: publicationId },
    select: { documentAssetId: true, externalUrl: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Publicación no encontrada' })
  }

  if (body.coverAssetId !== undefined) {
    await assertCoverAssetIsImage(body.coverAssetId)
  }

  if (body.documentAssetId != null) {
    await assertDocumentAssetIsPdf(body.documentAssetId)
  }

  // El PDF y la URL son excluyentes: al fijar uno se limpia el otro.
  const data = { ...body }
  if (body.documentAssetId != null) {
    data.externalUrl = null
  } else if (body.externalUrl != null) {
    data.documentAssetId = null
  }

  // La publicación no puede quedar sin fuente de descarga.
  const finalDocumentAssetId = data.documentAssetId !== undefined ? data.documentAssetId : existing.documentAssetId
  const finalExternalUrl = data.externalUrl !== undefined ? data.externalUrl : existing.externalUrl
  if (finalDocumentAssetId == null && finalExternalUrl == null) {
    throw createError({
      statusCode: 422,
      message: 'La publicación necesita un PDF o una URL de descarga'
    })
  }

  const updated = await prisma.observatoryPublication.update({
    where: { id: publicationId },
    data,
    include: {
      coverAsset: { select: publicationAssetSelect },
      documentAsset: { select: publicationAssetSelect }
    }
  })

  const [withUrls] = await withPublicationUrls([updated])

  return serializeObservatoryPublication(withUrls!, 'admin')
})
