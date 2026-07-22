import { CreatePageSchema } from '#shared/schemas/page'
import { serializePage } from '~~/server/utils/serializers/page'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreatePageSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

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
    const created = await prisma.sitePage.create({
      data: {
        platformSettingsId: settings.id,
        pageKey: body.pageKey,
        title: body.title,
        slug: body.slug,
        content: body.content,
        isPublished: body.isPublished
      }
    })

    setResponseStatus(event, 201)
    return serializePage(created, 'admin')
  } catch (error) {
    const code = getPrismaErrorCode(error)

    if (code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una página con ese slug o clave'
      })
    }

    throw error
  }
})
