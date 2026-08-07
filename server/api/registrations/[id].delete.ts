import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { useStorageDriver } from '~~/server/utils/storage'

// Baja de una inscripción por parte de quien administra la consulta. Borra
// también el instrumento de personería (asset + objeto en storage) para no
// dejar documentación personal huérfana.
export default defineEventHandler(async (event) => {
  const registrationId = parsePositiveIntParam(event, 'id', 'inscripción')
  const ctx = await getAuthContext(event)

  const registration = await prisma.consultationRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      form: { select: { consultationId: true } },
      proofAsset: { select: { id: true, storagePath: true } }
    }
  })

  if (!registration) {
    throw createError({ statusCode: 404, message: 'Inscripción no encontrada' })
  }

  await assertCan(ctx, 'manage', { type: 'consultation', id: registration.form.consultationId })

  await prisma.consultationRegistration.delete({ where: { id: registration.id } })

  if (registration.proofAsset) {
    await prisma.asset.delete({ where: { id: registration.proofAsset.id } })

    if (registration.proofAsset.storagePath) {
      const driver = useStorageDriver()
      await driver.delete(registration.proofAsset.storagePath)
    }
  }

  setResponseStatus(event, 204)
  return null
})
