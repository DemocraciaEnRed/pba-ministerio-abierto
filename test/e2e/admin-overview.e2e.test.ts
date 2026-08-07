import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const DAY_MS = 24 * 60 * 60 * 1000

interface Overview {
  range: string
  users: { total: number, inRange: number }
  consultations: { total: number, scheduled: number, open: number, closed: number, hidden: number, archived: number }
  activity: {
    total: number
    topLevel: number
    replies: number
    hidden: number
    deleted: number
    previousTotal: number | null
    allTimeTotal: number
    lastCommentAt: string | null
  }
}

/**
 * Los conteos son globales y conviven con el seed de la base de test: cada
 * aserción compara contra una línea base tomada antes de crear las fixtures.
 */
describe('Server e2e: resumen del panel de administración', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  let baseline7d: Overview

  const createdConsultationIds: number[] = []
  const createdUserIds: number[] = []
  let topicCommentCreatedAt: Date

  beforeAll(async () => {
    prisma = createTestPrisma()

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    baseline7d = (await api<Overview>('/api/admin/overview?range=7d', { cookie: adminCookie })).data

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })

    const now = Date.now()
    const createConsultation = async (suffix: string, data: Record<string, unknown>) => {
      const consultation = await prisma.consultation.create({
        data: {
          slug: `e2e-admin-${suffix}-${now}`,
          title: `Consulta admin e2e ${suffix}`,
          resultsVisibility: 'public',
          createdByUserId: admin.id,
          ...data
        }
      })
      createdConsultationIds.push(consultation.id)
      return consultation
    }

    await createConsultation('programada', {
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now + 5 * DAY_MS)
    })

    const open = await createConsultation('abierta', {
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now - DAY_MS),
      endsAt: new Date(now + DAY_MS)
    })

    await createConsultation('realizada', {
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now - 10 * DAY_MS),
      endsAt: new Date(now - DAY_MS)
    })

    await createConsultation('oculta', {
      visibility: 'hidden',
      startsAt: new Date(now - DAY_MS)
    })

    await createConsultation('archivada', {
      visibility: 'archived',
      startsAt: new Date(now - 10 * DAY_MS)
    })

    const topic = await prisma.topic.create({
      data: {
        consultationId: open.id,
        slug: 'tema-admin-e2e',
        title: 'Tema admin e2e',
        visibility: 'visible',
        mechanismType: 'support',
        participationStartsAt: new Date(now - DAY_MS)
      }
    })

    const root = await prisma.comment.create({
      data: {
        consultationId: open.id,
        authorUserId: citizen.id,
        body: 'Comentario de hace 2 días',
        createdAt: new Date(now - 2 * DAY_MS)
      }
    })

    await prisma.comment.createMany({
      data: [
        {
          parentCommentId: root.id,
          consultationId: open.id,
          authorUserId: citizen.id,
          body: 'Respuesta de hace 3 días',
          createdAt: new Date(now - 3 * DAY_MS)
        },
        {
          consultationId: open.id,
          authorUserId: citizen.id,
          body: 'Comentario oculto',
          moderationStatus: 'hidden',
          createdAt: new Date(now - 2 * DAY_MS)
        },
        {
          consultationId: open.id,
          authorUserId: citizen.id,
          body: 'Comentario de hace 10 días',
          createdAt: new Date(now - 10 * DAY_MS)
        }
      ]
    })

    topicCommentCreatedAt = new Date(now - 60 * 60 * 1000)
    await prisma.comment.create({
      data: {
        topicId: topic.id,
        authorUserId: citizen.id,
        body: 'Comentario en el tema',
        createdAt: topicCommentCreatedAt
      }
    })

    const recentUser = await prisma.user.create({
      data: { email: `e2e-admin-nuevo-${now}@example.com`, createdAt: new Date(now - DAY_MS) }
    })
    const oldUser = await prisma.user.create({
      data: { email: `e2e-admin-viejo-${now}@example.com`, createdAt: new Date(now - 40 * DAY_MS) }
    })
    createdUserIds.push(recentUser.id, oldUser.id)
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
    const commentIds = comments.map(comment => comment.id)
    if (commentIds.length > 0) {
      await prisma.commentReaction.deleteMany({ where: { commentId: { in: commentIds } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds }, parentCommentId: { not: null } } })
      await prisma.comment.deleteMany({ where: { id: { in: commentIds } } })
    }
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    await prisma.$disconnect()
  })

  describe('Autorización', () => {
    it('rechaza sin sesión (401)', async () => {
      const res = await api('/api/admin/overview')
      expect(res.status).toBe(401)
    })

    it('rechaza a la ciudadanía (403)', async () => {
      const res = await api('/api/admin/overview', { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('rechaza un rango inválido (422)', async () => {
      const res = await api('/api/admin/overview?range=1d', { cookie: adminCookie })
      expect(res.status).toBe(422)
    })
  })

  describe('Agregados', () => {
    it('usa 14 días por defecto', async () => {
      const res = await api<Overview>('/api/admin/overview', { cookie: adminCookie })
      expect(res.status).toBe(200)
      expect(res.data.range).toBe('14d')
    })

    it('cuenta usuarios totales y del período', async () => {
      const res = await api<Overview>('/api/admin/overview?range=7d', { cookie: adminCookie })

      expect(res.status).toBe(200)
      expect(res.data.users.total - baseline7d.users.total).toBe(2)
      expect(res.data.users.inRange - baseline7d.users.inRange).toBe(1)
    })

    it('cuenta las consultas por estado y visibilidad', async () => {
      const res = await api<Overview>('/api/admin/overview?range=7d', { cookie: adminCookie })
      const before = baseline7d.consultations
      const after = res.data.consultations

      expect(after.scheduled - before.scheduled).toBe(1)
      expect(after.open - before.open).toBe(1)
      expect(after.closed - before.closed).toBe(1)
      expect(after.hidden - before.hidden).toBe(1)
      expect(after.archived - before.archived).toBe(1)
      expect(after.total - before.total).toBe(5)
    })

    it('agrega la actividad de comentarios de toda la plataforma', async () => {
      const res = await api<Overview>('/api/admin/overview?range=7d', { cookie: adminCookie })
      const before = baseline7d.activity
      const after = res.data.activity

      // 1 raíz + 1 respuesta + 1 oculto + 1 del tema.
      expect(after.total - before.total).toBe(4)
      expect(after.replies - before.replies).toBe(1)
      expect(after.topLevel - before.topLevel).toBe(3)
      expect(after.hidden - before.hidden).toBe(1)
      // El alcance es global: puede haber comentarios sembrados más nuevos.
      expect(new Date(after.lastCommentAt!).getTime()).toBeGreaterThanOrEqual(topicCommentCreatedAt.getTime())
    })

    it('sin período de comparación para el rango histórico', async () => {
      const res = await api<Overview>('/api/admin/overview?range=all', { cookie: adminCookie })

      expect(res.data.activity.previousTotal).toBeNull()
      expect(res.data.users.inRange).toBe(res.data.users.total)
    })
  })
})
