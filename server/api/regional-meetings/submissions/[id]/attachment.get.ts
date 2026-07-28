import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { useStorageDriver } from '~~/server/utils/storage'

// Descarga del adjunto de un aporte: exclusiva de platform-admin. El archivo se
// sirve por acá (nunca por URL pública) para que quede detrás de la autorización.
export default defineEventHandler(async (event) => {
  const submissionId = parsePositiveIntParam(event, 'id', 'aporte')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const submission = await prisma.regionalMeetingSubmission.findUnique({
    where: { id: submissionId },
    select: {
      attachmentAsset: {
        select: { storagePath: true, mimeType: true, originalFilename: true }
      }
    }
  })

  const asset = submission?.attachmentAsset
  if (!asset || !asset.storagePath) {
    throw createError({ statusCode: 404, message: 'Este aporte no tiene un archivo adjunto.' })
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
