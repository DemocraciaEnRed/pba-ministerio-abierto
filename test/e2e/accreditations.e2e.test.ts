import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const DAY_MS = 24 * 60 * 60 * 1000

interface AccreditationDTO {
  id: number
  publicId: string
  enabled: boolean
  state: 'disabled' | 'scheduled' | 'open' | 'closed'
  entriesCount: number
}

interface FormDTO {
  id: number
  accreditation: AccreditationDTO | null
}

describe('Server e2e: acreditaciones', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const hearingSlug = `acreditacion-e2e-audiencia-${runId}`
  const publicSlug = `acreditacion-e2e-consulta-${runId}`

  const createdConsultationIds: number[] = []

  async function createConsultation(slug: string, sectionSlug: string) {
    const section = await prisma.section.findUniqueOrThrow({
      where: { slug: sectionSlug },
      select: { id: true }
    })

    const res = await api<{ id: number }>('/api/consultations', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        slug,
        title: `Acreditación e2e ${slug}`,
        sectionId: section.id,
        summary: null,
        body: null,
        startsAt: new Date().toISOString(),
        endsAt: null,
        closedMessage: null
      }
    })

    if (res.status !== 201) {
      throw new Error(`No se pudo crear la consulta ${slug}: ${res.status} ${JSON.stringify(res.data)}`)
    }

    createdConsultationIds.push(res.data.id)
    return res.data.id
  }

  function formBody(overrides: Record<string, unknown> = {}) {
    const now = Date.now()
    return {
      title: 'Audiencia con acreditación e2e',
      eventAt: new Date(now + 30 * DAY_MS).toISOString(),
      opensAt: new Date(now - DAY_MS).toISOString(),
      closesAt: new Date(now + 10 * DAY_MS).toISOString(),
      venueName: 'Salón de actos',
      venueAddress: 'Calle 7 1234',
      venueCity: 'La Plata',
      venueProvince: 'Buenos Aires',
      accreditationEnabled: true,
      accreditationOpensAt: new Date(now - DAY_MS).toISOString(),
      accreditationClosesAt: new Date(now + 10 * DAY_MS).toISOString(),
      ...overrides
    }
  }

  async function postEntry(publicId: string, body: Record<string, unknown>) {
    return api(`/api/accreditations/${publicId}/entries`, { method: 'POST', body })
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    await createConsultation(hearingSlug, 'audiencias-publicas')
    await createConsultation(publicSlug, 'consultas-publicas')
  })

  afterAll(async () => {
    if (createdConsultationIds.length > 0) {
      await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    }
    await prisma.$disconnect()
  })

  let publicId = ''

  describe('Configuración desde el formulario', () => {
    it('rechaza habilitar sin fechas de acreditación (422)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody({ accreditationOpensAt: null, accreditationClosesAt: null })
      })
      expect(res.status).toBe(422)
    })

    it('rechaza una ventana de acreditación invertida (422)', async () => {
      const now = Date.now()
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody({
          accreditationOpensAt: new Date(now + 5 * DAY_MS).toISOString(),
          accreditationClosesAt: new Date(now + DAY_MS).toISOString()
        })
      })
      expect(res.status).toBe(422)
    })

    it('crea el formulario con acreditación habilitada y token público', async () => {
      const res = await api<FormDTO>(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody()
      })

      expect(res.status).toBe(201)
      expect(res.data.accreditation).not.toBeNull()
      expect(res.data.accreditation!.enabled).toBe(true)
      expect(res.data.accreditation!.state).toBe('open')
      expect(res.data.accreditation!.publicId).toMatch(/^[a-z0-9]{8}$/)

      publicId = res.data.accreditation!.publicId
    })
  })

  describe('Ingreso público', () => {
    it('resuelve la acreditación por su identificador público', async () => {
      const res = await api<{ publicId: string, state: string }>(`/api/accreditations/${publicId}`)
      expect(res.status).toBe(200)
      expect(res.data.state).toBe('open')
    })

    it('devuelve 404 ante un identificador desconocido', async () => {
      const res = await api(`/api/accreditations/zzzzzzzz`)
      expect(res.status).toBe(404)
    })

    it('acepta un ingreso con DNI y admite duplicados', async () => {
      const first = await postEntry(publicId, { dni: '40111222' })
      expect(first.status).toBe(201)
      expect((first.data as { linkedToRegistration: boolean }).linkedToRegistration).toBe(false)

      const second = await postEntry(publicId, { dni: '40111222' })
      expect(second.status).toBe(201)

      const count = await prisma.accreditationEntry.count({
        where: { accreditation: { publicId }, dni: '40111222' }
      })
      expect(count).toBe(2)
    })

    it('permite completar datos después de acreditarse', async () => {
      const created = await postEntry(publicId, { dni: '41222333' })
      expect(created.status).toBe(201)
      const id = (created.data as { id: number }).id
      expect(id).toBeGreaterThan(0)

      const patched = await api(`/api/accreditations/${publicId}/entries/${id}`, {
        method: 'PATCH',
        body: { firstName: 'Carla', lastName: 'Ruiz', email: 'CARLA@EXAMPLE.COM' }
      })
      expect(patched.status).toBe(200)

      const entry = await prisma.accreditationEntry.findUniqueOrThrow({ where: { id } })
      expect(entry.firstName).toBe('Carla')
      expect(entry.lastName).toBe('Ruiz')
      expect(entry.email).toBe('carla@example.com')
    })

    it('vincula el ingreso a una inscripción cuando el DNI coincide', async () => {
      const linkedDni = '35998877'

      const form = await prisma.consultationRegistrationForm.findFirstOrThrow({
        where: { consultation: { slug: hearingSlug } },
        select: { id: true }
      })
      await prisma.consultationRegistration.create({
        data: {
          formId: form.id,
          firstName: 'Lucía',
          lastName: 'Gómez',
          dni: linkedDni,
          email: 'lucia@example.com',
          phone: '+541112345678',
          character: 'individual'
        }
      })

      const res = await postEntry(publicId, { dni: linkedDni })
      expect(res.status).toBe(201)
      expect((res.data as { linkedToRegistration: boolean }).linkedToRegistration).toBe(true)

      const entry = await prisma.accreditationEntry.findFirstOrThrow({
        where: { accreditation: { publicId }, dni: linkedDni }
      })
      expect(entry.registrationId).not.toBeNull()
      expect(entry.firstName).toBe('Lucía')
      expect(entry.lastName).toBe('Gómez')
      expect(entry.email).toBe('lucia@example.com')
    })
  })

  describe('Administración de ingresos', () => {
    it('lista los ingresos para quien administra', async () => {
      const res = await api<{ pagination: { total: number } }>(
        `/api/consultations/${hearingSlug}/accreditation/entries`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data.pagination.total).toBe(4)
    })

    it('rechaza el listado a la ciudadanía (403)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/accreditation/entries`, { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('exporta los ingresos a CSV para quien administra', async () => {
      const res = await api<string>(
        `/api/consultations/${hearingSlug}/accreditation/entries/export`,
        { cookie: adminCookie }
      )
      expect(res.status).toBe(200)
      expect(res.data).toContain('DNI')
      expect(res.data).toContain('40111222')
    })

    it('rechaza la exportación a la ciudadanía (403)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/accreditation/entries/export`, { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('permite el alta manual (201)', async () => {
      const res = await api<{ id: number }>(
        `/api/consultations/${hearingSlug}/accreditation/entries`,
        { method: 'POST', cookie: adminCookie, body: { dni: '99887766', firstName: 'Manual' } }
      )
      expect(res.status).toBe(201)

      const del = await api(`/api/accreditation-entries/${res.data.id}`, {
        method: 'DELETE',
        cookie: adminCookie
      })
      expect(del.status).toBe(204)
    })
  })

  describe('Ventana e histórico', () => {
    it('bloquea el ingreso público fuera de la ventana (422)', async () => {
      const now = Date.now()
      const patched = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody({
          accreditationOpensAt: new Date(now - 10 * DAY_MS).toISOString(),
          accreditationClosesAt: new Date(now - DAY_MS).toISOString()
        })
      })
      expect(patched.status).toBe(200)

      const res = await postEntry(publicId, { dni: '40111222' })
      expect(res.status).toBe(422)

      // Reabrimos para el resto de la suite.
      await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody()
      })
    })

    it('conserva la acreditación como histórica al deshabilitar con ingresos', async () => {
      const patched = await api<FormDTO>(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody({ accreditationEnabled: false })
      })
      expect(patched.status).toBe(200)
      expect(patched.data.accreditation).not.toBeNull()
      expect(patched.data.accreditation!.enabled).toBe(false)

      // El QR público deja de estar disponible.
      const publicRes = await api(`/api/accreditations/${publicId}`)
      expect(publicRes.status).toBe(404)
    })

    it('reutiliza el mismo token y el historial al reactivar', async () => {
      const patched = await api<FormDTO>(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody()
      })
      expect(patched.status).toBe(200)
      expect(patched.data.accreditation!.publicId).toBe(publicId)
      expect(patched.data.accreditation!.entriesCount).toBeGreaterThan(0)
    })

    it('elimina la acreditación al deshabilitar sin ingresos', async () => {
      const created = await api<FormDTO>(`/api/consultations/${publicSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody({ title: 'Consulta con acreditación e2e' })
      })
      expect(created.status).toBe(201)
      expect(created.data.accreditation).not.toBeNull()

      const disabled = await api<FormDTO>(`/api/consultations/${publicSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody({ title: 'Consulta con acreditación e2e', accreditationEnabled: false })
      })
      expect(disabled.status).toBe(200)
      expect(disabled.data.accreditation).toBeNull()
    })
  })
})
