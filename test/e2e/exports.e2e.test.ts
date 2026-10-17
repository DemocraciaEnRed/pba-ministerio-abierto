import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'
import { csvDataLines, downloadExportFile, runExport, type ExportRecord } from './exports'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const COLLABORATOR_EMAIL = 'colaborador1@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface Paginated<T> {
  items: T[]
  pagination: { page: number, perPage: number, total: number, totalPages: number }
}

/** Parsea una línea CSV generada por la plataforma (todas las celdas entre comillas). */
function parseCsvLine(line: string): string[] {
  return [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match => match[1]!.replace(/""/g, '"'))
}

describe('Server e2e: exportaciones persistentes (CSV)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string
  let collaboratorCookie: string
  let adminId: number
  let collaboratorId: number

  const mark = `exp${Date.now()}`
  let consultationId: number
  let topicSlug: string
  let formulaRootId: number
  let deletedRootId: number

  const createdConsultationIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })
    const collaborator = await prisma.user.findUniqueOrThrow({ where: { email: COLLABORATOR_EMAIL }, select: { id: true } })
    adminId = admin.id
    collaboratorId = collaborator.id

    const now = Date.now()
    const consultation = await prisma.consultation.create({
      data: {
        slug: `e2e-exportaciones-${now}`,
        title: `Consulta exportaciones ${mark}`,
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: new Date(now - 60 * 60 * 1000),
        endsAt: new Date(now + 60 * 60 * 1000),
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    consultationId = consultation.id
    createdConsultationIds.push(consultation.id)

    const topic = await prisma.topic.create({
      data: {
        consultationId,
        slug: `tema-export-${now}`,
        title: 'Tema exportaciones',
        visibility: 'visible',
        mechanismType: 'support',
        participationStartsAt: new Date(now - 60 * 60 * 1000)
      }
    })
    topicSlug = topic.slug

    // Hilo cuyo texto arranca como fórmula de planilla, con una respuesta institucional.
    const formulaRoot = await prisma.comment.create({
      data: { consultationId, authorUserId: citizen.id, body: '=HYPERLINK("http://malo")', authorMode: 'citizen' }
    })
    formulaRootId = formulaRoot.id
    await prisma.comment.create({
      data: {
        consultationId,
        parentCommentId: formulaRootId,
        authorUserId: admin.id,
        body: `Respuesta institucional ${mark}`,
        authorMode: 'institution'
      }
    })

    // Hilo borrado: el CSV no debe incluir su texto.
    const deletedRoot = await prisma.comment.create({
      data: {
        consultationId,
        authorUserId: citizen.id,
        body: `Texto borrado ${mark}`,
        authorMode: 'citizen',
        moderationStatus: 'deleted'
      }
    })
    deletedRootId = deletedRoot.id

    await prisma.comment.create({
      data: { consultationId, authorUserId: citizen.id, body: `Oculto ${mark}`, authorMode: 'citizen', moderationStatus: 'hidden' }
    })
    await prisma.comment.create({
      data: { topicId: topic.id, authorUserId: citizen.id, body: `Del tema ${mark}`, authorMode: 'citizen' }
    })

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
    collaboratorCookie = await login(COLLABORATOR_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    const exports = await prisma.dataExport.findMany({
      where: { requestedByUserId: { in: [adminId, collaboratorId] }, title: { contains: mark } },
      select: { id: true }
    })
    if (exports.length > 0) {
      await prisma.dataExport.deleteMany({ where: { id: { in: exports.map(item => item.id) } } })
    }
    await prisma.dataExport.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    const comments = await prisma.comment.findMany({
      where: {
        OR: [
          { consultationId: { in: createdConsultationIds } },
          { topic: { consultationId: { in: createdConsultationIds } } }
        ]
      },
      select: { id: true }
    })
    const commentIds = comments.map(c => c.id)
    if (commentIds.length > 0) {
      await prisma.comment.deleteMany({ where: { id: { in: commentIds }, parentCommentId: { not: null } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds } } })
    }
    await prisma.consultationMembership.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  const consultationCommentsBody = () => ({ kind: 'consultation_comments', consultationId })

  describe('Autorización al pedir', () => {
    it('exige sesión (401)', async () => {
      const res = await api('/api/exports', { method: 'POST', body: consultationCommentsBody() })
      expect(res.status).toBe(401)
    })

    it('rechaza a la ciudadanía en ambos alcances (403)', async () => {
      const byConsultation = await api('/api/exports', { method: 'POST', cookie: citizenCookie, body: consultationCommentsBody() })
      expect(byConsultation.status).toBe(403)
      const byPlatform = await api('/api/exports', { method: 'POST', cookie: citizenCookie, body: { kind: 'platform_comments' } })
      expect(byPlatform.status).toBe(403)
    })

    it('rechaza a un/a colaborador/a sin asignación en la consulta (403)', async () => {
      const res = await api('/api/exports', { method: 'POST', cookie: collaboratorCookie, body: consultationCommentsBody() })
      expect(res.status).toBe(403)
    })

    it('valida el tipo de exportación (422)', async () => {
      const res = await api('/api/exports', { method: 'POST', cookie: adminCookie, body: { kind: 'inexistente' } })
      expect(res.status).toBe(422)
    })
  })

  describe('Comentarios de una consulta', () => {
    let fullExport: ExportRecord
    let lines: string[][]

    it('genera el CSV en partes, con BOM y encabezados en cada parte', async () => {
      const { record, parts } = await runExport(consultationCommentsBody(), adminCookie)
      fullExport = record

      // 4 hilos + 1 respuesta; .env.test fija 3 filas por archivo.
      expect(record.totalRows).toBe(5)
      expect(parts).toHaveLength(2)
      expect(parts.map(part => part.file.rowCount)).toEqual([3, 2])
      expect(parts[0]!.file.filename).toMatch(/-parte-1\.csv$/)
      expect(parts[1]!.file.filename).toMatch(/-parte-2\.csv$/)

      for (const part of parts) {
        expect(part.bytes.subarray(0, 3)).toEqual(Buffer.from([0xEF, 0xBB, 0xBF]))
        expect(part.csv.replace(/^\uFEFF/, '')).toMatch(/^"ID","ID del hilo","Tipo"/)
        expect(part.contentDisposition).toContain('attachment')
      }

      lines = parts.flatMap(part => csvDataLines(part.csv)).map(parseCsvLine)
      expect(lines).toHaveLength(5)
    })

    it('incluye el correo de la autoría y vacía el texto de los borrados', async () => {
      const csv = lines.map(cells => cells.join('|')).join('\n')
      expect(csv).toContain(CITIZEN_EMAIL)
      expect(csv).toContain(`Oculto ${mark}`)
      expect(csv).not.toContain(`Texto borrado ${mark}`)

      const deleted = lines.find(cells => cells[0] === String(deletedRootId))
      expect(deleted).toBeDefined()
      expect(deleted).toContain('Borrado')
    })

    it('neutraliza textos que empiezan como fórmula', async () => {
      const formula = lines.find(cells => cells[0] === String(formulaRootId))
      expect(formula).toContain('\'=HYPERLINK("http://malo")')
    })

    it('respeta los filtros y los guarda en el registro', async () => {
      const { record, parts } = await runExport(
        { ...consultationCommentsBody(), filters: { topic: topicSlug } },
        adminCookie
      )
      // El tema se normaliza a su id al pedir la exportación.
      expect(record.filters).toHaveProperty('topicId')
      expect(record.totalRows).toBe(1)
      expect(parts).toHaveLength(1)
      // Con una sola parte el nombre no lleva sufijo.
      expect(parts[0]!.file.filename).not.toContain('-parte-')
      expect(parts[0]!.csv).toContain(`Del tema ${mark}`)
    })

    it('exporta el hilo completo aunque el filtro solo coincida con la raíz', async () => {
      const { record } = await runExport(
        { ...consultationCommentsBody(), filters: { q: 'HYPERLINK' } },
        adminCookie
      )
      expect(record.totalRows).toBe(2)
    })

    it('no expone los archivos por la ruta pública de uploads', async () => {
      const stored = await prisma.dataExportFile.findFirstOrThrow({ where: { exportId: fullExport.id } })
      const res = await fetch(url(`/uploads/${stored.storagePath}`))
      expect(res.status).toBe(404)
    })
  })

  describe('Comentarios de la plataforma', () => {
    it('solo platform-admin y con filtro por consulta', async () => {
      const denied = await api('/api/exports', { method: 'POST', cookie: collaboratorCookie, body: { kind: 'platform_comments' } })
      expect(denied.status).toBe(403)

      const { record, parts } = await runExport(
        { kind: 'platform_comments', filters: { consultationId } },
        adminCookie
      )
      expect(record.totalRows).toBe(5)
      const rows = parts.flatMap(part => csvDataLines(part.csv)).map(parseCsvLine)
      expect(rows.every(cells => cells[3] === String(consultationId))).toBe(true)
    })
  })

  describe('Acceso a exportaciones ajenas y listado', () => {
    let adminExport: ExportRecord
    let collaboratorExport: ExportRecord

    it('quien gestiona la consulta puede exportar y descargar', async () => {
      await prisma.consultationMembership.create({
        data: { consultationId, userId: collaboratorId, role: 'consultation_admin' }
      })
      adminExport = (await runExport(consultationCommentsBody(), adminCookie)).record
      const collaboratorRun = await runExport(consultationCommentsBody(), collaboratorCookie)
      collaboratorExport = collaboratorRun.record

      expect(collaboratorExport.status).toBe('ready')
      expect(collaboratorRun.parts[0]!.csv).toContain('"ID del hilo"')
      expect(collaboratorExport.requestedBy).toBeUndefined()
    })

    it('oculta las exportaciones de otras personas (404)', async () => {
      const detail = await api(`/api/exports/${adminExport.id}`, { cookie: collaboratorCookie })
      expect(detail.status).toBe(404)
      const file = await api(adminExport.files[0]!.downloadUrl, { cookie: collaboratorCookie })
      expect(file.status).toBe(404)
      const removal = await api(`/api/exports/${adminExport.id}`, { method: 'DELETE', cookie: collaboratorCookie })
      expect(removal.status).toBe(404)
    })

    it('lista solo las propias por defecto', async () => {
      const res = await api<Paginated<ExportRecord>>('/api/exports?perPage=50', { cookie: collaboratorCookie })
      expect(res.status).toBe(200)
      const ids = res.data.items.map(item => item.id)
      expect(ids).toContain(collaboratorExport.id)
      expect(ids).not.toContain(adminExport.id)
    })

    it('scope=all es solo para platform-admin y muestra quién pidió', async () => {
      const denied = await api('/api/exports?scope=all', { cookie: collaboratorCookie })
      expect(denied.status).toBe(403)

      const res = await api<Paginated<ExportRecord>>(
        `/api/exports?scope=all&kind=consultation_comments&consultationId=${consultationId}&perPage=50`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      const own = res.data.items.find(item => item.id === collaboratorExport.id)
      expect(own?.requestedBy?.email).toBe(COLLABORATOR_EMAIL)
    })

    it('platform-admin puede descargar exportaciones ajenas (auditoría)', async () => {
      const part = await downloadExportFile(collaboratorExport.files[0]!, adminCookie)
      expect(part.csv).toContain('"ID del hilo"')
    })

    it('al perder la asignación ya no puede descargar sus exportaciones (403)', async () => {
      await prisma.consultationMembership.deleteMany({ where: { consultationId, userId: collaboratorId } })
      const res = await api(collaboratorExport.files[0]!.downloadUrl, { cookie: collaboratorCookie })
      expect(res.status).toBe(403)
    })

    it('eliminar borra el registro y los archivos guardados', async () => {
      const files = await prisma.dataExportFile.findMany({ where: { exportId: adminExport.id } })
      const storageDir = resolve(process.env.NUXT_STORAGE_LOCAL_DIR ?? './.data/uploads')
      const paths = files.map(file => resolve(storageDir, file.storagePath))
      expect(paths.every(path => existsSync(path))).toBe(true)

      const res = await api(`/api/exports/${adminExport.id}`, { method: 'DELETE', cookie: adminCookie })
      expect(res.status).toBe(204)

      expect(paths.some(path => existsSync(path))).toBe(false)
      const detail = await api(`/api/exports/${adminExport.id}`, { cookie: adminCookie })
      expect(detail.status).toBe(404)
    })
  })

  describe('Límite de exportaciones en curso', () => {
    it('rechaza una cuarta exportación en curso (429) y no deja eliminar las activas (409)', async () => {
      const pending = await Promise.all([1, 2, 3].map(n => prisma.dataExport.create({
        data: {
          kind: 'consultation_comments',
          status: 'pending',
          requestedByUserId: adminId,
          consultationId,
          title: `Pendiente ${n} ${mark}`,
          filters: {}
        }
      })))

      try {
        const res = await api('/api/exports', { method: 'POST', cookie: adminCookie, body: consultationCommentsBody() })
        expect(res.status).toBe(429)

        const removal = await api(`/api/exports/${pending[0]!.id}`, { method: 'DELETE', cookie: adminCookie })
        expect(removal.status).toBe(409)
      } finally {
        await prisma.dataExport.deleteMany({ where: { id: { in: pending.map(item => item.id) } } })
      }
    })
  })
})
