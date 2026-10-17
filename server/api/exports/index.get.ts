import { DataExportsQuerySchema } from '#shared/schemas/data-export'
import type { DataExportWhereInput } from '~~/prisma/generated/models'
import { dataExportInclude, failStaleDataExports } from '~~/server/utils/exports/runner'
import { serializeDataExport } from '~~/server/utils/serializers/data-export'

/**
 * Exportaciones de la persona logueada (más recientes primero). Un
 * platform-admin puede pedir `scope=all` para ver las de todas las personas.
 */
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, DataExportsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'self' })

  if (query.scope === 'all') {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  await failStaleDataExports()

  const where: DataExportWhereInput = {
    ...(query.scope === 'mine' ? { requestedByUserId: ctx.user!.id } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.consultationId !== undefined ? { consultationId: query.consultationId } : {})
  }

  const [records, total] = await Promise.all([
    prisma.dataExport.findMany({
      where,
      include: dataExportInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.perPage,
      take: query.perPage
    }),
    prisma.dataExport.count({ where })
  ])

  const view = ctx.isPlatformAdmin ? 'admin' : 'owner'
  return {
    items: records.map(record => serializeDataExport(record, view)),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
