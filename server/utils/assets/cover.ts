import type { AssetOwnerType } from '../../../prisma/generated/enums'
import { useStorageDriver } from '~~/server/utils/storage'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'

interface CoverOwnerRef {
  ownerType: AssetOwnerType
  ownerId: number
}

/** Datos mínimos del cover que necesitan las cards públicas. */
export interface CoverImage {
  url: string | null
  altText: string | null
}

const COVER_ROLE = 'cover' as const

const coverAssetSelect = {
  altText: true,
  assetType: true,
  storagePath: true,
  externalUrl: true
} as const

/**
 * Obtiene la imagen de portada (asset con role `cover`) de una entidad.
 * En la vista pública solo se considera si está marcada como pública.
 * Devuelve `null` cuando no hay portada cargada.
 */
export async function getCoverImage(
  owner: CoverOwnerRef,
  options: { adminView: boolean }
): Promise<CoverImage | null> {
  const link = await prisma.assetLink.findFirst({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: COVER_ROLE,
      ...(options.adminView ? {} : { isPublic: true })
    },
    include: { asset: { select: coverAssetSelect } }
  })

  if (!link) return null

  const driver = useStorageDriver()
  const url = await resolveAssetAccessUrl(link.asset, driver)

  return { url, altText: link.asset.altText }
}

/**
 * Versión por lotes: obtiene las portadas de varias entidades del mismo tipo en
 * una sola consulta y las devuelve indexadas por `ownerId`. Evita el N+1 al
 * renderizar listados/carruseles de cards.
 */
export async function getCoverImagesByOwner(
  ownerType: AssetOwnerType,
  ownerIds: number[],
  options: { adminView: boolean }
): Promise<Map<number, CoverImage>> {
  const covers = new Map<number, CoverImage>()

  if (ownerIds.length === 0) return covers

  const links = await prisma.assetLink.findMany({
    where: {
      ownerType,
      ownerId: { in: ownerIds },
      role: COVER_ROLE,
      ...(options.adminView ? {} : { isPublic: true })
    },
    orderBy: { id: 'asc' },
    include: { asset: { select: coverAssetSelect } }
  })

  const driver = useStorageDriver()

  await Promise.all(
    links.map(async (link) => {
      // Una entidad tiene a lo sumo una portada; si hubiera duplicados, el
      // primero (menor id) gana y el resto se ignora.
      if (covers.has(link.ownerId)) return
      const url = await resolveAssetAccessUrl(link.asset, driver)
      covers.set(link.ownerId, { url, altText: link.asset.altText })
    })
  )

  return covers
}
