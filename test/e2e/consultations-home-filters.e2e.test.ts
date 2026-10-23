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
  let adminCookie: string
  let sectionId: number
  let categoryId: number
  const createdSectionIds: number[] = []
  const tags: Record<string, number> = {}

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
    registrationClosed: `${slugPrefix}-inscripcion-cerrada`,
    archived: `${slugPrefix}-archivada`,
    otherSection: `${slugPrefix}-otra-seccion`,
    extra: `${slugPrefix}-extra`
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
      select: { id: true }
    })
    for (const suffix of ['principal', 'otra', 'vacia']) {
      const section = await prisma.section.create({
        data: { slug: `${slugPrefix}-${suffix}`, name: `Home ${suffix} ${runId}` }
      })
      createdSectionIds.push(section.id)
    }
    sectionId = createdSectionIds[0]!
    const category = await prisma.category.create({
      data: { sectionId, slug: `${slugPrefix}-categoria`, name: `Categoría ${runId}` }
    })
    categoryId = category.id
    for (const suffix of ['compartida', 'abierta', 'cerrada', 'archivada', 'oculta', 'otra', 'inactiva', 'sin-uso', 'solo-tema']) {
      const tag = await prisma.tag.create({
        data: { slug: `${slugPrefix}-${suffix}`, name: `Etiqueta ${suffix} ${runId}`, isActive: suffix !== 'inactiva' }
      })
      tags[suffix] = tag.id
    }

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
      { slug: slugs.registrationClosed, visibility: 'visible', featured: false, startsAt: now - 90 * day, endsAt: now - 40 * day },
      { slug: slugs.archived, visibility: 'archived', featured: false, startsAt: now - 90 * day, endsAt: now - 40 * day },
      { slug: slugs.otherSection, visibility: 'visible', featured: false, startsAt: now - day, endsAt: null },
      { slug: slugs.extra, visibility: 'visible', featured: false, startsAt: now - day, endsAt: null }
    ] as const

    const created = await Promise.all(rows.map(row => prisma.consultation.create({ data: {
      ...baseData,
      sectionId: row.slug === slugs.otherSection ? createdSectionIds[1]! : sectionId,
      slug: row.slug,
      title: `${titlePrefix} ${row.slug}`,
      visibility: row.visibility,
      featured: row.featured,
      startsAt: new Date(row.startsAt),
      endsAt: row.endsAt === null ? null : new Date(row.endsAt)
    } })))

    createdConsultationIds.push(...created.map(consultation => consultation.id))

    const bySlug = new Map(created.map(consultation => [consultation.slug, consultation.id]))
    const assignments = [
      [slugs.openFeatured, 'compartida'], [slugs.openFeatured, 'abierta'],
      [slugs.openFeatured, 'inactiva'], [slugs.scheduledFeatured, 'compartida'],
      [slugs.closedFeatured, 'cerrada'], [slugs.archived, 'archivada'],
      [slugs.hiddenFeatured, 'oculta'], [slugs.otherSection, 'otra'],
      [slugs.otherSection, 'compartida']
    ] as const
    await prisma.consultationTag.createMany({
      data: assignments.map(([slug, tag]) => ({ consultationId: bySlug.get(slug)!, tagId: tags[tag]! }))
    })
    await prisma.consultationCategoryAssignment.createMany({
      data: [slugs.openFeatured, slugs.scheduledFeatured, slugs.closedFeatured].map(slug => ({
        consultationId: bySlug.get(slug)!,
        categoryId
      }))
    })
    await prisma.topic.create({
      data: {
        consultationId: bySlug.get(slugs.openFeatured)!,
        slug: `${slugPrefix}-tema`,
        title: 'Tema de prueba',
        participationStartsAt: new Date(now - day),
        topicTags: { create: { tagId: tags['solo-tema']! } }
      }
    })
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
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    await prisma.tag.deleteMany({ where: { id: { in: Object.values(tags) } } })
    if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } })
    await prisma.section.deleteMany({ where: { id: { in: createdSectionIds } } })
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
      slugs.registrationOpen,
      slugs.otherSection, slugs.extra
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

  it('ofrece solo etiquetas activas de consultas públicas de la sección, también para administradores', async () => {
    for (const cookie of [undefined, adminCookie]) {
      const response = await api<Array<{ id: number }>>(`/api/tags?sectionSlug=${slugPrefix}-principal`, { cookie })
      expect(response.status).toBe(200)
      expect(response.data.map(tag => tag.id).sort()).toEqual([
        tags.compartida, tags.abierta, tags.cerrada, tags.archivada
      ].sort())
    }
    const other = await api<Array<{ id: number }>>(`/api/tags?sectionSlug=${slugPrefix}-otra`)
    expect(other.data.map(tag => tag.id).sort()).toEqual([tags.compartida, tags.otra].sort())
    const empty = await api(`/api/tags?sectionSlug=${slugPrefix}-vacia`)
    expect(empty.status).toBe(200)
    expect(empty.data).toEqual([])
    expect((await api('/api/tags?sectionSlug=No%20válido')).status).toBe(422)
  })

  it('conserva el catálogo general sin sección y sus vistas por rol', async () => {
    const publicTags = await api<Array<{ id: number, isActive?: boolean }>>('/api/tags')
    const adminTags = await api<Array<{ id: number, isActive: boolean }>>('/api/tags', { cookie: adminCookie })
    expect(publicTags.status).toBe(200)
    expect(adminTags.status).toBe(200)
    expect(publicTags.data.some(tag => tag.id === tags['sin-uso'])).toBe(true)
    expect(publicTags.data.some(tag => tag.id === tags.inactiva)).toBe(false)
    expect(publicTags.data.find(tag => tag.id === tags.abierta)).not.toHaveProperty('isActive')
    expect(adminTags.data.find(tag => tag.id === tags.inactiva)?.isActive).toBe(false)
  })

  it('combina sección y categoría con cualquiera de las etiquetas seleccionadas', async () => {
    const result = await list({
      sectionSlug: `${slugPrefix}-principal`,
      categoryIds: String(categoryId),
      tagIds: `${tags.abierta},${tags.cerrada},${tags.otra}`
    })
    expect(result).toEqual([slugs.openFeatured, slugs.closedFeatured])
  })

  it('pagina de a cuatro sin solapamientos y conserva una última página parcial', async () => {
    const all = await list()
    const pages: string[][] = []
    for (const page of [1, 2, 3]) pages.push(await list({ perPage: '4', page: String(page) }))
    expect(pages.map(page => page.length)).toEqual([4, 4, 2])
    expect(pages.flat()).toEqual(all)
    expect(new Set(pages.flat()).size).toBe(all.length)
    expect(await list({ perPage: '4', page: '4' })).toEqual([])
  })
})
