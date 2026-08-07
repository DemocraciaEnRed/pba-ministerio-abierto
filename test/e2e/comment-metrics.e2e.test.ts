import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface CommentMetrics {
  range: string
  from: string | null
  to: string
  total: number
  topLevel: number
  replies: number
  hidden: number
  deleted: number
  previousTotal: number | null
  deltaAbs: number | null
  deltaPct: number | null
  allTimeTotal: number
  lastCommentAt: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

describe('Server e2e: métricas de comentarios del panel de consulta', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let citizenCookie: string
  let adminCookie: string
  let managerCookie: string

  let consultationId: number
  let consultationSlug: string
  let membershipId: number
  let topicCommentCreatedAt: Date

  const createdConsultationIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })

    const now = Date.now()
    const consultation = await prisma.consultation.create({
      data: {
        slug: `e2e-metricas-${now}`,
        title: 'Consulta métricas e2e',
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: new Date(now - 60 * 60 * 1000),
        endsAt: new Date(now + 60 * 60 * 1000),
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    consultationId = consultation.id
    consultationSlug = consultation.slug
    createdConsultationIds.push(consultation.id)

    const topic = await prisma.topic.create({
      data: {
        consultationId: consultation.id,
        slug: 'tema-metricas-e2e',
        title: 'Tema métricas e2e',
        visibility: 'visible',
        mechanismType: 'support',
        participationStartsAt: new Date(now - 60 * 60 * 1000)
      }
    })

    const root = await prisma.comment.create({
      data: {
        consultationId: consultation.id,
        authorUserId: citizen.id,
        body: 'Comentario de hace 2 días',
        createdAt: new Date(now - 2 * DAY_MS)
      }
    })

    await prisma.comment.createMany({
      data: [
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Otro comentario de hace 2 días',
          createdAt: new Date(now - 2 * DAY_MS)
        },
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Comentario de hace 10 días',
          createdAt: new Date(now - 10 * DAY_MS)
        },
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Comentario de hace 20 días',
          createdAt: new Date(now - 20 * DAY_MS)
        },
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Comentario de hace 40 días',
          createdAt: new Date(now - 40 * DAY_MS)
        },
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Comentario oculto',
          moderationStatus: 'hidden',
          createdAt: new Date(now - 2 * DAY_MS)
        },
        {
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Comentario eliminado',
          moderationStatus: 'deleted',
          deletedAt: new Date(),
          createdAt: new Date(now - 2 * DAY_MS)
        },
        {
          parentCommentId: root.id,
          consultationId: consultation.id,
          authorUserId: citizen.id,
          body: 'Respuesta de hace 3 días',
          createdAt: new Date(now - 3 * DAY_MS)
        }
      ]
    })

    // El comentario del tema debe contar en las métricas de la consulta.
    topicCommentCreatedAt = new Date(now - DAY_MS)
    await prisma.comment.create({
      data: {
        topicId: topic.id,
        authorUserId: citizen.id,
        body: 'Comentario en el tema',
        createdAt: topicCommentCreatedAt
      }
    })

    const membership = await prisma.consultationMembership.create({
      data: {
        consultationId: consultation.id,
        userId: citizen.id,
        role: 'consultation_admin'
      }
    })
    membershipId = membership.id

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    // Mismo usuario ciudadano: sin membresía (403) y con membresía (200) según el caso.
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)
    managerCookie = citizenCookie
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
    await prisma.consultationMembership.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  describe('Autorización', () => {
    it('rechaza sin sesión (401)', async () => {
      const res = await api(`/api/consultations/${consultationSlug}/comment-metrics`)
      expect(res.status).toBe(401)
    })

    it('rechaza a un usuario sin membresía en la consulta (403)', async () => {
      await prisma.consultationMembership.delete({ where: { id: membershipId } })
      const res = await api(`/api/consultations/${consultationSlug}/comment-metrics`, { cookie: citizenCookie })
      expect(res.status).toBe(403)

      const restored = await prisma.consultationMembership.create({
        data: { consultationId, userId: (await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })).id, role: 'consultation_admin' }
      })
      membershipId = restored.id
    })

    it('permite al gestor de la consulta y al administrador de plataforma', async () => {
      const manager = await api(`/api/consultations/${consultationSlug}/comment-metrics`, { cookie: managerCookie })
      expect(manager.status).toBe(200)

      const admin = await api(`/api/consultations/${consultationSlug}/comment-metrics`, { cookie: adminCookie })
      expect(admin.status).toBe(200)
    })

    it('devuelve 404 para una consulta inexistente', async () => {
      const res = await api('/api/consultations/consulta-que-no-existe/comment-metrics', { cookie: adminCookie })
      expect(res.status).toBe(404)
    })
  })

  describe('Agregados por rango', () => {
    it('usa 14 días por defecto', async () => {
      const res = await api<CommentMetrics>(`/api/consultations/${consultationSlug}/comment-metrics`, { cookie: adminCookie })
      expect(res.status).toBe(200)
      expect(res.data.range).toBe('14d')
      expect(res.data.total).toBe(7)
      expect(res.data.previousTotal).toBe(1)
    })

    it('cuenta comentarios de la consulta y de sus temas en los últimos 7 días', async () => {
      const res = await api<CommentMetrics>(
        `/api/consultations/${consultationSlug}/comment-metrics?range=7d`,
        { cookie: adminCookie }
      )

      expect(res.status).toBe(200)
      expect(res.data.total).toBe(6)
      expect(res.data.replies).toBe(1)
      expect(res.data.topLevel).toBe(5)
      expect(res.data.hidden).toBe(1)
      expect(res.data.deleted).toBe(1)
      expect(res.data.previousTotal).toBe(1)
      expect(res.data.deltaAbs).toBe(5)
      expect(res.data.deltaPct).toBe(500)
      expect(new Date(res.data.lastCommentAt!).getTime()).toBe(topicCommentCreatedAt.getTime())
    })

    it('sin período de comparación para el rango histórico', async () => {
      const res = await api<CommentMetrics>(
        `/api/consultations/${consultationSlug}/comment-metrics?range=all`,
        { cookie: adminCookie }
      )

      expect(res.status).toBe(200)
      expect(res.data.from).toBeNull()
      expect(res.data.total).toBe(9)
      expect(res.data.allTimeTotal).toBe(9)
      expect(res.data.previousTotal).toBeNull()
      expect(res.data.deltaAbs).toBeNull()
      expect(res.data.deltaPct).toBeNull()
    })

    it('rechaza un rango inválido (422)', async () => {
      const res = await api(
        `/api/consultations/${consultationSlug}/comment-metrics?range=3d`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(422)
    })
  })
})
