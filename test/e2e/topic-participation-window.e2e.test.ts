import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface AdminTopic {
  id: number
  slug: string
}

describe('Server e2e: temas de participación deshabilitados', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let consultationId: number
  let historicalTopicId: number

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

    const historicalTopic = await prisma.topic.create({
      data: {
        consultationId: consultation.id,
        slug: 'tema-historico',
        title: 'Tema histórico',
        participationStartsAt: consultationStart,
        participationEndsAt: consultationEnd
      }
    })
    historicalTopicId = historicalTopic.id

    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.topic.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  it('conserva la lectura de temas históricos (200)', async () => {
    const res = await api<AdminTopic[]>(`/api/consultations/${consultationId}/topics`, {
      cookie: adminCookie
    })

    expect(res.status).toBe(200)
    expect(res.data.some(topic => topic.id === historicalTopicId)).toBe(true)
  })

  it('deshabilita la creación de temas (410)', async () => {
    const res = await api(`/api/consultations/${consultationId}/topics`, {
      method: 'POST',
      cookie: adminCookie,
      body: { title: 'Tema nuevo' }
    })

    expect(res.status).toBe(410)
  })

  it('deshabilita la edición de temas (410)', async () => {
    const res = await api(`/api/consultations/${consultationId}/topics/${historicalTopicId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: { title: 'Tema modificado' }
    })

    expect(res.status).toBe(410)
  })

  it('deshabilita el borrado de temas (410)', async () => {
    const res = await api(`/api/consultations/${consultationId}/topics/${historicalTopicId}`, {
      method: 'DELETE',
      cookie: adminCookie
    })

    expect(res.status).toBe(410)
  })
})
