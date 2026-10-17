import type { DataExportKind, DataExportStatus } from '../../../prisma/generated/enums'

export type DataExportView = 'owner' | 'admin'

type DataExportEntity = {
  id: number
  kind: DataExportKind
  status: DataExportStatus
  requestedByUserId: number
  consultationId: number | null
  title: string
  filters: unknown
  totalRows: number | null
  errorMessage: string | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  files: {
    id: number
    partNumber: number
    rowCount: number
    filename: string
    sizeBytes: number
  }[]
  requestedBy: {
    id: number
    displayName: string | null
    firstName: string | null
    lastName: string | null
    email: string
  }
  consultation: { id: number, title: string } | null
}

export interface DataExportFileDTO {
  id: number
  partNumber: number
  rowCount: number
  filename: string
  sizeBytes: number
  /** Descarga autorizada (nunca la ruta del storage). */
  downloadUrl: string
}

export interface OwnerDataExportDTO {
  id: number
  kind: DataExportKind
  status: DataExportStatus
  title: string
  consultation: { id: number, title: string } | null
  filters: Record<string, unknown>
  totalRows: number | null
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  files: DataExportFileDTO[]
}

export interface AdminDataExportDTO extends OwnerDataExportDTO {
  requestedBy: {
    id: number
    label: string
    email: string
  }
}

function serializeFilters(filters: unknown): Record<string, unknown> {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return {}
  return Object.fromEntries(
    Object.entries(filters as Record<string, unknown>).filter(([, value]) => value !== undefined && value !== null && value !== false)
  )
}

export function serializeDataExport(record: DataExportEntity, view: 'owner'): OwnerDataExportDTO
export function serializeDataExport(record: DataExportEntity, view: 'admin'): AdminDataExportDTO
export function serializeDataExport(record: DataExportEntity, view: DataExportView): OwnerDataExportDTO | AdminDataExportDTO
export function serializeDataExport(record: DataExportEntity, view: DataExportView): OwnerDataExportDTO | AdminDataExportDTO {
  const base: OwnerDataExportDTO = {
    id: record.id,
    kind: record.kind,
    status: record.status,
    title: record.title,
    consultation: record.consultation ? { id: record.consultation.id, title: record.consultation.title } : null,
    filters: serializeFilters(record.filters),
    totalRows: record.totalRows,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    files: record.status === 'ready'
      ? record.files.map(file => ({
          id: file.id,
          partNumber: file.partNumber,
          rowCount: file.rowCount,
          filename: file.filename,
          sizeBytes: file.sizeBytes,
          downloadUrl: `/api/exports/${record.id}/files/${file.id}`
        }))
      : []
  }

  if (view === 'owner') return base

  const author = record.requestedBy
  const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ').trim()
  return {
    ...base,
    requestedBy: {
      id: author.id,
      label: author.displayName?.trim() || fullName || author.email,
      email: author.email
    }
  }
}
