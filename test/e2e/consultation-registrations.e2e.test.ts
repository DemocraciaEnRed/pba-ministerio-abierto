import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const CITIZEN_EMAIL = 'ciudadania@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const DAY_MS = 24 * 60 * 60 * 1000

interface RegistrationFormDTO {
  id: number
  title: string
  registrationState: 'scheduled' | 'open' | 'closed'
  registrationsCount?: number
}

interface RegistrationPayload {
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  character: 'individual' | 'legal_entity'
  participationMode?: 'attendee' | 'speaker_request' | 'speaker_report'
  entityName?: string
  entityAddress?: string
  entityEmail?: string
  entityPhone?: string
  proofUrl?: string
  presentationSummary?: string
  documentationDetail?: string
  questions?: string[]
  website?: string
}

function buildPayload(overrides: Partial<RegistrationPayload> = {}): RegistrationPayload {
  return {
    firstName: 'Ana',
    lastName: 'Pérez',
    dni: '30111222',
    email: 'ana.perez@example.com',
    phone: '11 12345678',
    character: 'individual',
    participationMode: 'attendee',
    ...overrides
  }
}

/** POST público multipart de una inscripción (`payload` JSON + `file` opcional). */
async function postRegistration(
  slug: string,
  payload: RegistrationPayload,
  options: { cookie?: string } = {}
): Promise<{ status: number, data: unknown }> {
  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))

  const res = await fetch(url(`/api/consultations/${slug}/registrations`), {
    method: 'POST',
    headers: options.cookie ? { cookie: options.cookie } : {},
    body: formData
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  return { status: res.status, data }
}

describe('Server e2e: formulario de inscripción', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const hearingSlug = `inscripcion-e2e-audiencia-${runId}`
  const publicSlug = `inscripcion-e2e-consulta-${runId}`
  const dialogosSlug = `inscripcion-e2e-dialogos-${runId}`

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
        title: `Inscripción e2e ${slug}`,
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
      title: 'Audiencia pública e2e',
      eventAt: new Date(now + 30 * DAY_MS).toISOString(),
      opensAt: new Date(now - DAY_MS).toISOString(),
      closesAt: new Date(now + 10 * DAY_MS).toISOString(),
      venueName: 'Salón de actos',
      venueAddress: 'Calle 7 1234',
      venueCity: 'La Plata',
      venueProvince: 'Buenos Aires',
      ...overrides
    }
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    citizenCookie = await login(CITIZEN_EMAIL, DEV_PASSWORD)

    await createConsultation(hearingSlug, 'audiencias-publicas')
    await createConsultation(publicSlug, 'consultas-publicas')
    await createConsultation(dialogosSlug, 'dialogos')
  })

  afterAll(async () => {
    if (createdConsultationIds.length > 0) {
      await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    }
    await prisma.$disconnect()
  })

  describe('Alta del formulario', () => {
    it('rechaza el alta en un tipo de consulta que no admite inscripción (422)', async () => {
      const res = await api(`/api/consultations/${dialogosSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody()
      })

      expect(res.status).toBe(422)
    })

    it('rechaza el alta a la ciudadanía (403)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: citizenCookie,
        body: formBody()
      })

      expect(res.status).toBe(403)
    })

    it('rechaza una ventana de inscripción invertida (422)', async () => {
      const now = Date.now()
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody({
          opensAt: new Date(now + 10 * DAY_MS).toISOString(),
          closesAt: new Date(now + DAY_MS).toISOString()
        })
      })

      expect(res.status).toBe(422)
    })

    it('crea el formulario y lo expone como abierto', async () => {
      const res = await api<RegistrationFormDTO>(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody()
      })

      expect(res.status).toBe(201)
      expect(res.data.registrationState).toBe('open')
    })

    it('rechaza crear un segundo formulario (409)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'POST',
        cookie: adminCookie,
        body: formBody()
      })

      expect(res.status).toBe(409)
    })

    it('devuelve 404 cuando la consulta no tiene formulario', async () => {
      const res = await api(`/api/consultations/${publicSlug}/registration-form`, { cookie: adminCookie })
      expect(res.status).toBe(404)
    })
  })

  describe('Inscripción pública', () => {
    it('acepta una inscripción anónima dentro de la ventana (201)', async () => {
      const res = await postRegistration(hearingSlug, buildPayload())
      expect(res.status).toBe(201)
    })

    it('rechaza una audiencia sin forma de participación (422)', async () => {
      const res = await postRegistration(
        hearingSlug,
        buildPayload({ participationMode: undefined, email: 'sin-modo@example.com' })
      )

      expect(res.status).toBe(422)
    })

    it('exige el instrumento de personería a las personas jurídicas (422)', async () => {
      const res = await postRegistration(
        hearingSlug,
        buildPayload({
          email: 'juridica@example.com',
          character: 'legal_entity',
          entityName: 'Fundación e2e',
          entityAddress: 'Calle falsa 123',
          entityEmail: 'contacto@example.com',
          entityPhone: '2211234567'
        })
      )

      expect(res.status).toBe(422)
    })

    it('exige exposición y preguntas a quien solicita el uso de la palabra (422)', async () => {
      const res = await postRegistration(
        hearingSlug,
        buildPayload({ email: 'expositor@example.com', participationMode: 'speaker_request' })
      )

      expect(res.status).toBe(422)
    })

    it('descarta el envío del honeypot sin persistir', async () => {
      const before = await prisma.consultationRegistration.count()

      const res = await postRegistration(
        hearingSlug,
        buildPayload({ email: 'bot@example.com', website: 'http://spam.example' })
      )

      expect(res.status).toBe(201)
      expect(await prisma.consultationRegistration.count()).toBe(before)
    })

    it('rechaza inscribirse dos veces con la misma cuenta (409)', async () => {
      const first = await postRegistration(
        hearingSlug,
        buildPayload({ email: 'logueada@example.com' }),
        { cookie: citizenCookie }
      )
      expect(first.status).toBe(201)

      const second = await postRegistration(
        hearingSlug,
        buildPayload({ email: 'logueada@example.com' }),
        { cookie: citizenCookie }
      )
      expect(second.status).toBe(409)
    })

    it('rechaza inscribirse fuera de la ventana (422)', async () => {
      const now = Date.now()
      const closed = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody({
          opensAt: new Date(now - 10 * DAY_MS).toISOString(),
          closesAt: new Date(now - DAY_MS).toISOString()
        })
      })
      expect(closed.status).toBe(200)

      const res = await postRegistration(hearingSlug, buildPayload({ email: 'tarde@example.com' }))
      expect(res.status).toBe(422)

      // Reabrimos la ventana para el resto de la suite.
      await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: formBody()
      })
    })
  })

  describe('Listado y exportación', () => {
    it('lista las inscripciones para quien administra', async () => {
      const res = await api<{ items: unknown[], pagination: { total: number } }>(
        `/api/consultations/${hearingSlug}/registrations`,
        { cookie: adminCookie }
      )

      expect(res.status).toBe(200)
      expect(res.data.pagination.total).toBe(2)
      expect(res.data.items).toHaveLength(2)
    })

    it('rechaza el listado a la ciudadanía (403)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registrations`, { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('rechaza el listado anónimo (401)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registrations`)
      expect(res.status).toBe(401)
    })

    it('exporta el CSV con encabezados y BOM', async () => {
      const res = await fetch(url(`/api/consultations/${hearingSlug}/registrations/export`), {
        headers: { cookie: adminCookie }
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('content-disposition')).toContain(`inscripciones-${hearingSlug}`)

      // `res.text()` descarta el BOM, así que lo verificamos sobre los bytes.
      const bytes = Buffer.from(await res.arrayBuffer())
      expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xEF, 0xBB, 0xBF]))

      const csv = bytes.toString('utf8')
      expect(csv).toContain('"DNI"')
      expect(csv).toContain('"Forma de participación"')
      expect(csv.trim().split('\n')).toHaveLength(3)
    })

    it('rechaza la exportación a la ciudadanía (403)', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registrations/export`, { cookie: citizenCookie })
      expect(res.status).toBe(403)
    })
  })

  describe('Baja de una inscripción', () => {
    async function firstRegistrationId(): Promise<number> {
      const res = await api<{ items: Array<{ id: number }> }>(
        `/api/consultations/${hearingSlug}/registrations`,
        { cookie: adminCookie }
      )
      return res.data.items[0]!.id
    }

    it('rechaza la baja a la ciudadanía (403)', async () => {
      const id = await firstRegistrationId()
      const res = await api(`/api/registrations/${id}`, { method: 'DELETE', cookie: citizenCookie })
      expect(res.status).toBe(403)
    })

    it('devuelve 404 para una inscripción inexistente', async () => {
      const res = await api('/api/registrations/99999999', { method: 'DELETE', cookie: adminCookie })
      expect(res.status).toBe(404)
    })

    it('elimina la inscripción y la saca del listado (204)', async () => {
      const id = await firstRegistrationId()

      const res = await api(`/api/registrations/${id}`, { method: 'DELETE', cookie: adminCookie })
      expect(res.status).toBe(204)

      const list = await api<{ pagination: { total: number } }>(
        `/api/consultations/${hearingSlug}/registrations`,
        { cookie: adminCookie }
      )
      expect(list.data.pagination.total).toBe(1)
    })
  })

  describe('Baja del formulario', () => {
    it('elimina el formulario y sus inscripciones en cascada', async () => {
      const res = await api(`/api/consultations/${hearingSlug}/registration-form`, {
        method: 'DELETE',
        cookie: adminCookie
      })

      expect(res.status).toBe(204)

      const check = await api(`/api/consultations/${hearingSlug}/registration-form`, { cookie: adminCookie })
      expect(check.status).toBe(404)
    })
  })
})
