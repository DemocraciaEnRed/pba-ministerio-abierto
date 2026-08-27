import { loadCommentWithConsultation } from '~~/server/utils/comments'
import { useStorageDriver } from '~~/server/utils/storage'

// Descarga del adjunto de un comentario. Se sirve solo por acá (nunca por URL
// pública) para que quede detrás de la autorización de la consulta: únicamente
// quienes moderan/gestionan la consulta (o platform-admin) pueden bajarlo.
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const { comment, consultationId } = await loadCommentWithConsultation(event)

  await assertCan(ctx, 'moderate', { type: 'consultation', id: consultationId })

  const record = await prisma.comment.findUnique({
    where: { id: comment.id },
    select: {
      attachmentAsset: {
        select: { storagePath: true, mimeType: true, originalFilename: true }
      }
    }
  })

  const asset = record?.attachmentAsset
  if (!asset?.storagePath) {
    throw createError({ statusCode: 404, message: 'Este comentario no tiene un archivo adjunto.' })
  }

  const driver = useStorageDriver()
  const file = await driver.get(asset.storagePath)
  if (!file) {
    throw createError({ statusCode: 404, message: 'No se encontró el archivo adjunto.' })
  }

  const filename = asset.originalFilename ?? 'adjunto'
  setResponseHeader(event, 'Content-Type', asset.mimeType ?? 'application/octet-stream')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return file
})
