import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

interface ConsultationDTO {
  id: number
  slug: string
  publicPath: string
  title: string
}

/** GET sin seguir redirecciones: devuelve status y `location` relativa. */
async function head(path: string, cookie?: string): Promise<{ status: number, location: string | null }> {
  const res = await fetch(url(path), {
    redirect: 'manual',
    headers: cookie ? { cookie } : {}
  })
  await res.body?.cancel()
  const location = res.headers.get('location')
  return { status: res.status, location: location ? location.replace(/^https?:\/\/[^/]+/, '') : null }
}

describe('Server e2e: direcciones web de consultas', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let sectionId: number

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const title = `Dirección e2e ${runId}`
  const createdConsultationIds: number[] = []

  async function createConsultation(body: Record<string, unknown> = {}) {
    const res = await api<ConsultationDTO>('/api/consultations', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        title,
        sectionId,
        summary: null,
        body: null,
        startsAt: new Date().toISOString(),
        endsAt: null,
        closedMessage: null,
        ...body
      }
    })
    if (res.status !== 201) {
      throw new Error(`No se pudo crear la consulta: ${res.status} ${JSON.stringify(res.data)}`)
    }
    createdConsultationIds.push(res.data.id)
    // Se crean ocultas: las publicamos para probar el acceso anónimo.
    await prisma.consultation.update({ where: { id: res.data.id }, data: { visibility: 'visible' } })
    return res.data
  }

  let consultation: ConsultationDTO
  const legacySlug = `direccion-anterior-e2e-${runId}`

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)
    const section = await prisma.section.findUniqueOrThrow({
      where: { slug: 'consultas-publicas' },
      select: { id: true }
    })
    sectionId = section.id

    consultation = await createConsultation({ slug: `vigente-${runId}` })
    await prisma.consultationLegacySlug.create({
      data: { slug: legacySlug, consultationId: consultation.id }
    })
  })

  afterAll(async () => {
    if (createdConsultationIds.length > 0) {
      await prisma.consultationLegacySlug.deleteMany({ where: { consultationId: { in: createdConsultationIds } } })
      await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    }
    await prisma.$disconnect()
  })

  describe('Alta y edición', () => {
    it('genera la dirección desde el título si no se envía', async () => {
      const created = await createConsultation()
      expect(created.slug).toBe(`direccion-e2e-${runId}`)
      expect(created.publicPath).toBe(`/consultas-publicas/${created.id}/${created.slug}`)
    })

    it('permite dos consultas con el mismo nombre de dirección', async () => {
      const first = await createConsultation({ slug: `repetida-${runId}` })
      const second = await createConsultation({ slug: `repetida-${runId}` })
      expect(first.slug).toBe(second.slug)
      expect(first.publicPath).not.toBe(second.publicPath)
    })

    it('rechaza una dirección personalizada inválida (422)', async () => {
      const res = await api('/api/consultations', {
        method: 'POST',
        cookie: adminCookie,
        body: { title, sectionId, slug: 'Con Espacios' }
      })
      expect(res.status).toBe(422)
    })

    it('cambiar el título sin enviar dirección la conserva', async () => {
      const created = await createConsultation()
      const res = await api<ConsultationDTO>(`/api/consultations/${created.id}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: {
          title: `Otro título ${runId}`,
          summary: null,
          body: null,
          consultationFormat: 'multiple',
          startsAt: new Date().toISOString(),
          endsAt: null,
          closedMessage: null,
          resultsVisibility: 'public'
        }
      })
      expect(res.status).toBe(200)
      expect(res.data.slug).toBe(created.slug)
      expect(res.data.publicPath).toBe(created.publicPath)
    })
  })

  describe('API por id', () => {
    it('resuelve por id y no por nombre (404)', async () => {
      const created = await createConsultation()
      expect((await api(`/api/consultations/${created.id}`)).status).toBe(200)
      expect((await api(`/api/consultations/${created.slug}`)).status).toBe(404)
    })
  })

  describe('Redirecciones', () => {
    it('la dirección canónica responde 200', async () => {
      const res = await head(consultation.publicPath)
      expect(res.status).toBe(200)
    })

    it('el enlace corto redirige (301) a la canónica conservando la query', async () => {
      const res = await head(`/consultas/${consultation.id}?utm_source=prensa`)
      expect(res.status).toBe(301)
      expect(res.location).toBe(`${consultation.publicPath}?utm_source=prensa`)
    })

    it('un nombre o una sección desactualizados redirigen (301) a la canónica', async () => {
      const wrongName = await head(`/consultas-publicas/${consultation.id}/nombre-viejo`)
      expect(wrongName.status).toBe(301)
      expect(wrongName.location).toBe(consultation.publicPath)

      const wrongSection = await head(`/dialogos/${consultation.id}/${consultation.slug}`)
      expect(wrongSection.status).toBe(301)
      expect(wrongSection.location).toBe(consultation.publicPath)
    })

    it('la dirección anterior redirige (301), también con subrutas y panel', async () => {
      const root = await head(`/consultas/${legacySlug}`)
      expect(root.status).toBe(301)
      expect(root.location).toBe(consultation.publicPath)

      const registration = await head(`/consultas/${legacySlug}/inscripcion`)
      expect(registration.status).toBe(301)
      expect(registration.location).toBe(`${consultation.publicPath}/inscripcion`)

      const panel = await head(`/consultas/${legacySlug}/panel/editar`)
      expect(panel.status).toBe(301)
      expect(panel.location).toBe(`/consultas/${consultation.id}/panel/editar`)
    })

    it('una dirección inexistente da 404', async () => {
      expect((await head(`/consultas/no-existe-${runId}`)).status).toBe(404)
      expect((await head('/consultas-publicas/999999999/algo')).status).toBe(404)
    })

    it('una consulta oculta solo redirige a quien puede gestionarla', async () => {
      await prisma.consultation.update({ where: { id: consultation.id }, data: { visibility: 'hidden' } })
      try {
        expect((await head(`/consultas/${legacySlug}`)).status).toBe(404)
        expect((await head(`/consultas/${consultation.id}`)).status).toBe(404)

        const asAdmin = await head(`/consultas/${legacySlug}`, adminCookie)
        expect(asAdmin.status).toBe(301)
        expect(asAdmin.location).toBe(consultation.publicPath)
      } finally {
        await prisma.consultation.update({ where: { id: consultation.id }, data: { visibility: 'visible' } })
      }
    })
  })
})
