import { randomUUID } from 'node:crypto'
import type { DataExportKind } from '~~/prisma/generated/enums'
import type { CreateDataExportInput } from '#shared/schemas/data-export'
import type { AuthContext } from '~~/server/utils/auth/context'
import { useStorageDriver } from '~~/server/utils/storage'
import { csvDocument, csvRow } from './csv'
import type { DataExportDefinition } from './types'
import { consultationCommentsExport, platformCommentsExport } from './kinds/comments'
import { consultationAccreditationsExport, consultationRegistrationsExport } from './kinds/registrations'
import { observatoryContributionsExport, regionalMeetingSubmissionsExport } from './kinds/platform'

const DATA_EXPORT_DEFINITIONS = {
  consultation_comments: consultationCommentsExport,
  platform_comments: platformCommentsExport,
  consultation_registrations: consultationRegistrationsExport,
  consultation_accreditations: consultationAccreditationsExport,
  regional_meeting_submissions: regionalMeetingSubmissionsExport,
  observatory_contributions: observatoryContributionsExport
} satisfies Record<DataExportKind, { kind: DataExportKind }>

/** Exportaciones pendientes simultáneas que puede tener una persona. */
export const MAX_ACTIVE_DATA_EXPORTS_PER_USER = 3
/** Pasado este tiempo sin terminar, una exportación se considera interrumpida. */
export const STALE_DATA_EXPORT_MINUTES = 30
const STALE_SWEEP_INTERVAL_MS = 60_000
let lastStaleSweepAt = 0
const DEFAULT_ROWS_PER_FILE = 10_000
const EXPORT_BATCH_SIZE = 500
const TITLE_MAX_LENGTH = 191

export function getDataExportDefinition(kind: DataExportKind): DataExportDefinition<unknown> {
  return DATA_EXPORT_DEFINITIONS[kind] as DataExportDefinition<unknown>
}

/** Filas por archivo (configurable con `NUXT_EXPORTS_ROWS_PER_FILE`). */
export function dataExportRowsPerFile(): number {
  const value = Number(useRuntimeConfig().exports?.rowsPerFile)
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_ROWS_PER_FILE
}

/**
 * Verifica el permiso vigente sobre el alcance de una exportación: gestionar
 * la consulta (tipos por consulta) o ser platform-admin. Si la consulta ya no
 * existe, solo platform-admin conserva el acceso.
 */
export async function assertCanAccessDataExportScope(
  ctx: AuthContext,
  kind: DataExportKind,
  consultationId: number | null
): Promise<void> {
  const definition = getDataExportDefinition(kind)
  if (definition.scope === 'platform' || consultationId === null) {
    await assertCan(ctx, 'read', { type: 'platform' })
    return
  }
  await assertCan(ctx, 'manage', { type: 'consultation', id: consultationId })
}

/**
 * Crea una exportación pendiente y lanza su generación en segundo plano.
 * Valida el alcance, el permiso y el límite de exportaciones en curso.
 */
export async function requestDataExport(ctx: AuthContext, input: CreateDataExportInput) {
  const consultationId = 'consultationId' in input ? input.consultationId : null
  const filters = 'filters' in input ? input.filters : {}

  await assertCanAccessDataExportScope(ctx, input.kind, consultationId)
  const userId = ctx.user!.id

  await failStaleDataExports()
  const active = await prisma.dataExport.count({
    where: { requestedByUserId: userId, status: { in: ['pending', 'processing'] } }
  })
  if (active >= MAX_ACTIVE_DATA_EXPORTS_PER_USER) {
    throw createError({
      statusCode: 429,
      message: `Ya tenés ${MAX_ACTIVE_DATA_EXPORTS_PER_USER} exportaciones en curso. Esperá a que terminen para pedir otra.`
    })
  }

  const definition = getDataExportDefinition(input.kind)
  const description = await definition.describe({ consultationId, filters })

  const record = await prisma.dataExport.create({
    data: {
      kind: input.kind,
      requestedByUserId: userId,
      consultationId,
      title: description.title.slice(0, TITLE_MAX_LENGTH),
      filters: description.filters as object
    },
    include: dataExportInclude
  })

  // Sin cola externa: se procesa en el mismo proceso, sin bloquear la respuesta.
  processDataExport(record.id).catch((error) => {
    console.error(`[exports] Error inesperado procesando la exportación ${record.id}:`, error)
  })

  return record
}

export const dataExportInclude = {
  files: { orderBy: { partNumber: 'asc' } },
  requestedBy: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
  consultation: { select: { id: true, title: true } }
} as const

const argentinaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function partFilename(base: string, date: Date, partNumber: number | null): string {
  const suffix = partNumber === null ? '' : `-parte-${partNumber}`
  return `${base}-${argentinaDateFormatter.format(date)}${suffix}.csv`
}

/**
 * Genera los archivos de una exportación pendiente: recorre las filas en tandas
 * y escribe una parte privada en el storage cada `rowsPerFile` filas. Siempre
 * deja al menos una parte (aunque solo tenga encabezados).
 */
export async function processDataExport(exportId: number): Promise<void> {
  const claimed = await prisma.dataExport.updateMany({
    where: { id: exportId, status: 'pending' },
    data: { status: 'processing', startedAt: new Date() }
  })
  if (claimed.count === 0) return

  const record = await prisma.dataExport.findUniqueOrThrow({ where: { id: exportId } })
  const definition = getDataExportDefinition(record.kind)
  const input = { consultationId: record.consultationId, filters: record.filters ?? {} }
  const rowsPerFile = dataExportRowsPerFile()
  const driver = useStorageDriver()
  const writtenKeys: string[] = []

  try {
    const { filenameBase } = await definition.describe(input)
    let partNumber = 0
    let totalRows = 0
    let pending: string[] = []

    const flush = async (): Promise<void> => {
      partNumber += 1
      const body = Buffer.from(csvDocument(definition.headers, pending), 'utf8')
      const key = `exports/${record.id}/${randomUUID()}.csv`
      await driver.put({ key, body, contentType: 'text/csv; charset=utf-8', public: false })
      writtenKeys.push(key)
      await prisma.dataExportFile.create({
        data: {
          exportId: record.id,
          partNumber,
          rowCount: pending.length,
          filename: partFilename(filenameBase, record.createdAt, partNumber),
          storagePath: key,
          sizeBytes: body.byteLength
        }
      })
      pending = []
    }

    for await (const batch of definition.rows(input, EXPORT_BATCH_SIZE)) {
      for (const row of batch) {
        pending.push(csvRow(row))
        totalRows += 1
        if (pending.length >= rowsPerFile) await flush()
      }
    }
    if (pending.length > 0 || partNumber === 0) await flush()

    // Con una sola parte, el nombre de archivo no lleva el sufijo `-parte-1`.
    if (partNumber === 1) {
      await prisma.dataExportFile.updateMany({
        where: { exportId: record.id },
        data: { filename: partFilename(filenameBase, record.createdAt, null) }
      })
    }

    await prisma.dataExport.update({
      where: { id: record.id },
      data: { status: 'ready', totalRows, completedAt: new Date(), errorMessage: null }
    })
  } catch (error) {
    console.error(`[exports] Falló la exportación ${record.id}:`, error)
    await Promise.allSettled(writtenKeys.map(key => driver.delete(key)))
    await prisma.dataExportFile.deleteMany({ where: { exportId: record.id } })
    const statusMessage = error as { statusCode?: number, message?: string }
    await prisma.dataExport.update({
      where: { id: record.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: statusMessage.statusCode && statusMessage.message
          ? statusMessage.message
          : 'No se pudo generar la exportación. Volvé a intentarlo.'
      }
    })
  }
}

/**
 * Marca como fallidas las exportaciones que quedaron sin terminar (por ejemplo,
 * si el servidor se reinició mientras se generaban).
 */
export async function failStaleDataExports(): Promise<void> {
  const now = Date.now()
  if (now - lastStaleSweepAt < STALE_SWEEP_INTERVAL_MS) return
  lastStaleSweepAt = now

  // Es mantenimiento: nunca debe tumbar la request que lo dispara. Primero se
  // lee sin bloquear filas y solo se actualiza si hay algo vencido.
  try {
    const threshold = new Date(now - STALE_DATA_EXPORT_MINUTES * 60_000)
    const stale = await prisma.dataExport.findMany({
      where: { status: { in: ['pending', 'processing'] }, createdAt: { lt: threshold } },
      select: { id: true }
    })
    if (stale.length === 0) return
    await prisma.dataExport.updateMany({
      where: { id: { in: stale.map(item => item.id) }, status: { in: ['pending', 'processing'] } },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: 'La generación se interrumpió. Volvé a pedir la exportación.'
      }
    })
  } catch (error) {
    console.error('[exports] No se pudieron marcar exportaciones vencidas', error)
  }
}

/** Borra del storage los archivos de una exportación (no falla si ya no están). */
export async function deleteDataExportStoredFiles(files: { storagePath: string }[]): Promise<void> {
  const driver = useStorageDriver()
  await Promise.allSettled(files.map(file => driver.delete(file.storagePath)))
}
