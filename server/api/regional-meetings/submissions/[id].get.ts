import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeRegionalMeetingSubmission } from '~~/server/utils/serializers/regionalMeetingSubmission'

// Detalle de un aporte: exclusivo de platform-admin.
export default defineEventHandler(async (event) => {
  const submissionId = parsePositiveIntParam(event, 'id', 'aporte')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const submission = await prisma.regionalMeetingSubmission.findUnique({
    where: { id: submissionId },
    include: {
      links: true,
      attachmentAsset: {
        select: { originalFilename: true, mimeType: true, sizeBytes: true }
      }
    }
  })

  if (!submission) {
    throw createError({
      statusCode: 404,
      message: 'Aporte no encontrado'
    })
  }

  return serializeRegionalMeetingSubmission(submission, 'admin')
})
