import { CreateExternalAssetSchema } from '#shared/schemas/assets'
import { serializeAsset } from '~~/server/utils/serializers/asset'
import { useStorageDriver } from '~~/server/utils/storage'
import { buildAssetStorageKey, parseUploadedAssetFromMultipart } from '~~/server/utils/assets/upload'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  const contentType = getRequestHeader(event, 'content-type') || ''
  const driver = useStorageDriver()

  if (contentType.includes('multipart/form-data')) {
    const parsedUpload = await parseUploadedAssetFromMultipart(event)
    const storageKey = buildAssetStorageKey('assets', parsedUpload.mimeType)

    await driver.put({
      key: storageKey,
      body: parsedUpload.buffer,
      contentType: parsedUpload.mimeType
    })

    const created = await prisma.asset.create({
      data: {
        title: parsedUpload.title,
        description: parsedUpload.description,
        assetType: 'uploaded_file',
        mediaType: parsedUpload.mediaType,
        storageProvider: driver.name,
        storagePath: storageKey,
        externalUrl: null,
        originalFilename: parsedUpload.originalFilename,
        mimeType: parsedUpload.mimeType,
        sizeBytes: parsedUpload.sizeBytes,
        checksum: parsedUpload.checksum,
        uploadedByUserId: ctx.user!.id
      }
    })

    const accessUrl = await resolveAssetAccessUrl(created, driver)
    setResponseStatus(event, 201)
    return serializeAsset({ ...created, accessUrl }, 'admin')
  }

  const body = await parseBody(event, CreateExternalAssetSchema)
  const created = await prisma.asset.create({
    data: {
      title: body.title ?? null,
      description: body.description ?? null,
      assetType: 'external_link',
      mediaType: body.mediaType,
      storageProvider: 'external',
      storagePath: null,
      externalUrl: body.externalUrl,
      originalFilename: null,
      mimeType: null,
      sizeBytes: null,
      checksum: null,
      uploadedByUserId: ctx.user!.id
    }
  })

  const accessUrl = await resolveAssetAccessUrl(created, driver)
  setResponseStatus(event, 201)
  return serializeAsset({ ...created, accessUrl }, 'admin')
})
