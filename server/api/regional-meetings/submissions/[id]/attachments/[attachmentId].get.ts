import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { sendStoredAttachment } from '~~/server/utils/assets/multi-attachments'

// Descarga de un adjunto de un aporte: exclusiva de platform-admin. El archivo
// se sirve por acá (nunca por URL pública) para que quede detrás de la autorización.
export default defineEventHandler(async (event) => {
  const submissionId = parsePositiveIntParam(event, 'id', 'aporte')
  const attachmentId = parsePositiveIntParam(event, 'attachmentId', 'adjunto')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const attachment = await prisma.regionalMeetingSubmissionAttachment.findFirst({
    where: { id: attachmentId, submissionId },
    select: { asset: { select: { storagePath: true, mimeType: true, originalFilename: true } } }
  })

  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Este aporte no tiene ese archivo adjunto.' })
  }

  return sendStoredAttachment(event, attachment.asset)
})
