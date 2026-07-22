import {
  AVATAR_MAX_SIZE_BYTES,
  isAllowedAvatarMime
} from '~~/server/utils/assets/policy'
import { parseUploadedAssetFromMultipart, buildAssetStorageKey } from '~~/server/utils/assets/upload'
import { useStorageDriver } from '~~/server/utils/storage'
import { userWithRolesInclude, toResolvedUser } from '~~/server/utils/auth/context'
import { resolveUserAvatarUrl } from '~~/server/utils/users/avatar'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'self' })

  const parsed = await parseUploadedAssetFromMultipart(event)

  if (parsed.mediaType !== 'image' || !isAllowedAvatarMime(parsed.mimeType)) {
    throw createError({ statusCode: 422, message: 'Formato no permitido. Subí una imagen JPG, PNG o WebP.' })
  }

  if (parsed.sizeBytes > AVATAR_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 422, message: 'La imagen supera el máximo permitido de 2 MB.' })
  }

  const driver = useStorageDriver()
  const storageKey = buildAssetStorageKey('avatars', parsed.mimeType)
  await driver.put({ key: storageKey, body: parsed.buffer, contentType: parsed.mimeType })

  const previousAsset = ctx.user!.avatarAsset

  const updated = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        assetType: 'uploaded_file',
        mediaType: 'image',
        storageProvider: driver.name,
        storagePath: storageKey,
        originalFilename: parsed.originalFilename,
        mimeType: parsed.mimeType,
        sizeBytes: parsed.sizeBytes,
        checksum: parsed.checksum,
        uploadedByUserId: ctx.user!.id
      }
    })

    const user = await tx.user.update({
      where: { id: ctx.user!.id },
      data: { avatarAssetId: asset.id },
      include: userWithRolesInclude
    })

    if (previousAsset) {
      await tx.asset.delete({ where: { id: previousAsset.id } })
    }

    return user
  })

  // Limpieza del objeto anterior en storage (fuera de la transacción de DB).
  if (previousAsset?.assetType === 'uploaded_file' && previousAsset.storagePath) {
    await driver.delete(previousAsset.storagePath)
  }

  const resolved = toResolvedUser(updated)
  const avatarUrl = await resolveUserAvatarUrl(resolved)
  setResponseStatus(event, 201)
  return serializeUser(resolved, 'self', avatarUrl)
})
