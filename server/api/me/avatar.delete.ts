import { useStorageDriver } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'self' })

  const previousAsset = ctx.user!.avatarAsset

  if (previousAsset) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: ctx.user!.id },
        data: { avatarAssetId: null }
      })
      await tx.asset.delete({ where: { id: previousAsset.id } })
    })

    if (previousAsset.assetType === 'uploaded_file' && previousAsset.storagePath) {
      const driver = useStorageDriver()
      await driver.delete(previousAsset.storagePath)
    }
  }

  setResponseStatus(event, 204)
  return null
})
