import type { H3Event } from 'h3'
import type { AuthContext } from '~~/server/utils/auth/context'
import { dataExportInclude, failStaleDataExports } from './runner'

/**
 * Carga una exportación visible para la persona: la que la pidió o un
 * platform-admin. Para el resto responde 404 (no revela que existe).
 */
export async function loadAccessibleDataExport(event: H3Event, ctx: AuthContext) {
  await assertCan(ctx, 'read', { type: 'self' })
  const id = parsePositiveIntParam(event, 'id', 'la exportación')

  await failStaleDataExports()
  const record = await prisma.dataExport.findUnique({
    where: { id },
    include: dataExportInclude
  })

  if (!record || (record.requestedByUserId !== ctx.user!.id && !ctx.isPlatformAdmin)) {
    throw createError({ statusCode: 404, message: 'Exportación no encontrada' })
  }
  return record
}
