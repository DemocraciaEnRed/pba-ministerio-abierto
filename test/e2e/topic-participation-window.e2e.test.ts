import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface ValidationError {
  field: string
  message: string
}

interface ErrorBody {
  data?: ValidationError[]
}

interface AdminTopic {
  id: number
  slug: string
  body: string | null
  participationStartsAt: string | null
  participationEndsAt: string | null
}

describe('Server e2e: ventana de participación de temas', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let consultationId: number

  // Ventana de la consulta: inicio ahora, cierre en 7 días.
  const now = Date.now()
  const consultationStart = new Date(now)
  const consultationEnd = new Date(now + 7 * 24 * 60 * 60 * 1000)

  const createdConsultationIds: number[] = []

  beforeAll(async () => {
    prisma = createTestPrisma()

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })

    const consultation = await prisma.consultation.create({
      data: {
        slug: `e2e-window-${now}`,
        title: 'Consulta ventana e2e',
        visibility: 'visible',
        publishedAt: new Date(),
        startsAt: consultationStart,
        endsAt: consultationEnd,
        resultsVisibility: 'public',
        createdByUserId: admin.id
      }
    })
    consultationId = consultation.id
    createdConsultationIds.push(consultation.id)

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  function topicPayload(overrides: Record<string, unknown> = {}) {
    return {
      slug: `tema-${Math.random().toString(36).slice(2, 10)}`,
      title: 'Tema de prueba',
      summary: null,
      body: 'Cuerpo del tema',
      participationStartsAt: consultationStart.toISOString(),
      participationEndsAt: consultationEnd.toISOString(),
      ...overrides
    }
  }

  it('rechaza un inicio anterior al inicio de la consulta (422)', async () => {
    const before = new Date(consultationStart.getTime() - 60 * 60 * 1000)
    const res = await api<ErrorBody>(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: topicPayload({ participationStartsAt: before.toISOString() })
    })

    expect(res.status).toBe(422)
    expect(res.data.data?.some(e => e.field === 'participationStartsAt')).toBe(true)
  })

  it('rechaza un cierre posterior al cierre de la consulta (422)', async () => {
    const after = new Date(consultationEnd.getTime() + 60 * 60 * 1000)
    const res = await api<ErrorBody>(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: topicPayload({ participationEndsAt: after.toISOString() })
    })

    expect(res.status).toBe(422)
    expect(res.data.data?.some(e => e.field === 'participationEndsAt')).toBe(true)
  })

  it('rechaza un cierre anterior al inicio del tema (422)', async () => {
    const start = new Date(consultationStart.getTime() + 2 * 24 * 60 * 60 * 1000)
    const end = new Date(consultationStart.getTime() + 24 * 60 * 60 * 1000)
    const res = await api<ErrorBody>(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: topicPayload({
        participationStartsAt: start.toISOString(),
        participationEndsAt: end.toISOString()
      })
    })

    expect(res.status).toBe(422)
    expect(res.data.data?.some(e => e.field === 'participationEndsAt')).toBe(true)
  })

  it('exige la fecha de inicio de participación (422)', async () => {
    const payload = topicPayload()
    delete (payload as Record<string, unknown>).participationStartsAt

    const res = await api<ErrorBody>(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: payload
    })

    expect(res.status).toBe(422)
  })

  it('crea el tema cuando la ventana queda dentro de la consulta', async () => {
    const res = await api<AdminTopic>(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: topicPayload()
    })

    expect(res.status).toBe(200)
    expect(res.data.body).toBe('Cuerpo del tema')
    expect(res.data.participationStartsAt).not.toBeNull()
  })

  describe('ajuste de temas al mover la ventana de la consulta', () => {
    const floorMinute = (iso: string) => Math.floor(new Date(iso).getTime() / 60_000)

    let adjustConsultationId: number
    let topicClampId: number
    let topicInheritId: number

    const base = Date.now()
    const cStart = new Date(base)
    const cEnd = new Date(base + 7 * 24 * 60 * 60 * 1000)
    // Nueva ventana más acotada.
    const newStart = new Date(base + 2 * 24 * 60 * 60 * 1000)
    const newEnd = new Date(base + 5 * 24 * 60 * 60 * 1000)

    beforeAll(async () => {
      const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL }, select: { id: true } })

      const consultation = await prisma.consultation.create({
        data: {
          slug: `e2e-adjust-${base}`,
          title: 'Consulta ajuste e2e',
          visibility: 'visible',
          publishedAt: new Date(),
          startsAt: cStart,
          endsAt: cEnd,
          resultsVisibility: 'public',
          createdByUserId: admin.id
        }
      })
      adjustConsultationId = consultation.id
      createdConsultationIds.push(consultation.id)

      // Tema con ventana explícita que abarca toda la consulta -> debe recortarse.
      const clampTopic = await prisma.topic.create({
        data: {
          consultationId: consultation.id,
          slug: 'tema-clamp',
          title: 'Tema con cierre propio',
          participationStartsAt: cStart,
          participationEndsAt: cEnd
        }
      })
      topicClampId = clampTopic.id

      // Tema sin cierre propio (hereda) -> no debe tocarse.
      const inheritTopic = await prisma.topic.create({
        data: {
          consultationId: consultation.id,
          slug: 'tema-hereda',
          title: 'Tema que hereda el cierre',
          participationStartsAt: cStart,
          participationEndsAt: null
        }
      })
      topicInheritId = inheritTopic.id
    })

    function consultationPayload(overrides: Record<string, unknown> = {}) {
      return {
        slug: `e2e-adjust-${base}`,
        title: 'Consulta ajuste e2e',
        summary: null,
        body: null,
        consultationFormat: 'single',
        startsAt: newStart.toISOString(),
        endsAt: newEnd.toISOString(),
        closedMessage: null,
        resultsVisibility: 'public',
        ...overrides
      }
    }

    it('rechaza editar la consulta sin sesión (401)', async () => {
      const res = await api(`/api/consultations/${adjustConsultationId}`, {
        method: 'PUT',
        body: consultationPayload()
      })
      expect(res.status).toBe(401)
    })

    it('recorta las fechas de los temas fuera de rango cuando adjustTopics=true', async () => {
      const res = await api(`/api/consultations/${adjustConsultationId}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: consultationPayload({ adjustTopics: true })
      })
      expect(res.status).toBe(200)

      const topics = await api<AdminTopic[]>(`/api/consultations/${adjustConsultationId}/topics`, {
        cookie: adminCookie
      })
      expect(topics.status).toBe(200)

      const clamp = topics.data.find(t => t.id === topicClampId)!
      const inherit = topics.data.find(t => t.id === topicInheritId)!

      // El tema con cierre propio se recorta a la nueva ventana.
      expect(floorMinute(clamp.participationStartsAt!)).toBe(floorMinute(newStart.toISOString()))
      expect(floorMinute(clamp.participationEndsAt!)).toBe(floorMinute(newEnd.toISOString()))

      // El tema que hereda mantiene su inicio recortado y su cierre en null.
      expect(floorMinute(inherit.participationStartsAt!)).toBe(floorMinute(newStart.toISOString()))
      expect(inherit.participationEndsAt).toBeNull()
    })
  })
})
