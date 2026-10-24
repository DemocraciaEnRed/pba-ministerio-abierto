import { loadAccessibleDataExport } from '~~/server/utils/exports/access'
import { deleteDataExportStoredFiles } from '~~/server/utils/exports/runner'

/**
 * Elimina una exportación y sus archivos. Dueña/o o platform-admin. Una
 * exportación en curso no se puede eliminar hasta que termine.
 */
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const record = await loadAccessibleDataExport(event, ctx)

  if (record.status === 'pending' || record.status === 'processing') {
    throw createError({ statusCode: 409, message: 'La exportación todavía se está generando. Esperá a que termine para eliminarla.' })
  }

  await prisma.dataExport.delete({ where: { id: record.id } })
  await deleteDataExportStoredFiles(record.files)

  setResponseStatus(event, 204)
  return null
})
