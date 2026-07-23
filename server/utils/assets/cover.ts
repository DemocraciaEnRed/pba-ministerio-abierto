import type { AssetOwnerType } from '../../../prisma/generated/enums'
import type { UpdateCoverInput } from '#shared/schemas/cover'
import { useStorageDriver } from '~~/server/utils/storage'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'
import { buildAssetStorageKey, parseUploadedAssetFromMultipart } from '~~/server/utils/assets/upload'
import { serializeCoverImage, type AdminCoverImageDTO } from '~~/server/utils/serializers/cover'

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

/** Resuelve el vínculo de portada de una entidad; lanza 404 si no hay ninguna. */
async function resolveCoverLink(owner: CoverOwnerRef) {
  const link = await prisma.assetLink.findFirst({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: COVER_ROLE
    },
    include: { asset: { select: { id: true, storagePath: true } } }
  })

  if (!link) {
    throw createError({
      statusCode: 404,
      message: 'La entidad no tiene una portada cargada'
    })
  }

  return link
}

/**
 * Sube una imagen (multipart, solo imágenes) y la fija como portada de la
 * entidad. Si ya existía una portada, la reemplaza de forma atómica y luego
 * limpia el archivo anterior del storage. Queda pública por defecto.
 */
export async function setCoverImage(
  event: Parameters<typeof parseUploadedAssetFromMultipart>[0],
  owner: CoverOwnerRef,
  uploaderId: number
): Promise<AdminCoverImageDTO> {
  const parsed = await parseUploadedAssetFromMultipart(event, { imageOnly: true })
  const driver = useStorageDriver()
  const storageKey = buildAssetStorageKey('assets', parsed.mimeType)

  await driver.put({
    key: storageKey,
    body: parsed.buffer,
    contentType: parsed.mimeType
  })

  // Portada previa (si existe): se reemplaza y su archivo se limpia al final.
  const previous = await prisma.assetLink.findFirst({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: COVER_ROLE
    },
    include: { asset: { select: { id: true, storagePath: true } } }
  })

  const asset = await prisma.asset.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      altText: parsed.altText,
      assetType: 'uploaded_file',
      mediaType: 'image',
      storageProvider: driver.name,
      storagePath: storageKey,
      externalUrl: null,
      originalFilename: parsed.originalFilename,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.sizeBytes,
      checksum: parsed.checksum,
      uploadedByUserId: uploaderId
    }
  })

  // Swap atómico: se crea el nuevo vínculo y se borra el asset anterior (que
  // arrastra su AssetLink por cascade) en la misma transacción.
  await prisma.$transaction([
    prisma.assetLink.create({
      data: {
        assetId: asset.id,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        role: COVER_ROLE,
        displayOrder: 0,
        isPublic: true
      }
    }),
    ...(previous ? [prisma.asset.delete({ where: { id: previous.asset.id } })] : [])
  ])

  // El archivo del storage se limpia fuera de la transacción de base de datos.
  if (previous?.asset.storagePath) {
    await driver.delete(previous.asset.storagePath)
  }

  const accessUrl = await resolveAssetAccessUrl(asset, driver)

  return serializeCoverImage(
    {
      assetId: asset.id,
      altText: asset.altText,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      accessUrl
    },
    'admin'
  )
}

/** Actualiza el texto alternativo de la portada existente (sin reemplazar la imagen). */
export async function updateCoverMetadata(
  owner: CoverOwnerRef,
  data: UpdateCoverInput
): Promise<AdminCoverImageDTO> {
  const link = await resolveCoverLink(owner)

  const asset = await prisma.asset.update({
    where: { id: link.assetId },
    data: { altText: data.altText }
  })

  const driver = useStorageDriver()
  const accessUrl = await resolveAssetAccessUrl(asset, driver)

  return serializeCoverImage(
    {
      assetId: asset.id,
      altText: asset.altText,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      accessUrl
    },
    'admin'
  )
}

/** Elimina la portada: borra el vínculo, el asset y el objeto en storage. */
export async function deleteCoverImage(owner: CoverOwnerRef): Promise<void> {
  const link = await resolveCoverLink(owner)

  // Borrar el asset elimina el AssetLink por cascade (onDelete: Cascade).
  await prisma.asset.delete({ where: { id: link.assetId } })

  if (link.asset.storagePath) {
    const driver = useStorageDriver()
    await driver.delete(link.asset.storagePath)
  }
}
