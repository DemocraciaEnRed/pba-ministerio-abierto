import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { useStorageDriver } from '~~/server/utils/storage'

// Descarga del instrumento que acredita la personería. Se sirve por acá (nunca
// por URL pública) para que quede detrás de la autorización de la consulta.
export default defineEventHandler(async (event) => {
  const registrationId = parsePositiveIntParam(event, 'id', 'inscripción')
  const ctx = await getAuthContext(event)

  const registration = await prisma.consultationRegistration.findUnique({
    where: { id: registrationId },
    select: {
      form: { select: { consultationId: true } },
      proofAsset: {
        select: { storagePath: true, mimeType: true, originalFilename: true }
      }
    }
  })

  if (!registration) {
    throw createError({ statusCode: 404, message: 'Inscripción no encontrada' })
  }

  await assertCan(ctx, 'manage', { type: 'consultation', id: registration.form.consultationId })

  const asset = registration.proofAsset
  if (!asset?.storagePath) {
    throw createError({ statusCode: 404, message: 'Esta inscripción no tiene un archivo adjunto.' })
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
