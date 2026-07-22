import { CreateAssetLinkSchema } from '#shared/schemas/assets'
import { assertCanManageAssetOwner } from '~~/server/utils/assets/owners'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'
import { serializeAsset } from '~~/server/utils/serializers/asset'
import { serializeAssetLink } from '~~/server/utils/serializers/asset-link'
import { useStorageDriver } from '~~/server/utils/storage'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateAssetLinkSchema)
  const ctx = await getAuthContext(event)
  await assertCanManageAssetOwner(ctx, { ownerType: body.ownerType, ownerId: body.ownerId })

  const asset = await prisma.asset.findUnique({
    where: { id: body.assetId }
  })

  if (!asset) {
    throw createError({
      statusCode: 404,
      message: 'Asset no encontrado'
    })
  }

  if (body.role === 'cover' && asset.mediaType !== 'image') {
    throw createError({
      statusCode: 422,
      message: 'La portada debe ser una imagen'
    })
  }

  if (body.role === 'cover') {
    const existingCover = await prisma.assetLink.findFirst({
      where: {
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        role: 'cover'
      },
      select: { id: true }
    })

    if (existingCover) {
      throw createError({
        statusCode: 409,
        message: 'La entidad ya tiene una portada asignada'
      })
    }
  }

  try {
    const created = await prisma.assetLink.create({
      data: {
        assetId: body.assetId,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        role: body.role,
        displayOrder: body.displayOrder,
        isPublic: body.isPublic
      }
    })

    const driver = useStorageDriver()
    const accessUrl = await resolveAssetAccessUrl(asset, driver)
    const serializedAsset = serializeAsset({ ...asset, accessUrl }, 'admin')
    setResponseStatus(event, 201)
    return serializeAssetLink({ ...created, asset: serializedAsset }, 'admin')
  } catch (error) {
    const code = getPrismaErrorCode(error)
    if (code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe un vínculo idéntico para ese asset y entidad'
      })
    }
    throw error
  }
})
