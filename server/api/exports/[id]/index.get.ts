import { loadAccessibleDataExport } from '~~/server/utils/exports/access'
import { serializeDataExport } from '~~/server/utils/serializers/data-export'

/** Detalle de una exportación (para seguir su estado). Dueña/o o platform-admin. */
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const record = await loadAccessibleDataExport(event, ctx)
  return serializeDataExport(record, ctx.isPlatformAdmin ? 'admin' : 'owner')
})
