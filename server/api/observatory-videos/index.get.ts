import { serializeObservatoryVideo } from '~~/server/utils/serializers/observatoryVideo'

// Público: solo videos activos, en el orden configurado. platform-admin ve el
// catálogo completo.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const videos = await prisma.observatoryVideo.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { videoDate: 'desc' }, { createdAt: 'desc' }]
  })

  if (isAdmin) {
    return videos.map(video => serializeObservatoryVideo(video, 'admin'))
  }

  return videos.map(video => serializeObservatoryVideo(video, 'public'))
})
