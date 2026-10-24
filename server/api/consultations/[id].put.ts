import { UpdateConsultationSchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/resolve'
import { resolveRegionalMeetingWrite, upsertRegionalMeeting } from '~~/server/utils/consultations/regional-meeting'

export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const body = await parseBody(event, UpdateConsultationSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'consultation', id: consultationId })

  const existing = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, section: { select: { slug: true } } }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  const regionalMeeting = await resolveRegionalMeetingWrite(existing.section?.slug, body)

  // Sin `slug` se conserva la dirección actual: cambiar el título no la altera.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.consultation.update({
      where: { id: consultationId },
      data: {
        ...(body.slug ? { slug: body.slug } : {}),
        title: body.title,
        summary: body.summary,
        body: body.body,
        consultationFormat: body.consultationFormat,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        closedMessage: body.closedMessage,
        commentsEnabled: body.commentsEnabled,
        commentsGuidance: body.commentsGuidance,
        resultsVisibility: body.resultsVisibility,
        ...(regionalMeeting ? { regionId: regionalMeeting.regionId } : {}),
        updatedByUserId: ctx.user!.id
      }
    })

    if (regionalMeeting) {
      await upsertRegionalMeeting(tx, consultationId, regionalMeeting.regionalMeeting)
    }

    return tx.consultation.findUniqueOrThrow({
      where: { id: consultationId },
      include: { section: true, region: true, regionalMeeting: true }
    })
  })

  return serializeConsultation(updated, 'admin')
})
