import { UpdatePlatformSettingsSchema } from '#shared/schemas/platform-settings'
import { serializePlatformSettings } from '~~/server/utils/serializers/platform-settings'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, UpdatePlatformSettingsSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const settings = await prisma.platformSettings.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true }
  })

  if (!settings) {
    throw createError({
      statusCode: 404,
      message: 'No hay una configuración de plataforma'
    })
  }

  try {
    const updated = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: body
    })

    return serializePlatformSettings(updated, 'admin')
  } catch (error) {
    const code = getPrismaErrorCode(error)

    if (code === 'P2003') {
      throw createError({
        statusCode: 422,
        message: 'Alguno de los logos seleccionados no existe'
      })
    }

    throw error
  }
})
