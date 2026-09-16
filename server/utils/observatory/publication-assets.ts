import { useStorageDriver } from '~~/server/utils/storage'
import { resolveAssetAccessUrl, type AssetUrlResolvable } from '~~/server/utils/assets/url'

/** Campos del asset necesarios para resolver la URL pública (portada o documento). */
export const publicationAssetSelect = {
  assetType: true,
  storagePath: true,
  externalUrl: true
} as const

interface PublicationWithAssets {
  externalUrl: string | null
  coverAsset?: AssetUrlResolvable | null
  documentAsset?: AssetUrlResolvable | null
}

/**
 * Resuelve la URL de portada y la de descarga de cada publicación para el
 * serializer (que es síncrono). La descarga sale del PDF subido o, si no hay,
 * de la URL externa.
 */
export async function withPublicationUrls<T extends PublicationWithAssets>(
  publications: T[]
): Promise<(T & { coverUrl: string | null, downloadUrl: string | null })[]> {
  const driver = useStorageDriver()

  return Promise.all(
    publications.map(async publication => ({
      ...publication,
      coverUrl: publication.coverAsset
        ? await resolveAssetAccessUrl(publication.coverAsset, driver)
        : null,
      downloadUrl: publication.documentAsset
        ? await resolveAssetAccessUrl(publication.documentAsset, driver)
        : publication.externalUrl
    }))
  )
}

/** Valida que el asset exista y sea una imagen (portada). */
export async function assertCoverAssetIsImage(coverAssetId: number): Promise<void> {
  const asset = await prisma.asset.findUnique({
    where: { id: coverAssetId },
    select: { mediaType: true }
  })

  if (!asset) {
    throw createError({ statusCode: 422, message: 'La portada indicada no existe' })
  }

  if (asset.mediaType !== 'image') {
    throw createError({ statusCode: 422, message: 'La portada debe ser una imagen' })
  }
}

/** Valida que el asset exista y sea un PDF. */
export async function assertDocumentAssetIsPdf(documentAssetId: number): Promise<void> {
  const asset = await prisma.asset.findUnique({
    where: { id: documentAssetId },
    select: { mediaType: true, mimeType: true }
  })

  if (!asset) {
    throw createError({ statusCode: 422, message: 'El documento indicado no existe' })
  }

  if (asset.mediaType !== 'document' || asset.mimeType !== 'application/pdf') {
    throw createError({ statusCode: 422, message: 'El documento debe ser un archivo PDF' })
  }
}
