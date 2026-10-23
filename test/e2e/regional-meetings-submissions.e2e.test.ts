import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login, postMultipart, type MultipartFile } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const PDF_CONTENT = '%PDF-1.4 contenido'
const MB = 1024 * 1024

interface SubmissionPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  provincia: string
  municipio?: string
  representsInstitution: boolean
  organization?: string
  ejeTematico: string
  subejeTematico?: string | null
  ideaProyecto?: string
  comentarios?: string
  enlaces?: { url: string, title?: string }[]
  website?: string
}

interface AdminSubmission {
  id: number
  email: string
  attachments: { id: number, filename: string, sizeBytes: number | null, downloadUrl: string }[]
}

interface SubmissionsResponse {
  items: AdminSubmission[]
}

/** POST público multipart de un aporte (`payload` JSON + archivos opcionales). */
function postSubmission(payload: SubmissionPayload, files: MultipartFile[] = []) {
  return postMultipart('/api/regional-meetings/submissions', {
    fields: { payload: JSON.stringify(payload) },
    files
  })
}

describe('Server e2e: adjuntos de aportes de Encuentros Regionales', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  const createdEmails: string[] = []

  function buildPayload(): SubmissionPayload {
    const email = `encuentro-${Math.random().toString(36).slice(2)}@example.com`
    createdEmails.push(email)
    return {
      firstName: 'Ana',
      lastName: 'Pérez',
      email,
      phone: '11 12345678',
      provincia: 'Buenos Aires',
      municipio: 'La Plata',
      representsInstitution: false,
      ejeTematico: 'Mi aporte es para todo el Plan',
      ideaProyecto: 'Una idea de proyecto'
    }
  }

  async function findSubmissionByEmail(email: string): Promise<AdminSubmission | undefined> {
    const res = await api<SubmissionsResponse>('/api/regional-meetings/submissions?perPage=100', { cookie: adminCookie })
    return res.data.items.find(item => item.email === email)
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    const attachments = await prisma.regionalMeetingSubmissionAttachment.findMany({
      where: { submission: { email: { in: createdEmails } } },
      select: { assetId: true }
    })
    await prisma.regionalMeetingSubmission.deleteMany({ where: { email: { in: createdEmails } } })
    await prisma.asset.deleteMany({ where: { id: { in: attachments.map(attachment => attachment.assetId) } } })
    await prisma.$disconnect()
  })

  it('acepta un aporte sin adjuntos', async () => {
    const payload = buildPayload()
    const res = await postSubmission(payload)
    expect(res.status).toBe(201)

    const stored = await findSubmissionByEmail(payload.email)
    expect(stored!.attachments).toEqual([])
  })

  it('acepta hasta 3 archivos y respeta el orden de carga', async () => {
    const payload = buildPayload()
    const res = await postSubmission(payload, [
      { content: PDF_CONTENT, filename: 'uno.pdf', type: 'application/pdf' },
      { content: 'col1,col2', filename: 'dos.csv', type: 'text/csv' },
      { content: 'imagen', filename: 'tres.webp', type: 'image/webp' }
    ])
    expect(res.status).toBe(201)

    const stored = await findSubmissionByEmail(payload.email)
    expect(stored!.attachments.map(attachment => attachment.filename)).toEqual(['uno.pdf', 'dos.csv', 'tres.webp'])
    for (const attachment of stored!.attachments) {
      expect(attachment.downloadUrl).toBe(`/api/regional-meetings/submissions/${stored!.id}/attachments/${attachment.id}`)
    }

    const detail = await api<AdminSubmission>(`/api/regional-meetings/submissions/${stored!.id}`, { cookie: adminCookie })
    expect(detail.data.attachments).toHaveLength(3)
  })

  it('rechaza más de 3 archivos (422)', async () => {
    const payload = buildPayload()
    const res = await postSubmission(payload, Array.from({ length: 4 }, (_, index) => ({
      content: PDF_CONTENT,
      filename: `archivo-${index}.pdf`,
      type: 'application/pdf'
    })))
    expect(res.status).toBe(422)
    expect(await findSubmissionByEmail(payload.email)).toBeUndefined()
  })

  it('rechaza archivos que superan los 30 MB en total (422)', async () => {
    const payload = buildPayload()
    const half = new Uint8Array(15 * MB + 1)
    const res = await postSubmission(payload, [
      { content: half, filename: 'mitad-1.pdf', type: 'application/pdf' },
      { content: half, filename: 'mitad-2.pdf', type: 'application/pdf' }
    ])
    expect(res.status).toBe(422)
    expect(await findSubmissionByEmail(payload.email)).toBeUndefined()
  })

  it('rechaza tipos de archivo no permitidos (422)', async () => {
    const payload = buildPayload()
    const res = await postSubmission(payload, [
      { content: 'ejecutable', filename: 'virus.exe', type: 'application/x-msdownload' }
    ])
    expect(res.status).toBe(422)
  })

  it('platform-admin descarga cada adjunto; el resto no', async () => {
    const payload = buildPayload()
    await postSubmission(payload, [
      { content: PDF_CONTENT, filename: 'primero.pdf', type: 'application/pdf' },
      { content: 'texto plano', filename: 'segundo.txt', type: 'text/plain' }
    ])

    const stored = await findSubmissionByEmail(payload.email)
    const second = stored!.attachments[1]!

    const download = await fetch(url(second.downloadUrl), { headers: { cookie: adminCookie } })
    expect(download.status).toBe(200)
    expect(download.headers.get('content-disposition')).toContain('segundo.txt')
    expect(await download.text()).toBe('texto plano')

    const asCitizen = await api(second.downloadUrl, { cookie: citizenCookie })
    expect(asCitizen.status).toBe(403)

    const anonymous = await api(second.downloadUrl)
    expect(anonymous.status).toBe(401)
  })

  it('devuelve 404 si el adjunto no pertenece al aporte', async () => {
    const withFile = buildPayload()
    await postSubmission(withFile, [{ content: PDF_CONTENT, filename: 'ajeno.pdf', type: 'application/pdf' }])
    const withoutFile = buildPayload()
    await postSubmission(withoutFile)

    const owner = await findSubmissionByEmail(withFile.email)
    const other = await findSubmissionByEmail(withoutFile.email)
    const res = await api(
      `/api/regional-meetings/submissions/${other!.id}/attachments/${owner!.attachments[0]!.id}`,
      { cookie: adminCookie }
    )
    expect(res.status).toBe(404)
  })
})
