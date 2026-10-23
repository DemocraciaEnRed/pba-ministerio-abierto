import { loadCommentWithConsultation } from '~~/server/utils/comments'
import { sendStoredAttachment } from '~~/server/utils/assets/multi-attachments'
import { parsePositiveIntParam } from '~~/server/utils/http/params'

// Descarga de un adjunto de un comentario. Se sirve solo por acá (nunca por URL
// pública) para que quede detrás de la autorización de la consulta: únicamente
// quienes moderan/gestionan la consulta (o platform-admin) pueden bajarlo.
export default defineEventHandler(async (event) => {
  const attachmentId = parsePositiveIntParam(event, 'attachmentId', 'adjunto')
  const ctx = await getAuthContext(event)
  const { comment, consultationId } = await loadCommentWithConsultation(event)

  await assertCan(ctx, 'moderate', { type: 'consultation', id: consultationId })

  const attachment = await prisma.commentAttachment.findFirst({
    where: { id: attachmentId, commentId: comment.id },
    select: { asset: { select: { storagePath: true, mimeType: true, originalFilename: true } } }
  })

  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Este comentario no tiene ese archivo adjunto.' })
  }

  return sendStoredAttachment(event, attachment.asset)
})
