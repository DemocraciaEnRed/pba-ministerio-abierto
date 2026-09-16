import { PatchObservatoryVideoSchema } from '#shared/schemas/observatory'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeObservatoryVideo } from '~~/server/utils/serializers/observatoryVideo'

// La fecha llega como `AAAA-MM-DD`; se guarda a medianoche UTC en la columna DATE.
function parseVideoDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00Z`) : null
}

export default defineEventHandler(async (event) => {
  const videoId = parsePositiveIntParam(event, 'id', 'video')
  const body = await parseBody(event, PatchObservatoryVideoSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.observatoryVideo.findUnique({
    where: { id: videoId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Video no encontrado' })
  }

  const updated = await prisma.observatoryVideo.update({
    where: { id: videoId },
    data: {
      title: body.title,
      youtubeUrl: body.youtubeUrl,
      videoDate: body.videoDate !== undefined ? parseVideoDate(body.videoDate) : undefined,
      isActive: body.isActive,
      displayOrder: body.displayOrder
    }
  })

  return serializeObservatoryVideo(updated, 'admin')
})
