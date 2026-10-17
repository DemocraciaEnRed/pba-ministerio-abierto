import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const COLLABORATOR_EMAIL = 'colaborador1@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface ConsultationsResponse {
  items: Array<{
    slug: string
    publicPath: string
    registration: {
      path: string
      state: string
      eventAt: string
      venueName: string
      venueCity: string
    } | null
  }>
  pagination: { total: number }
}

describe('Server e2e: filtros del listado para la home', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let collaboratorCookie: string

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const titlePrefix = `Home e2e ${runId}`
  const slugPrefix = `home-e2e-${runId}`
  const createdConsultationIds: number[] = []
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const slugs = {
    openFeatured: `${slugPrefix}-abierta-destacada`,
    scheduledFeatured: `${slugPrefix}-programada-destacada`,
    scheduledFar: `${slugPrefix}-programada-lejana`,
    openIndefinite: `${slugPrefix}-abierta-indefinida`,
    closedFeatured: `${slugPrefix}-finalizada-destacada`,
    hiddenFeatured: `${slugPrefix}-oculta-destacada`,
    // Participación lejana (fuera de la ventana) pero inscripción abierta ahora.
    registrationOpen: `${slugPrefix}-inscripcion-abierta`,
    // Inscripción ya cerrada y encuentro fuera de la ventana.
    registrationClosed: `${slugPrefix}-inscripcion-cerrada`
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
      select: { id: true }
    })

    const baseData = {
      summary: null,
      body: null,
      publishedAt: new Date(now - 20 * day),
      resultsVisibility: 'public' as const,
      createdByUserId: admin.id
    }

    const rows = [
      { slug: slugs.openFeatured, visibility: 'visible', featured: true, startsAt: now - 5 * day, endsAt: now + 3 * day },
      { slug: slugs.scheduledFeatured, visibility: 'visible', featured: true, startsAt: now + 10 * day, endsAt: now + 20 * day },
      { slug: slugs.scheduledFar, visibility: 'visible', featured: false, startsAt: now + 45 * day, endsAt: now + 60 * day },
      { slug: slugs.openIndefinite, visibility: 'visible', featured: false, startsAt: now - 40 * day, endsAt: null },
      { slug: slugs.closedFeatured, visibility: 'visible', featured: true, startsAt: now - 10 * day, endsAt: now - 2 * day },
      { slug: slugs.hiddenFeatured, visibility: 'hidden', featured: true, startsAt: now - day, endsAt: now + 5 * day },
      { slug: slugs.registrationOpen, visibility: 'visible', featured: false, startsAt: now + 50 * day, endsAt: now + 60 * day },
      { slug: slugs.registrationClosed, visibility: 'visible', featured: false, startsAt: now - 90 * day, endsAt: now - 40 * day }
    ] as const

    const created = await Promise.all(rows.map(row => prisma.consultation.create({ data: {
      ...baseData,
      slug: row.slug,
      title: `${titlePrefix} ${row.slug}`,
      visibility: row.visibility,
      featured: row.featured,
      startsAt: new Date(row.startsAt),
      endsAt: row.endsAt === null ? null : new Date(row.endsAt)
    } })))

    createdConsultationIds.push(...created.map(consultation => consultation.id))

    const bySlug = new Map(created.map(consultation => [consultation.slug, consultation.id]))
    const venue = { venueName: 'Teatro Municipal', venueAddress: 'Calle 1 123', venueCity: 'La Plata', venueProvince: 'Buenos Aires' }
    await prisma.consultationRegistrationForm.createMany({ data: [
      {
        ...venue,
        consultationId: bySlug.get(slugs.registrationOpen)!,
        title: 'Inscripción abierta',
        opensAt: new Date(now - day),
        closesAt: new Date(now + 5 * day),
        eventAt: new Date(now + 45 * day)
      },
      {
        ...venue,
        consultationId: bySlug.get(slugs.registrationClosed)!,
        title: 'Inscripción cerrada',
        opensAt: new Date(now - 80 * day),
        closesAt: new Date(now - 60 * day),
        eventAt: new Date(now - 50 * day)
      }
    ] })
    collaboratorCookie = await login(COLLABORATOR_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.$disconnect()
  })

  async function list(query: Record<string, string> = {}, cookie?: string) {
    const params = new URLSearchParams({ q: titlePrefix, perPage: '100', ...query })
    const response = await api<ConsultationsResponse>(`/api/consultations?${params}`, { cookie })
    expect(response.status).toBe(200)
    return response.data.items.map(item => item.slug)
  }

  it('filtra destacadas abiertas y programadas, abiertas primero', async () => {
    const result = await list({ featured: 'true', states: 'scheduled,open' })

    expect(result).toEqual([slugs.openFeatured, slugs.scheduledFeatured])
  })

  it('devuelve las visibles cuyo período se superpone con la ventana activa', async () => {
    const result = await list({
      activeFrom: new Date(now).toISOString(),
      activeTo: new Date(now + 30 * day).toISOString()
    })

    expect(new Set(result)).toEqual(new Set([
      slugs.openFeatured,
      slugs.scheduledFeatured,
      slugs.openIndefinite,
      // Entra por la inscripción, aunque la participación quede fuera de la ventana.
      slugs.registrationOpen
    ]))
  })

  it('filtra las instancias con la inscripción presencial abierta', async () => {
    expect(await list({ registrationOpen: 'true' })).toEqual([slugs.registrationOpen])

    const withoutOpenRegistration = await list({ registrationOpen: 'false' })
    expect(withoutOpenRegistration).toContain(slugs.registrationClosed)
    expect(withoutOpenRegistration).not.toContain(slugs.registrationOpen)
  })

  it('incluye el resumen de la inscripción en el listado público', async () => {
    const params = new URLSearchParams({ q: titlePrefix, perPage: '100' })
    const response = await api<ConsultationsResponse>(`/api/consultations?${params}`)
    const bySlug = new Map(response.data.items.map(item => [item.slug, item]))

    const open = bySlug.get(slugs.registrationOpen)!
    expect(open.registration).toMatchObject({
      path: `${open.publicPath}/inscripcion`,
      state: 'open',
      eventAt: new Date(now + 45 * day).toISOString(),
      venueName: 'Teatro Municipal',
      venueCity: 'La Plata'
    })
    expect(bySlug.get(slugs.registrationClosed)!.registration?.state).toBe('closed')
    expect(bySlug.get(slugs.openFeatured)!.registration).toBeNull()
  })

  it('respeta la búsqueda con una sesión no administradora', async () => {
    const result = await list({ q: `${titlePrefix} ${slugs.scheduledFar}` }, collaboratorCookie)

    expect(result).toEqual([slugs.scheduledFar])
  })

  it('rechaza combinaciones inválidas de filtros', async () => {
    const [both, halfRange, inverted, tooWide] = await Promise.all([
      api(`/api/consultations?state=open&states=open`),
      api(`/api/consultations?activeFrom=${encodeURIComponent(new Date(now).toISOString())}`),
      api(`/api/consultations?${new URLSearchParams({
        activeFrom: new Date(now + day).toISOString(),
        activeTo: new Date(now).toISOString()
      })}`),
      api(`/api/consultations?${new URLSearchParams({
        activeFrom: new Date(now).toISOString(),
        activeTo: new Date(now + 200 * day).toISOString()
      })}`)
    ])

    expect([both.status, halfRange.status, inverted.status, tooWide.status]).toEqual([422, 422, 422, 422])
  })
})
