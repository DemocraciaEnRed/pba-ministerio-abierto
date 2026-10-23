import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface ReplyCounts {
  total: number
  visible: number
  hidden: number
  deleted: number
}

interface AdminComment {
  id: number
  parentCommentId: number | null
  body: string
  authorMode: 'citizen' | 'institution'
  moderationStatus?: 'visible' | 'hidden' | 'deleted'
  replyCounts?: ReplyCounts
  attachments?: { id: number, filename: string, downloadUrl: string }[]
}

interface Paginated<T> {
  items: T[]
  pagination: { page: number, perPage: number, total: number, totalPages: number }
}

interface LogEntry {
  id: number
  rootCommentId: number
  isReply: boolean
  excerpt: string
  authorEmail: string
  moderationStatus: 'visible' | 'hidden' | 'deleted'
  attachmentCount: number
  attachments: { id: number, filename: string, downloadUrl: string }[]
  consultation: { id: number, slug: string, title: string }
  topic: { id: number, slug: string, title: string } | null
}

/** Día de calendario (YYYY-MM-DD) en hora de Argentina, desplazado `offsetDays`. */
function argentinaDay(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

describe('Server e2e: bandeja por hilos, filtros y registro de comentarios', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let citizenCookie: string
  let adminCookie: string

  // Marca única para que las búsquedas no choquen con datos de otros tests.
  const mark = `zqx${Date.now()}`

  let consultationId: number
  let topicId: number
  let attachmentAssetId: number

  let answeredRootId: number
  let institutionalReplyId: number
  let hiddenReplyId: number
  let attachmentRootId: number
  let institutionRootId: number
  let oldRootId: number
  let topicRootId: number
  let hiddenSectionRootId: number

  const createdConsultationIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })

    const now = Date.now()
    const past = new Date(now - 60 * 60 * 1000)
    const future = new Date(now + 60 * 60 * 1000)

    const consultation = await prisma.consultation.create({
      data: {
        slug: `e2e-hilos-${now}`,
        title: `Consulta hilos ${mark}`,
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: past,
        endsAt: future,
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    consultationId = consultation.id
    createdConsultationIds.push(consultation.id)

    const topic = await prisma.topic.create({
      data: {
        consultationId: consultation.id,
        slug: 'tema-hilos-e2e',
        title: 'Tema hilos e2e',
        visibility: 'visible',
        mechanismType: 'support',
        participationStartsAt: past
      }
    })
    topicId = topic.id

    // Hilo con respuesta institucional visible y una respuesta ciudadana oculta.
    const answeredRoot = await prisma.comment.create({
      data: { consultationId, authorUserId: citizen.id, body: 'Raíz respondida por la institución', authorMode: 'citizen' }
    })
    answeredRootId = answeredRoot.id
    const institutionalReply = await prisma.comment.create({
      data: {
        consultationId,
        parentCommentId: answeredRootId,
        authorUserId: admin.id,
        body: 'Respuesta institucional',
        authorMode: 'institution'
      }
    })
    institutionalReplyId = institutionalReply.id
    const hiddenReply = await prisma.comment.create({
      data: {
        consultationId,
        parentCommentId: answeredRootId,
        authorUserId: citizen.id,
        body: `Respuesta oculta ${mark}`,
        authorMode: 'citizen',
        moderationStatus: 'hidden'
      }
    })
    hiddenReplyId = hiddenReply.id

    // Hilo sin respuesta y con adjunto.
    const asset = await prisma.asset.create({
      data: {
        assetType: 'uploaded_file',
        mediaType: 'document',
        storageProvider: 'local',
        storagePath: `e2e/${mark}.pdf`,
        originalFilename: 'adjunto-e2e.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10
      }
    })
    attachmentAssetId = asset.id
    const attachmentRoot = await prisma.comment.create({
      data: {
        consultationId,
        authorUserId: citizen.id,
        body: 'Raíz con adjunto sin respuesta',
        authorMode: 'citizen',
        attachments: { create: { assetId: attachmentAssetId, displayOrder: 0 } }
      }
    })
    attachmentRootId = attachmentRoot.id

    // Hilo iniciado por la institución: nunca cuenta como "sin respuesta".
    const institutionRoot = await prisma.comment.create({
      data: { consultationId, authorUserId: admin.id, body: 'Raíz institucional', authorMode: 'institution' }
    })
    institutionRootId = institutionRoot.id

    // Hilo viejo (hace 10 días) para el rango de fechas.
    const oldRoot = await prisma.comment.create({
      data: {
        consultationId,
        authorUserId: citizen.id,
        body: 'Raíz antigua',
        authorMode: 'citizen',
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000)
      }
    })
    oldRootId = oldRoot.id

    const topicRoot = await prisma.comment.create({
      data: { topicId, authorUserId: citizen.id, body: `Raíz del tema ${mark}`, authorMode: 'citizen' }
    })
    topicRootId = topicRoot.id

    // Consulta con la sección de comentarios oculta: la moderación sigue disponible.
    const hiddenSection = await prisma.consultation.create({
      data: {
        slug: `e2e-hilos-ocultos-${now}`,
        title: 'Consulta hilos ocultos e2e',
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: past,
        endsAt: future,
        commentsEnabled: false,
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    createdConsultationIds.push(hiddenSection.id)
    const hiddenSectionRoot = await prisma.comment.create({
      data: { consultationId: hiddenSection.id, authorUserId: citizen.id, body: 'Raíz en sección oculta', authorMode: 'citizen' }
    })
    hiddenSectionRootId = hiddenSectionRoot.id
    await prisma.comment.create({
      data: {
        consultationId: hiddenSection.id,
        parentCommentId: hiddenSectionRootId,
        authorUserId: citizen.id,
        body: 'Respuesta en sección oculta',
        authorMode: 'citizen'
      }
    })

    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
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
      await prisma.commentReaction.deleteMany({ where: { commentId: { in: commentIds } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds }, parentCommentId: { not: null } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds } } })
    }
    if (attachmentAssetId) {
      await prisma.asset.deleteMany({ where: { id: attachmentAssetId } })
    }
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  function inbox(query: string) {
    return api<Paginated<AdminComment>>(
      `/api/consultations/${consultationId}/comments?${query}`,
      { cookie: adminCookie }
    )
  }

  describe('Bandeja por hilos (level=top)', () => {
    it('lista solo comentarios de primer nivel con respuestas contadas por estado', async () => {
      const res = await inbox('level=top&perPage=100')
      expect(res.status).toBe(200)
      expect(res.data.items.every(c => c.parentCommentId === null)).toBe(true)

      const answered = res.data.items.find(c => c.id === answeredRootId)
      expect(answered?.replyCounts).toEqual({ total: 2, visible: 1, hidden: 1, deleted: 0 })

      const attachment = res.data.items.find(c => c.id === attachmentRootId)
      expect(attachment?.replyCounts).toEqual({ total: 0, visible: 0, hidden: 0, deleted: 0 })
    })

    it('sin `level` mantiene el listado plano (incluye respuestas, sin replyCounts)', async () => {
      const res = await inbox('perPage=100')
      expect(res.status).toBe(200)
      expect(res.data.items.some(c => c.id === hiddenReplyId)).toBe(true)
      expect(res.data.items.every(c => c.replyCounts === undefined)).toBe(true)
    })

    it('la búsqueda encuentra el hilo aunque el texto esté en una respuesta', async () => {
      const res = await inbox(`level=top&q=${mark}`)
      expect(res.status).toBe(200)
      const ids = res.data.items.map(c => c.id)
      expect(ids).toContain(answeredRootId)
      expect(ids).toContain(topicRootId)
      expect(ids).not.toContain(attachmentRootId)
    })

    it('el filtro de estado encuentra hilos con respuestas ocultas', async () => {
      const res = await inbox('level=top&moderationStatus=hidden')
      expect(res.status).toBe(200)
      expect(res.data.items.map(c => c.id)).toEqual([answeredRootId])
    })

    it('`unanswered` deja solo hilos ciudadanos sin respuesta institucional', async () => {
      const res = await inbox('level=top&unanswered=true&perPage=100')
      expect(res.status).toBe(200)
      const ids = res.data.items.map(c => c.id)
      expect(ids).toContain(attachmentRootId)
      expect(ids).toContain(oldRootId)
      expect(ids).toContain(topicRootId)
      expect(ids).not.toContain(answeredRootId)
      expect(ids).not.toContain(institutionRootId)
    })

    it('`withAttachment` deja solo hilos con adjunto', async () => {
      const res = await inbox('level=top&withAttachment=true')
      expect(res.status).toBe(200)
      expect(res.data.items.map(c => c.id)).toEqual([attachmentRootId])
      expect(res.data.items[0]?.attachments?.map(attachment => attachment.filename)).toEqual(['adjunto-e2e.pdf'])
    })

    it('`order=mostReplied` ordena por cantidad de respuestas', async () => {
      const res = await inbox('level=top&order=mostReplied')
      expect(res.status).toBe(200)
      expect(res.data.items[0]?.id).toBe(answeredRootId)
    })

    it('`order=oldest` empieza por el hilo más antiguo', async () => {
      const res = await inbox('level=top&order=oldest')
      expect(res.status).toBe(200)
      expect(res.data.items[0]?.id).toBe(oldRootId)
    })

    it('filtra por rango de días (hora de Argentina)', async () => {
      const res = await inbox(`level=top&from=${argentinaDay(-11)}&to=${argentinaDay(-9)}`)
      expect(res.status).toBe(200)
      expect(res.data.items.map(c => c.id)).toEqual([oldRootId])
    })

    it('rechaza un rango invertido (422)', async () => {
      const res = await inbox(`level=top&from=${argentinaDay(0)}&to=${argentinaDay(-5)}`)
      expect(res.status).toBe(422)
    })

    it('rechaza una fecha con formato inválido (422)', async () => {
      const res = await inbox('level=top&from=17-10-2026')
      expect(res.status).toBe(422)
    })

    it('la bandeja del tema acepta los mismos filtros', async () => {
      const res = await api<Paginated<AdminComment>>(
        `/api/consultations/${consultationId}/topics/${topicId}/comments?level=top&q=${mark}`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.items.map(c => c.id)).toEqual([topicRootId])
      expect(res.data.items[0]?.replyCounts?.total).toBe(0)
    })
  })

  describe('Hilo en modo moderación (`replies?view=moderation`)', () => {
    it('el admin recibe todas las respuestas, incluidas las ocultas, en vista admin', async () => {
      const res = await api<Paginated<AdminComment>>(
        `/api/comments/${answeredRootId}/replies?view=moderation&order=oldest`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.pagination.total).toBe(2)
      expect(res.data.items.map(c => c.id)).toEqual([institutionalReplyId, hiddenReplyId])
      expect(res.data.items.map(c => c.moderationStatus)).toEqual(['visible', 'hidden'])
    })

    it('para un ciudadano `view=moderation` se ignora: solo visibles y sin datos de moderación', async () => {
      const res = await api<Paginated<AdminComment>>(
        `/api/comments/${answeredRootId}/replies?view=moderation`,
        { cookie: citizenCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.items.map(c => c.id)).toEqual([institutionalReplyId])
      expect(res.data.items.every(c => c.moderationStatus === undefined)).toBe(true)
    })

    it('funciona aunque la sección de comentarios esté oculta (solo para admins)', async () => {
      const asAdmin = await api<Paginated<AdminComment>>(
        `/api/comments/${hiddenSectionRootId}/replies?view=moderation`,
        { cookie: adminCookie }
      )
      expect(asAdmin.status).toBe(200)
      expect(asAdmin.data.pagination.total).toBe(1)

      const asPublic = await api(`/api/comments/${hiddenSectionRootId}/replies?view=moderation`)
      expect(asPublic.status).toBe(403)
    })
  })

  describe('Registro de comentarios de la plataforma (GET /api/admin/comments)', () => {
    it('rechaza sin sesión (401)', async () => {
      const res = await api('/api/admin/comments')
      expect(res.status).toBe(401)
    })

    it('rechaza a un usuario que no es administrador de plataforma (403)', async () => {
      const res = await api('/api/admin/comments', { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('devuelve quién comentó dónde, con el hilo raíz resuelto', async () => {
      const res = await api<Paginated<LogEntry>>(
        `/api/admin/comments?consultationId=${consultationId}&perPage=100`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.pagination.total).toBe(7)

      const reply = res.data.items.find(entry => entry.id === hiddenReplyId)
      expect(reply).toMatchObject({
        rootCommentId: answeredRootId,
        isReply: true,
        moderationStatus: 'hidden',
        consultation: { id: consultationId },
        topic: null
      })
      expect(reply?.authorEmail).toBe(CITIZEN_EMAIL)

      const topicEntry = res.data.items.find(entry => entry.id === topicRootId)
      expect(topicEntry).toMatchObject({
        rootCommentId: topicRootId,
        isReply: false,
        consultation: { id: consultationId },
        topic: { id: topicId, slug: 'tema-hilos-e2e' }
      })

      const entry = res.data.items.find(item => item.id === attachmentRootId)
      expect(entry?.attachmentCount).toBe(1)
      expect(entry?.attachments.map(attachment => attachment.filename)).toEqual(['adjunto-e2e.pdf'])
      expect(entry?.attachments[0]?.downloadUrl).toMatch(new RegExp(`^/api/comments/${attachmentRootId}/attachments/\\d+$`))
    })

    it('filtra por estado, texto y fechas', async () => {
      const hidden = await api<Paginated<LogEntry>>(
        `/api/admin/comments?consultationId=${consultationId}&moderationStatus=hidden`,
        { cookie: adminCookie }
      )
      expect(hidden.data.items.map(entry => entry.id)).toEqual([hiddenReplyId])

      const search = await api<Paginated<LogEntry>>(`/api/admin/comments?q=${mark}`, { cookie: adminCookie })
      expect(search.status).toBe(200)
      expect(search.data.items.map(entry => entry.id).sort((a, b) => a - b))
        .toEqual([hiddenReplyId, topicRootId].sort((a, b) => a - b))

      const range = await api<Paginated<LogEntry>>(
        `/api/admin/comments?consultationId=${consultationId}&from=${argentinaDay(-11)}&to=${argentinaDay(-9)}`,
        { cookie: adminCookie }
      )
      expect(range.data.items.map(entry => entry.id)).toEqual([oldRootId])
    })

    it('`withAttachment` deja solo comentarios con adjunto', async () => {
      const res = await api<Paginated<LogEntry>>(
        `/api/admin/comments?consultationId=${consultationId}&withAttachment=true`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.items.map(entry => entry.id)).toEqual([attachmentRootId])
    })
  })
})
