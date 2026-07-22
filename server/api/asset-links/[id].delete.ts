import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { assertCanManageAssetOwner } from '~~/server/utils/assets/owners'

export default defineEventHandler(async (event) => {
  const linkId = parsePositiveIntParam(event, 'id', 'vínculo')

  const existing = await prisma.assetLink.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      ownerType: true,
      ownerId: true
    }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Vínculo de asset no encontrado'
    })
  }

  const ctx = await getAuthContext(event)
  await assertCanManageAssetOwner(ctx, { ownerType: existing.ownerType, ownerId: existing.ownerId })

  await prisma.assetLink.delete({
    where: { id: existing.id }
  })

  setResponseStatus(event, 204)
})
