import { useStorageDriver } from '~~/server/utils/storage'
import { resolveAssetAccessUrl, type AssetUrlResolvable } from '~~/server/utils/assets/url'

/** Campos del asset necesarios para resolver la URL pública del logo. */
export const institutionLogoSelect = {
  assetType: true,
  storagePath: true,
  externalUrl: true
} as const

interface InstitutionWithLogo {
  logoAsset?: AssetUrlResolvable | null
}

/** Resuelve la URL del logo de cada institución para pasarla al serializer. */
export async function withLogoUrls<T extends InstitutionWithLogo>(
  institutions: T[]
): Promise<(T & { logoUrl: string | null })[]> {
  const driver = useStorageDriver()

  return Promise.all(
    institutions.map(async institution => ({
      ...institution,
      logoUrl: institution.logoAsset
        ? await resolveAssetAccessUrl(institution.logoAsset, driver)
        : null
    }))
  )
}

/**
 * Valida que el asset exista y sea una imagen. Se permite SVG: se sirve con
 * `sandbox` desde `/uploads`, y como se muestra vía `<img>` no ejecuta scripts.
 */
export async function assertLogoAssetIsImage(logoAssetId: number): Promise<void> {
  const asset = await prisma.asset.findUnique({
    where: { id: logoAssetId },
    select: { mediaType: true }
  })

  if (!asset) {
    throw createError({ statusCode: 422, message: 'El logo indicado no existe' })
  }

  if (asset.mediaType !== 'image') {
    throw createError({ statusCode: 422, message: 'El logo debe ser una imagen' })
  }
}
