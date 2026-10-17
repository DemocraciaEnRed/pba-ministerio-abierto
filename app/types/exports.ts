export type DataExportKind
  = | 'consultation_comments'
    | 'platform_comments'
    | 'consultation_registrations'
    | 'consultation_accreditations'
    | 'regional_meeting_submissions'
    | 'observatory_contributions'

export type DataExportStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface DataExportFile {
  id: number
  partNumber: number
  rowCount: number
  filename: string
  sizeBytes: number
  downloadUrl: string
}

export interface DataExport {
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
  files: DataExportFile[]
  /** Solo presente para administradores de plataforma. */
  requestedBy?: { id: number, label: string, email: string }
}

export interface DataExportsResponse {
  items: DataExport[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface DataExportRequest {
  kind: DataExportKind
  consultationId?: number
  filters?: Record<string, unknown>
}
