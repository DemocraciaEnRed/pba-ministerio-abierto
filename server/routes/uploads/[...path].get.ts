import { lookup } from 'mrmime'

/**
 * Sirve archivos del storage local bajo `/uploads/*`.
 *
 * Solo aplica cuando el driver activo es 'local'; con s3/Spaces los objetos se
 * acceden por su URL pública o presignada, no por esta ruta. La protección
 * contra path traversal la garantiza el propio driver al resolver la key.
 */
export default defineEventHandler(async (event) => {
  const driver = useStorageDriver()
  if (driver.name !== 'local') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const key = event.context.params?.path
  if (!key) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  let file: Buffer | null
  try {
    file = await driver.get(key)
  } catch {
    // Key inválida (intento de path traversal u otra): tratar como no encontrado.
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setResponseHeader(event, 'Content-Type', lookup(key) || 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return file
})
