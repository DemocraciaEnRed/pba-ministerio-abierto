import type { AssetOwnerType } from '../../../prisma/generated/enums'
import type { UpdateGalleryImageInput } from '#shared/schemas/galleryImage'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey, parseUploadedAssetFromMultipart } from '~~/server/utils/assets/upload'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'
import {
  serializeGalleryImage,
  type AdminGalleryImageDTO,
  type PublicGalleryImageDTO
} from '~~/server/utils/serializers/galleryImage'

interface GalleryOwnerRef {
  ownerType: AssetOwnerType
  ownerId: number
}

const GALLERY_ROLE = 'gallery' as const

const galleryAssetSelect = {
  id: true,
  title: true,
  altText: true,
  description: true,
  mediaType: true,
  assetType: true,
  storagePath: true,
  externalUrl: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true
} as const

/**
 * Lista las imágenes de galería (assets con role `gallery`) de una entidad.
 * En la vista pública solo se devuelven las marcadas como públicas.
 */
export async function listGalleryImages(
  owner: GalleryOwnerRef,
  options: { adminView: boolean }
): Promise<AdminGalleryImageDTO[] | PublicGalleryImageDTO[]> {
  const links = await prisma.assetLink.findMany({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: GALLERY_ROLE,
      ...(options.adminView ? {} : { isPublic: true })
    },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    include: { asset: { select: galleryAssetSelect } }
  })

  const driver = useStorageDriver()

  const serialized = await Promise.all(
    links.map(async (link) => {
      const accessUrl = await resolveAssetAccessUrl(link.asset, driver)
      const entity = {
        id: link.id,
        displayOrder: link.displayOrder,
        isPublic: link.isPublic,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        asset: {
          id: link.asset.id,
          title: link.asset.title,
          altText: link.asset.altText,
          description: link.asset.description,
          originalFilename: link.asset.originalFilename,
          mimeType: link.asset.mimeType,
          sizeBytes: link.asset.sizeBytes,
          accessUrl
        }
      }
      return options.adminView
        ? serializeGalleryImage(entity, 'admin')
        : serializeGalleryImage(entity, 'public')
    })
  )

  return serialized as AdminGalleryImageDTO[] | PublicGalleryImageDTO[]
}

/**
 * Sube una imagen (multipart, solo imágenes) y la vincula a la entidad como
 * imagen de galería. El orden se asigna automáticamente al final y queda
 * pública por defecto.
 */
export async function createGalleryImage(
  event: Parameters<typeof parseUploadedAssetFromMultipart>[0],
  owner: GalleryOwnerRef,
  uploaderId: number
): Promise<AdminGalleryImageDTO> {
  const parsed = await parseUploadedAssetFromMultipart(event, { imageOnly: true })
  const driver = useStorageDriver()
  const storageKey = buildAssetStorageKey('assets', parsed.mimeType)

  await driver.put({
    key: storageKey,
    body: parsed.buffer,
    contentType: parsed.mimeType
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

  const maxOrder = await prisma.assetLink.aggregate({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: GALLERY_ROLE
    },
    _max: { displayOrder: true }
  })

  const link = await prisma.assetLink.create({
    data: {
      assetId: asset.id,
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: GALLERY_ROLE,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      isPublic: true
    }
  })

  const accessUrl = await resolveAssetAccessUrl(asset, driver)

  return serializeGalleryImage(
    {
      id: link.id,
      displayOrder: link.displayOrder,
      isPublic: link.isPublic,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      asset: {
        id: asset.id,
        title: asset.title,
        altText: asset.altText,
        description: asset.description,
        originalFilename: asset.originalFilename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        accessUrl
      }
    },
    'admin'
  )
}

/** Resuelve una imagen por id de vínculo, verificando que pertenezca a la entidad. */
async function resolveGalleryLink(linkId: number, owner: GalleryOwnerRef) {
  const link = await prisma.assetLink.findUnique({
    where: { id: linkId },
    include: { asset: { select: galleryAssetSelect } }
  })

  if (
    !link
    || link.role !== GALLERY_ROLE
    || link.ownerType !== owner.ownerType
    || link.ownerId !== owner.ownerId
  ) {
    throw createError({
      statusCode: 404,
      message: 'Imagen no encontrada'
    })
  }

  return link
}

/** Edita el epígrafe, el alt, la descripción, el orden y la visibilidad (no reemplaza la imagen). */
export async function updateGalleryImage(
  linkId: number,
  owner: GalleryOwnerRef,
  data: UpdateGalleryImageInput
): Promise<AdminGalleryImageDTO> {
  const link = await resolveGalleryLink(linkId, owner)

  const [updatedAsset, updatedLink] = await prisma.$transaction([
    prisma.asset.update({
      where: { id: link.assetId },
      data: {
        title: data.title,
        altText: data.altText,
        description: data.description
      }
    }),
    prisma.assetLink.update({
      where: { id: link.id },
      data: {
        displayOrder: data.displayOrder,
        isPublic: data.isPublic
      }
    })
  ])

  const driver = useStorageDriver()
  const accessUrl = await resolveAssetAccessUrl(link.asset, driver)

  return serializeGalleryImage(
    {
      id: updatedLink.id,
      displayOrder: updatedLink.displayOrder,
      isPublic: updatedLink.isPublic,
      createdAt: updatedLink.createdAt,
      updatedAt: updatedLink.updatedAt,
      asset: {
        id: updatedAsset.id,
        title: updatedAsset.title,
        altText: updatedAsset.altText,
        description: updatedAsset.description,
        originalFilename: link.asset.originalFilename,
        mimeType: link.asset.mimeType,
        sizeBytes: link.asset.sizeBytes,
        accessUrl
      }
    },
    'admin'
  )
}

/** Elimina la imagen: borra el vínculo, el asset y el objeto en storage. */
export async function deleteGalleryImage(linkId: number, owner: GalleryOwnerRef): Promise<void> {
  const link = await resolveGalleryLink(linkId, owner)

  // Borrar el asset elimina el AssetLink por cascade (onDelete: Cascade).
  await prisma.asset.delete({ where: { id: link.assetId } })

  if (link.asset.storagePath) {
    const driver = useStorageDriver()
    await driver.delete(link.asset.storagePath)
  }
}
