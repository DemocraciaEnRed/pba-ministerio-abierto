import { parsePositiveIntParam } from '~~/server/utils/http/params'

// Borrado real: el registro audiovisual no conserva historial.
export default defineEventHandler(async (event) => {
  const videoId = parsePositiveIntParam(event, 'id', 'video')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.observatoryVideo.findUnique({
    where: { id: videoId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Video no encontrado' })
  }

  await prisma.observatoryVideo.delete({ where: { id: videoId } })

  setResponseStatus(event, 204)
  return null
})
