import { CreateConsultationSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateConsultationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  try {
    const created = await prisma.consultation.create({
      data: {
        slug: body.slug,
        title: body.title,
        summary: body.summary,
        body: body.body,
        consultationFormat: body.consultationFormat,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        closedMessage: body.closedMessage,
        resultsVisibility: body.resultsVisibility,
        createdByUserId: ctx.user!.id,
        updatedByUserId: ctx.user!.id
      }
    })

    setResponseStatus(event, 201)
    return serializeConsultation(created, 'admin')
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una consulta con ese slug'
      })
    }

    throw error
  }
})
