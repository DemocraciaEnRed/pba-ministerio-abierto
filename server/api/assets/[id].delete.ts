import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { useStorageDriver } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const assetId = parsePositiveIntParam(event, 'id', 'asset')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      assetType: true,
      storagePath: true
    }
  })

  if (!asset) {
    throw createError({
      statusCode: 404,
      message: 'Asset no encontrado'
    })
  }

  const driver = useStorageDriver()
  if (asset.assetType === 'uploaded_file' && asset.storagePath) {
    await driver.delete(asset.storagePath)
  }

  await prisma.asset.delete({
    where: { id: asset.id }
  })

  setResponseStatus(event, 204)
})
