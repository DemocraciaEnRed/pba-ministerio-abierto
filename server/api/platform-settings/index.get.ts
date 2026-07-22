import { serializePlatformSettings } from '~~/server/utils/serializers/platform-settings'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)

  const settings = await prisma.platformSettings.findFirst({
    orderBy: { id: 'asc' }
  })

  if (!settings) {
    throw createError({
      statusCode: 404,
      message: 'No hay una configuración de plataforma'
    })
  }

  if (ctx.isPlatformAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
    return serializePlatformSettings(settings, 'admin')
  }

  return serializePlatformSettings(settings, 'public')
})
