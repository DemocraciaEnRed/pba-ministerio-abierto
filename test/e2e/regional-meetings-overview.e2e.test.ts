import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const SECTION_SLUG = 'encuentros-regionales'
const OTHER_SECTION_SLUG = 'consultas-publicas'
const DAY_MS = 24 * 60 * 60 * 1000

interface Overview {
  range: string
  submissions: { total: number, inRange: number }
  consultations: { total: number, scheduled: number, open: number, closed: number }
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
 * Las métricas son de toda la sección, así que conviven con lo que haya sembrado
 * la base de test: cada aserción compara contra una línea base tomada antes de
 * crear las fixtures.
 */
describe('Server e2e: resumen del panel de Encuentros Regionales', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  let baseline7d: Overview
  let baselineAll: Overview

  const createdConsultationIds: number[] = []
  const createdSubmissionIds: number[] = []
  let topicCommentCreatedAt: Date

  beforeAll(async () => {
    prisma = createTestPrisma()

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    baseline7d = (await api<Overview>('/api/admin/regional-meetings/overview?range=7d', { cookie: adminCookie })).data
    baselineAll = (await api<Overview>('/api/admin/regional-meetings/overview?range=all', { cookie: adminCookie })).data

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })
    const citizen = await prisma.user.findUniqueOrThrow({ where: { email: CITIZEN_EMAIL }, select: { id: true } })
    const section = await prisma.section.findUniqueOrThrow({ where: { slug: SECTION_SLUG }, select: { id: true } })
    const otherSection = await prisma.section.findUniqueOrThrow({ where: { slug: OTHER_SECTION_SLUG }, select: { id: true } })

    const now = Date.now()
    const createConsultation = async (suffix: string, data: Record<string, unknown>) => {
      const consultation = await prisma.consultation.create({
        data: {
          slug: `e2e-er-${suffix}-${now}`,
          title: `Encuentro e2e ${suffix}`,
          resultsVisibility: 'public',
          createdByUserId: admin.id,
          ...data
        }
      })
      createdConsultationIds.push(consultation.id)
      return consultation
    }

    await createConsultation('programado', {
      sectionId: section.id,
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now + 5 * DAY_MS)
    })

    const open = await createConsultation('abierto', {
      sectionId: section.id,
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now - DAY_MS),
      endsAt: new Date(now + DAY_MS)
    })

    await createConsultation('realizado', {
      sectionId: section.id,
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now - 10 * DAY_MS),
      endsAt: new Date(now - DAY_MS)
    })

    await createConsultation('oculto', {
      sectionId: section.id,
      visibility: 'hidden',
      startsAt: new Date(now - DAY_MS)
    })

    // Control negativo: sus comentarios no deben contar en la actividad de la sección.
    const otherSectionConsultation = await createConsultation('otra-seccion', {
      sectionId: otherSection.id,
      visibility: 'visible',
      publishedAt: new Date(),
      startsAt: new Date(now - DAY_MS)
    })

    const topic = await prisma.topic.create({
      data: {
        consultationId: open.id,
        slug: 'tema-er-e2e',
        title: 'Tema Encuentros Regionales e2e',
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
          consultationId: open.id,
          authorUserId: citizen.id,
          body: 'Otro comentario de hace 2 días',
          createdAt: new Date(now - 2 * DAY_MS)
        },
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
          body: 'Comentario eliminado',
          moderationStatus: 'deleted',
          deletedAt: new Date(),
          createdAt: new Date(now - 2 * DAY_MS)
        },
        {
          consultationId: open.id,
          authorUserId: citizen.id,
          body: 'Comentario de hace 10 días',
          createdAt: new Date(now - 10 * DAY_MS)
        },
        {
          consultationId: otherSectionConsultation.id,
          authorUserId: citizen.id,
          body: 'Comentario de otra sección',
          createdAt: new Date(now - DAY_MS)
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

    const submissionBase = {
      firstName: 'Aporte',
      lastName: 'E2E',
      email: 'aporte-e2e@example.com',
      phone: '2211234567',
      provincia: 'Buenos Aires',
      ejeTematico: 'Infraestructura'
    }
    const recent = await prisma.regionalMeetingSubmission.create({
      data: { ...submissionBase, createdAt: new Date(now - DAY_MS) }
    })
    const old = await prisma.regionalMeetingSubmission.create({
      data: { ...submissionBase, createdAt: new Date(now - 40 * DAY_MS) }
    })
    createdSubmissionIds.push(recent.id, old.id)
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
    await prisma.regionalMeetingSubmission.deleteMany({ where: { id: { in: createdSubmissionIds } } })
    await prisma.$disconnect()
  })

  describe('Autorización', () => {
    it('rechaza sin sesión (401)', async () => {
      const res = await api('/api/admin/regional-meetings/overview')
      expect(res.status).toBe(401)
    })

    it('rechaza a la ciudadanía (403)', async () => {
      const res = await api('/api/admin/regional-meetings/overview', { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('rechaza un rango inválido (422)', async () => {
      const res = await api('/api/admin/regional-meetings/overview?range=1d', { cookie: adminCookie })
      expect(res.status).toBe(422)
    })
  })

  describe('Agregados', () => {
    it('usa 14 días por defecto', async () => {
      const res = await api<Overview>('/api/admin/regional-meetings/overview', { cookie: adminCookie })
      expect(res.status).toBe(200)
      expect(res.data.range).toBe('14d')
    })

    it('cuenta las consultas de la sección por estado', async () => {
      const res = await api<Overview>('/api/admin/regional-meetings/overview?range=7d', { cookie: adminCookie })
      const before = baseline7d.consultations
      const after = res.data.consultations

      expect(res.status).toBe(200)
      expect(after.scheduled - before.scheduled).toBe(1)
      expect(after.open - before.open).toBe(1)
      expect(after.closed - before.closed).toBe(1)
      // Las 4 de la sección, incluida la oculta; la de otra sección no suma.
      expect(after.total - before.total).toBe(4)
    })

    it('cuenta los aportes recibidos, totales y del período', async () => {
      const res = await api<Overview>('/api/admin/regional-meetings/overview?range=7d', { cookie: adminCookie })

      expect(res.data.submissions.total - baseline7d.submissions.total).toBe(2)
      expect(res.data.submissions.inRange - baseline7d.submissions.inRange).toBe(1)
    })

    it('acota la actividad a los comentarios de la sección', async () => {
      const res = await api<Overview>('/api/admin/regional-meetings/overview?range=7d', { cookie: adminCookie })
      const before = baseline7d.activity
      const after = res.data.activity

      // 2 raíz + 1 respuesta + 1 oculto + 1 eliminado + 1 del tema.
      expect(after.total - before.total).toBe(6)
      expect(after.replies - before.replies).toBe(1)
      expect(after.topLevel - before.topLevel).toBe(5)
      expect(after.hidden - before.hidden).toBe(1)
      expect(after.deleted - before.deleted).toBe(1)
      expect(new Date(after.lastCommentAt!).getTime()).toBe(topicCommentCreatedAt.getTime())
    })

    it('sin período de comparación para el rango histórico', async () => {
      const res = await api<Overview>('/api/admin/regional-meetings/overview?range=all', { cookie: adminCookie })

      expect(res.data.activity.previousTotal).toBeNull()
      expect(res.data.activity.total - baselineAll.activity.total).toBe(7)
      expect(res.data.activity.allTimeTotal - baselineAll.activity.allTimeTotal).toBe(7)
      expect(res.data.submissions.inRange - baselineAll.submissions.inRange).toBe(2)
    })
  })
})
