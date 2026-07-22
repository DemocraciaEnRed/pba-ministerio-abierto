import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeAsset } from '~~/server/utils/serializers/asset'
import { useStorageDriver } from '~~/server/utils/storage'
import { resolveAssetAccessUrl } from '~~/server/utils/assets/url'

export default defineEventHandler(async (event) => {
  const assetId = parsePositiveIntParam(event, 'id', 'asset')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  })

  if (!asset) {
    throw createError({
      statusCode: 404,
      message: 'Asset no encontrado'
    })
  }

  const driver = useStorageDriver()
  const accessUrl = await resolveAssetAccessUrl(asset, driver)
  return serializeAsset({ ...asset, accessUrl }, 'admin')
})
