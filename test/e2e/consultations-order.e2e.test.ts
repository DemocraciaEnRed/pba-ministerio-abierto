import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface ConsultationsResponse {
  items: Array<{ slug: string }>
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

describe('Server e2e: orden de consultas', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const titlePrefix = `Orden e2e ${runId}`
  const slugPrefix = `orden-e2e-${runId}`
  const createdConsultationIds: number[] = []
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const slugs = {
    openSoon: `${slugPrefix}-abierta-cierre-proximo`,
    openLater: `${slugPrefix}-abierta-cierre-lejano`,
    openIndefinite: `${slugPrefix}-abierta-indefinida`,
    scheduledSoon: `${slugPrefix}-programada-proxima`,
    scheduledSameCloseSoon: `${slugPrefix}-programada-empate-cierre-proximo`,
    scheduledSameCloseLater: `${slugPrefix}-programada-empate-cierre-lejano`,
    closedRecent: `${slugPrefix}-realizada-reciente`,
    closedOld: `${slugPrefix}-realizada-antigua`,
    archived: `${slugPrefix}-archivada`,
    hidden: `${slugPrefix}-oculta`
  }

  const openOrder = [slugs.openSoon, slugs.openLater, slugs.openIndefinite]
  const scheduledOrder = [
    slugs.scheduledSoon,
    slugs.scheduledSameCloseSoon,
    slugs.scheduledSameCloseLater
  ]
  const closedOrder = [slugs.closedRecent, slugs.closedOld]
  const allOrder = [...openOrder, ...scheduledOrder, ...closedOrder, slugs.hidden, slugs.archived]

  beforeAll(async () => {
    prisma = createTestPrisma()
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
      select: { id: true }
    })

    const sameScheduledStart = new Date(now + 2 * day)
    const baseData = {
      summary: null,
      body: null,
      publishedAt: new Date(now - 20 * day),
      resultsVisibility: 'public' as const,
      createdByUserId: admin.id
    }

    const created = await Promise.all([
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.openSoon,
        title: `${titlePrefix} abierta cierre próximo`,
        visibility: 'visible',
        startsAt: new Date(now - 10 * day),
        endsAt: new Date(now + day),
        createdAt: new Date(now - 10 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.openLater,
        title: `${titlePrefix} abierta cierre lejano`,
        visibility: 'visible',
        startsAt: new Date(now - day),
        endsAt: new Date(now + 3 * day),
        createdAt: new Date(now - 9 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.openIndefinite,
        title: `${titlePrefix} abierta indefinida`,
        visibility: 'visible',
        startsAt: new Date(now - 2 * day),
        endsAt: null,
        createdAt: new Date(now - 8 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.scheduledSoon,
        title: `${titlePrefix} programada próxima`,
        visibility: 'visible',
        startsAt: new Date(now + day),
        endsAt: new Date(now + 8 * day),
        createdAt: new Date(now - 7 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.scheduledSameCloseSoon,
        title: `${titlePrefix} programada empate cierre próximo`,
        visibility: 'visible',
        startsAt: sameScheduledStart,
        endsAt: new Date(now + 4 * day),
        createdAt: new Date(now - 6 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.scheduledSameCloseLater,
        title: `${titlePrefix} programada empate cierre lejano`,
        visibility: 'visible',
        startsAt: sameScheduledStart,
        endsAt: new Date(now + 6 * day),
        createdAt: new Date(now - 5 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.closedRecent,
        title: `${titlePrefix} realizada reciente`,
        visibility: 'visible',
        startsAt: new Date(now - 8 * day),
        endsAt: new Date(now - day),
        createdAt: new Date(now - 4 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.closedOld,
        title: `${titlePrefix} realizada antigua`,
        visibility: 'visible',
        startsAt: new Date(now - 10 * day),
        endsAt: new Date(now - 3 * day),
        createdAt: new Date(now - 3 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.archived,
        title: `${titlePrefix} archivada`,
        visibility: 'archived',
        startsAt: new Date(now - day),
        endsAt: new Date(now + day),
        createdAt: new Date(now - 2 * day)
      } }),
      prisma.consultation.create({ data: {
        ...baseData,
        slug: slugs.hidden,
        title: `${titlePrefix} oculta`,
        visibility: 'hidden',
        startsAt: new Date(now - day),
        endsAt: new Date(now + day),
        createdAt: new Date(now - day)
      } })
    ])

    createdConsultationIds.push(...created.map(consultation => consultation.id))
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  async function list(endpoint: string, query: Record<string, string | number> = {}) {
    const params = new URLSearchParams({
      q: titlePrefix,
      perPage: '100',
      ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)]))
    })
    const response = await api<ConsultationsResponse>(`${endpoint}?${params}`, { cookie: adminCookie })
    expect(response.status).toBe(200)
    return response.data
  }

  it('ordena cada estado temporal por su fecha útil', async () => {
    const [open, scheduled, closed] = await Promise.all([
      list('/api/consultations', { state: 'open' }),
      list('/api/consultations', { state: 'scheduled' }),
      list('/api/consultations', { state: 'closed' })
    ])

    expect(open.items.map(item => item.slug)).toEqual(openOrder)
    expect(scheduled.items.map(item => item.slug)).toEqual(scheduledOrder)
    expect(closed.items.map(item => item.slug)).toEqual(closedOrder)
  })

  it('concatena los estados visibles y deja las no visibles al final', async () => {
    const result = await list('/api/consultations')

    expect(result.items.map(item => item.slug)).toEqual(allOrder)
    expect(result.pagination.total).toBe(allOrder.length)
  })

  it('conserva el orden y la paginación al cruzar grupos en el listado admin', async () => {
    const perPage = 4
    const pages = await Promise.all([1, 2, 3].map(page =>
      list('/api/admin/consultations', { page, perPage })
    ))
    const paginatedSlugs = pages.flatMap(result => result.items.map(item => item.slug))

    expect(paginatedSlugs).toEqual(allOrder)
    expect(new Set(paginatedSlugs).size).toBe(allOrder.length)
    expect(pages[0]?.pagination).toMatchObject({ total: allOrder.length, totalPages: 3 })
  })
})
