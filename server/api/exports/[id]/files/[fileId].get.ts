import { loadAccessibleDataExport } from '~~/server/utils/exports/access'
import { assertCanAccessDataExportScope } from '~~/server/utils/exports/runner'
import { useStorageDriver } from '~~/server/utils/storage'

/**
 * Descarga una parte de una exportación. Además de ser dueña/o (o
 * platform-admin), se exige el permiso vigente sobre el alcance: quien dejó de
 * gestionar la consulta ya no puede bajar sus datos.
 */
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const record = await loadAccessibleDataExport(event, ctx)
  const fileId = parsePositiveIntParam(event, 'fileId', 'el archivo')

  await assertCanAccessDataExportScope(ctx, record.kind, record.consultationId)

  const file = record.status === 'ready' ? record.files.find(item => item.id === fileId) : undefined
  if (!file) {
    throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
  }

  const content = await useStorageDriver().get(file.storagePath)
  if (!content) {
    throw createError({ statusCode: 404, message: 'No se encontró el archivo de la exportación.' })
  }

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${file.filename.replace(/[^\w.-]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`
  )
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return content
})
