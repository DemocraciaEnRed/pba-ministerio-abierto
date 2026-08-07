import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

describe('Server e2e: tipos de consulta', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const slugPrefix = `tipo-e2e-${runId}`

  let regionalSectionId: number
  let dialogosSectionId: number
  let regionId: number
  let dialogosCategoryId: number
  let regionalCategoryId: number

  const createdConsultationIds: number[] = []
  const createdCategoryIds: number[] = []

  async function createConsultation(slug: string, sectionId: number | undefined) {
    const res = await api<{ id: number }>('/api/consultations', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        slug,
        title: `Tipo e2e ${slug}`,
        sectionId,
        summary: null,
        body: null,
        startsAt: new Date().toISOString(),
        endsAt: null,
        closedMessage: null
      }
    })

    if (res.status === 201) {
      createdConsultationIds.push(res.data.id)
    }

    return res
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)

    const regionalSection = await prisma.section.findUniqueOrThrow({
      where: { slug: 'encuentros-regionales' },
      select: { id: true }
    })
    regionalSectionId = regionalSection.id

    const dialogosSection = await prisma.section.findUniqueOrThrow({
      where: { slug: 'dialogos' },
      select: { id: true }
    })
    dialogosSectionId = dialogosSection.id

    const region = await prisma.region.findFirstOrThrow({ select: { id: true } })
    regionId = region.id

    const dialogosCategory = await prisma.category.create({
      data: { sectionId: dialogosSectionId, slug: `${slugPrefix}-dialogos`, name: 'Eje diálogos e2e' }
    })
    dialogosCategoryId = dialogosCategory.id
    createdCategoryIds.push(dialogosCategory.id)

    const regionalCategory = await prisma.category.create({
      data: { sectionId: regionalSectionId, slug: `${slugPrefix}-regional`, name: 'Eje regional e2e' }
    })
    regionalCategoryId = regionalCategory.id
    createdCategoryIds.push(regionalCategory.id)
  })

  afterAll(async () => {
    if (createdConsultationIds.length > 0) {
      await prisma.consultationCategoryAssignment.deleteMany({
        where: { consultationId: { in: createdConsultationIds } }
      })
      await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    }
    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } })
    }
    await prisma.$disconnect()
  })

  describe('El tipo es obligatorio al crear', () => {
    it('rechaza el alta sin tipo de consulta', async () => {
      const res = await createConsultation(`${slugPrefix}-sin-tipo`, undefined)
      expect(res.status).toBe(422)
    })

    it('rechaza el alta con un tipo inexistente', async () => {
      const res = await createConsultation(`${slugPrefix}-tipo-invalido`, 999999)
      expect(res.status).toBe(422)
    })

    it('crea la consulta con el tipo asignado', async () => {
      const res = await api<{ id: number, section: { slug: string } | null }>('/api/consultations', {
        method: 'POST',
        cookie: adminCookie,
        body: {
          slug: `${slugPrefix}-ok`,
          title: 'Tipo e2e ok',
          sectionId: dialogosSectionId,
          summary: null,
          body: null,
          startsAt: new Date().toISOString(),
          endsAt: null,
          closedMessage: null
        }
      })

      expect(res.status).toBe(201)
      createdConsultationIds.push(res.data.id)
      expect(res.data.section?.slug).toBe('dialogos')
    })
  })

  describe('El tipo es inmutable', () => {
    it('ya no expone el endpoint de asignación de sección', async () => {
      const created = await createConsultation(`${slugPrefix}-inmutable`, dialogosSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/section`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { sectionId: regionalSectionId }
      })

      expect(res.status).toBe(404)
    })
  })

  describe('La región depende del tipo', () => {
    it('rechaza asignar región a un tipo que no la admite', async () => {
      const created = await createConsultation(`${slugPrefix}-sin-region`, dialogosSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/region`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { regionId }
      })

      expect(res.status).toBe(422)
    })

    it('permite asignar región en encuentros regionales', async () => {
      const created = await createConsultation(`${slugPrefix}-con-region`, regionalSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/region`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { regionId }
      })

      expect(res.status).toBe(200)
    })

    it('permite limpiar la región aunque el tipo no la admita', async () => {
      const created = await createConsultation(`${slugPrefix}-limpiar-region`, dialogosSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/region`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { regionId: null }
      })

      expect(res.status).toBe(200)
    })
  })

  describe('Los ejes de gestión pertenecen al tipo', () => {
    it('rechaza ejes de otro tipo de consulta', async () => {
      const created = await createConsultation(`${slugPrefix}-eje-ajeno`, dialogosSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/categories`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { categories: [{ categoryId: regionalCategoryId, isPrimary: true, displayOrder: 0 }] }
      })

      expect(res.status).toBe(422)
    })

    it('acepta ejes del propio tipo', async () => {
      const created = await createConsultation(`${slugPrefix}-eje-propio`, dialogosSectionId)
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}/categories`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { categories: [{ categoryId: dialogosCategoryId, isPrimary: true, displayOrder: 0 }] }
      })

      expect(res.status).toBe(200)
    })
  })

  describe('El catálogo de tipos no tiene alta ni baja', () => {
    it('no expone la creación de secciones', async () => {
      const res = await api('/api/sections', {
        method: 'POST',
        cookie: adminCookie,
        body: { slug: `${slugPrefix}-nueva`, name: 'Nueva', description: null }
      })

      expect(res.status).toBe(404)
    })

    it('no expone la eliminación de secciones', async () => {
      const res = await api(`/api/sections/${dialogosSectionId}`, {
        method: 'DELETE',
        cookie: adminCookie
      })

      expect(res.status).toBe(404)
    })

    it('ignora el slug enviado al editar', async () => {
      const res = await api<{ slug: string, name: string }>(`/api/sections/${dialogosSectionId}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { slug: 'otro-slug', name: 'Obras y proyectos en diálogo', description: null }
      })

      expect(res.status).toBe(200)
      expect(res.data.slug).toBe('dialogos')
    })
  })
})
