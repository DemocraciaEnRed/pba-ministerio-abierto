import { isKnownConsultationTypeSlug } from '#shared/data/consultation-types'
import { CreateConsultationSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationAddressName } from '~~/server/utils/consultations/address'

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateConsultationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'manage', { type: 'platform' })

  const section = await prisma.section.findFirst({
    where: { id: body.sectionId, isActive: true },
    select: { id: true, slug: true }
  })

  if (!section || !isKnownConsultationTypeSlug(section.slug)) {
    throw createError({
      statusCode: 422,
      message: 'El tipo de consulta no existe o está inactivo'
    })
  }

  // El nombre legible de la URL no es único: la consulta se identifica por id.
  const created = await prisma.consultation.create({
    data: {
      slug: resolveConsultationAddressName(body.slug, body.title),
      title: body.title,
      sectionId: section.id,
      summary: body.summary,
      body: body.body,
      consultationFormat: body.consultationFormat,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      closedMessage: body.closedMessage,
      commentsEnabled: body.commentsEnabled,
      commentsGuidance: body.commentsGuidance,
      resultsVisibility: body.resultsVisibility,
      createdByUserId: ctx.user!.id,
      updatedByUserId: ctx.user!.id
    },
    include: { section: true }
  })

  setResponseStatus(event, 201)
  return serializeConsultation(created, 'admin')
})
