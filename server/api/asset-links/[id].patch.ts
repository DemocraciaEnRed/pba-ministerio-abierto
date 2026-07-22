import { PatchAssetLinkSchema } from '#shared/schemas/assets'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
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
  const linkId = parsePositiveIntParam(event, 'id', 'vínculo')
  const body = await parseBody(event, PatchAssetLinkSchema)

  const existing = await prisma.assetLink.findUnique({
    where: { id: linkId },
    include: { asset: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Vínculo de asset no encontrado'
    })
  }

  const ctx = await getAuthContext(event)
  await assertCanManageAssetOwner(ctx, { ownerType: existing.ownerType, ownerId: existing.ownerId })

  const nextRole = body.role ?? existing.role
  if (nextRole === 'cover' && existing.asset.mediaType !== 'image') {
    throw createError({
      statusCode: 422,
      message: 'La portada debe ser una imagen'
    })
  }

  if (nextRole === 'cover') {
    const conflictingCover = await prisma.assetLink.findFirst({
      where: {
        ownerType: existing.ownerType,
        ownerId: existing.ownerId,
        role: 'cover',
        id: { not: existing.id }
      },
      select: { id: true }
    })

    if (conflictingCover) {
      throw createError({
        statusCode: 409,
        message: 'La entidad ya tiene una portada asignada'
      })
    }
  }

  try {
    const updated = await prisma.assetLink.update({
      where: { id: linkId },
      data: {
        role: body.role,
        displayOrder: body.displayOrder,
        isPublic: body.isPublic
      },
      include: { asset: true }
    })

    const driver = useStorageDriver()
    const accessUrl = await resolveAssetAccessUrl(updated.asset, driver)
    const serializedAsset = serializeAsset({ ...updated.asset, accessUrl }, 'admin')
    return serializeAssetLink({ ...updated, asset: serializedAsset }, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'La actualización entra en conflicto con otro vínculo existente'
      })
    }
    throw error
  }
})
