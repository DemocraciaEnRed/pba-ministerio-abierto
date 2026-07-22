import type { AssetOwnerType } from '../../../prisma/generated/enums'
import type { UpdateAttachmentInput } from '#shared/schemas/attachment'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey, parseUploadedAssetFromMultipart } from '~~/server/utils/assets/upload'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'
import {
  serializeAttachment,
  type AdminAttachmentDTO,
  type PublicAttachmentDTO
} from '~~/server/utils/serializers/attachment'

interface AttachmentOwnerRef {
  ownerType: AssetOwnerType
  ownerId: number
}

const ATTACHMENT_ROLE = 'attachment' as const

const attachmentAssetSelect = {
  id: true,
  title: true,
  mediaType: true,
  assetType: true,
  storagePath: true,
  externalUrl: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true
} as const

/**
 * Lista los archivos adjuntos (assets con role `attachment`) de una entidad.
 * En la vista pública solo se devuelven los marcados como públicos.
 */
export async function listAttachments(
  owner: AttachmentOwnerRef,
  options: { adminView: boolean }
): Promise<AdminAttachmentDTO[] | PublicAttachmentDTO[]> {
  const links = await prisma.assetLink.findMany({
    where: {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: ATTACHMENT_ROLE,
      ...(options.adminView ? {} : { isPublic: true })
    },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    include: { asset: { select: attachmentAssetSelect } }
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
          mediaType: link.asset.mediaType,
          originalFilename: link.asset.originalFilename,
          mimeType: link.asset.mimeType,
          sizeBytes: link.asset.sizeBytes,
          accessUrl
        }
      }
      return options.adminView
        ? serializeAttachment(entity, 'admin')
        : serializeAttachment(entity, 'public')
    })
  )

  return serialized as AdminAttachmentDTO[] | PublicAttachmentDTO[]
}

/**
 * Sube un archivo (multipart) y lo vincula a la entidad como adjunto. El orden
 * se asigna automáticamente al final y queda público por defecto.
 */
export async function createAttachment(
  event: Parameters<typeof parseUploadedAssetFromMultipart>[0],
  owner: AttachmentOwnerRef,
  uploaderId: number
): Promise<AdminAttachmentDTO> {
  const parsed = await parseUploadedAssetFromMultipart(event)
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
      assetType: 'uploaded_file',
      mediaType: parsed.mediaType,
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
      role: ATTACHMENT_ROLE
    },
    _max: { displayOrder: true }
  })

  const link = await prisma.assetLink.create({
    data: {
      assetId: asset.id,
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      role: ATTACHMENT_ROLE,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      isPublic: true
    }
  })

  const accessUrl = await resolveAssetAccessUrl(asset, driver)

  return serializeAttachment(
    {
      id: link.id,
      displayOrder: link.displayOrder,
      isPublic: link.isPublic,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      asset: {
        id: asset.id,
        title: asset.title,
        mediaType: asset.mediaType,
        originalFilename: asset.originalFilename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        accessUrl
      }
    },
    'admin'
  )
}

/** Resuelve un adjunto por id de vínculo, verificando que pertenezca a la entidad. */
async function resolveAttachmentLink(linkId: number, owner: AttachmentOwnerRef) {
  const link = await prisma.assetLink.findUnique({
    where: { id: linkId },
    include: { asset: { select: attachmentAssetSelect } }
  })

  if (
    !link
    || link.role !== ATTACHMENT_ROLE
    || link.ownerType !== owner.ownerType
    || link.ownerId !== owner.ownerId
  ) {
    throw createError({
      statusCode: 404,
      message: 'Archivo no encontrado'
    })
  }

  return link
}

/** Edita el título, el orden y la visibilidad de un adjunto (no reemplaza el archivo). */
export async function updateAttachment(
  linkId: number,
  owner: AttachmentOwnerRef,
  data: UpdateAttachmentInput
): Promise<AdminAttachmentDTO> {
  const link = await resolveAttachmentLink(linkId, owner)

  const [, updatedLink] = await prisma.$transaction([
    prisma.asset.update({
      where: { id: link.assetId },
      data: { title: data.title }
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

  return serializeAttachment(
    {
      id: updatedLink.id,
      displayOrder: updatedLink.displayOrder,
      isPublic: updatedLink.isPublic,
      createdAt: updatedLink.createdAt,
      updatedAt: updatedLink.updatedAt,
      asset: {
        id: link.asset.id,
        title: data.title,
        mediaType: link.asset.mediaType,
        originalFilename: link.asset.originalFilename,
        mimeType: link.asset.mimeType,
        sizeBytes: link.asset.sizeBytes,
        accessUrl
      }
    },
    'admin'
  )
}

/** Elimina el adjunto: borra el vínculo, el asset y el objeto en storage. */
export async function deleteAttachment(linkId: number, owner: AttachmentOwnerRef): Promise<void> {
  const link = await resolveAttachmentLink(linkId, owner)

  // Borrar el asset elimina el AssetLink por cascade (onDelete: Cascade).
  await prisma.asset.delete({ where: { id: link.assetId } })

  if (link.asset.storagePath) {
    const driver = useStorageDriver()
    await driver.delete(link.asset.storagePath)
  }
}
