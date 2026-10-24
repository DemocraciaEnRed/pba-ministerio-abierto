import { url } from '@nuxt/test-utils/e2e'
import { api } from './http'

export interface ExportFile {
  id: number
  partNumber: number
  rowCount: number
  filename: string
  sizeBytes: number
  downloadUrl: string
}

export interface ExportRecord {
  id: number
  kind: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  title: string
  consultation: { id: number, title: string } | null
  filters: Record<string, unknown>
  totalRows: number | null
  errorMessage: string | null
  files: ExportFile[]
  requestedBy?: { id: number, label: string, email: string }
}

export interface DownloadedPart {
  file: ExportFile
  bytes: Buffer
  csv: string
  contentDisposition: string | null
}

/** Espera a que una exportación termine (lista o fallida) consultando su estado. */
export async function waitForExport(id: number, cookie: string, timeoutMs = 15_000): Promise<ExportRecord> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await api<ExportRecord>(`/api/exports/${id}`, { cookie })
    if (res.status !== 200) {
      throw new Error(`GET /api/exports/${id} devolvió ${res.status}: ${JSON.stringify(res.data)}`)
    }
    if (res.data.status === 'ready' || res.data.status === 'failed') return res.data
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`La exportación ${id} no terminó a tiempo`)
}

export async function downloadExportFile(file: ExportFile, cookie: string): Promise<DownloadedPart> {
  const res = await fetch(url(file.downloadUrl), { headers: { cookie } })
  if (res.status !== 200) {
    throw new Error(`Descarga de ${file.downloadUrl} devolvió ${res.status}`)
  }
  const bytes = Buffer.from(await res.arrayBuffer())
  return {
    file,
    bytes,
    csv: bytes.toString('utf8'),
    contentDisposition: res.headers.get('content-disposition')
  }
}

/** Pide una exportación, espera a que esté lista y descarga todas sus partes. */
export async function runExport(
  body: Record<string, unknown>,
  cookie: string
): Promise<{ record: ExportRecord, parts: DownloadedPart[] }> {
  const created = await api<ExportRecord>('/api/exports', { method: 'POST', body, cookie })
  if (created.status !== 202) {
    throw new Error(`POST /api/exports devolvió ${created.status}: ${JSON.stringify(created.data)}`)
  }
  const record = await waitForExport(created.data.id, cookie)
  if (record.status !== 'ready') {
    throw new Error(`La exportación falló: ${record.errorMessage}`)
  }
  const parts = []
  for (const file of record.files) {
    parts.push(await downloadExportFile(file, cookie))
  }
  return { record, parts }
}

/** Filas de datos (sin BOM ni encabezado) de un CSV generado por la plataforma. */
export function csvDataLines(csv: string): string[] {
  return csv.replace(/^\uFEFF/, '').split('\r\n').slice(1).filter(Boolean)
}
