import { CreateDataExportSchema } from '#shared/schemas/data-export'
import { requestDataExport } from '~~/server/utils/exports/runner'
import { serializeDataExport } from '~~/server/utils/serializers/data-export'

/**
 * Pide una exportación CSV. Se valida el alcance y el permiso según el tipo
 * (gestionar la consulta o platform-admin) y se genera en segundo plano: la
 * respuesta (202) trae el registro pendiente para seguir su estado.
 */
export default defineEventHandler(async (event) => {
  const body = await parseBody(event, CreateDataExportSchema)
  const ctx = await getAuthContext(event)

  const record = await requestDataExport(ctx, body)

  setResponseStatus(event, 202)
  return serializeDataExport(record, ctx.isPlatformAdmin ? 'admin' : 'owner')
})
