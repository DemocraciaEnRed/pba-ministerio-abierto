import { CreateObservatoryVideoSchema } from '#shared/schemas/observatory'
import { serializeObservatoryVideo } from '~~/server/utils/serializers/observatoryVideo'

// La fecha llega como `AAAA-MM-DD`; se guarda a medianoche UTC en la columna DATE.
function parseVideoDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00Z`) : null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateObservatoryVideoSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  const created = await prisma.observatoryVideo.create({
    data: {
      title: body.title,
      youtubeUrl: body.youtubeUrl,
      videoDate: parseVideoDate(body.videoDate),
      isActive: body.isActive,
      displayOrder: body.displayOrder
    }
  })

  setResponseStatus(event, 201)
  return serializeObservatoryVideo(created, 'admin')
})
