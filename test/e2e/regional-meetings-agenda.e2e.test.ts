import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login } from './http'

const ADMIN_EMAIL = 'admin@consultas.local'
const DEV_PASSWORD = 'Cambiar1234'

const DAY = 24 * 60 * 60 * 1000

interface AgendaItem {
  id: number
  location: string
  heldAt: string
  year: number
  registrationUrl: string | null
  registrationState: 'scheduled' | 'open' | 'closed' | null
  region: { slug: string } | null
  consultation: { id: number, title: string, publicPath: string, participationState: string }
}

interface AgendaResponse {
  year: number
  years: number[]
  items: AgendaItem[]
}

interface MeetingInput {
  location: string
  heldAt: string
  registrationUrl: string | null
  registrationOpensAt: string | null
  registrationClosesAt: string | null
}

describe('Server e2e: agenda de Encuentros Regionales', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let regionalSectionId: number
  let regionId: number

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const slugPrefix = `agenda-e2e-${runId}`
  // Año lejano para no chocar con datos de otros tests ni seeds.
  const testYear = 2091
  const createdConsultationIds: number[] = []
  let visibleId: number
  let hiddenId: number
  let otherYearId: number
  let openId: number
  let futureWindowId: number

  function meetingIn(year: number, overrides: Partial<MeetingInput> = {}): MeetingInput {
    return {
      location: 'Junín',
      heldAt: new Date(Date.UTC(year, 5, 15, 15)).toISOString(),
      registrationUrl: null,
      registrationOpensAt: null,
      registrationClosesAt: null,
      ...overrides
    }
  }

  function createRegional(suffix: string, regionalMeeting: MeetingInput | null, extra: Record<string, unknown> = {}) {
    return api<{ id: number, regionalMeeting: (MeetingInput & { registrationState: string | null }) | null }>('/api/consultations', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        slug: `${slugPrefix}-${suffix}`,
        title: `Agenda e2e ${suffix}`,
        sectionId: regionalSectionId,
        summary: null,
        body: null,
        startsAt: new Date().toISOString(),
        endsAt: null,
        closedMessage: null,
        regionId,
        regionalMeeting,
        ...extra
      }
    }).then((res) => {
      if (res.status === 201) createdConsultationIds.push(res.data.id)
      return res
    })
  }

  async function publish(id: number) {
    await prisma.consultation.update({ where: { id }, data: { visibility: 'visible' } })
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login(ADMIN_EMAIL, DEV_PASSWORD)

    const section = await prisma.section.findUniqueOrThrow({
      where: { slug: 'encuentros-regionales' },
      select: { id: true }
    })
    regionalSectionId = section.id

    const region = await prisma.region.findFirstOrThrow({ select: { id: true } })
    regionId = region.id

    // Datos de la agenda pública (los beforeAll anidados pierden el contexto de test-utils).
    const visible = await createRegional('visible', meetingIn(testYear))
    visibleId = visible.data.id
    await publish(visibleId)

    const hidden = await createRegional('oculta', meetingIn(testYear))
    hiddenId = hidden.data.id

    const otherYear = await createRegional('otro-anio', meetingIn(testYear + 1))
    otherYearId = otherYear.data.id
    await publish(otherYearId)

    const now = Date.now()
    const open = await createRegional('inscripcion-abierta', meetingIn(testYear, {
      registrationUrl: 'https://forms.gle/abierta',
      registrationOpensAt: new Date(now - DAY).toISOString(),
      registrationClosesAt: new Date(now + DAY).toISOString()
    }))
    openId = open.data.id
    await publish(openId)

    const future = await createRegional('inscripcion-futura', meetingIn(testYear, {
      registrationUrl: 'https://forms.gle/futura',
      registrationOpensAt: new Date(now + DAY).toISOString(),
      registrationClosesAt: new Date(now + 2 * DAY).toISOString()
    }))
    futureWindowId = future.data.id
    await publish(futureWindowId)
  })

  afterAll(async () => {
    if (createdConsultationIds.length > 0) {
      await prisma.consultation.deleteMany({ where: { id: { in: createdConsultationIds } } })
    }
    await prisma.$disconnect()
  })

  describe('Validación del encuentro', () => {
    it('exige lugar y fecha', async () => {
      const res = await createRegional('sin-lugar', meetingIn(testYear, { location: '' }))
      expect(res.status).toBe(422)
    })

    it('exige la ventana de inscripción si hay URL', async () => {
      const res = await createRegional('url-sin-ventana', meetingIn(testYear, { registrationUrl: 'https://forms.gle/x' }))
      expect(res.status).toBe(422)
    })

    it('rechaza una ventana con cierre anterior a la apertura', async () => {
      const res = await createRegional('ventana-invertida', meetingIn(testYear, {
        registrationUrl: 'https://forms.gle/x',
        registrationOpensAt: new Date(Date.UTC(testYear, 4, 10)).toISOString(),
        registrationClosesAt: new Date(Date.UTC(testYear, 4, 1)).toISOString()
      }))
      expect(res.status).toBe(422)
    })

    it('descarta la ventana si no hay URL', async () => {
      const res = await createRegional('ventana-sin-url', meetingIn(testYear, {
        registrationOpensAt: new Date(Date.UTC(testYear, 4, 1)).toISOString(),
        registrationClosesAt: new Date(Date.UTC(testYear, 4, 10)).toISOString()
      }))
      expect(res.status).toBe(201)
      expect(res.data.regionalMeeting?.registrationOpensAt).toBeNull()
      expect(res.data.regionalMeeting?.registrationClosesAt).toBeNull()
    })
  })

  describe('Edición', () => {
    it('actualiza el encuentro al editar la consulta', async () => {
      const created = await createRegional('editar', meetingIn(testYear))
      expect(created.status).toBe(201)

      const res = await api<{ regionalMeeting: MeetingInput | null }>(`/api/consultations/${created.data.id}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: {
          slug: `${slugPrefix}-editar`,
          title: 'Agenda e2e editar',
          summary: null,
          body: null,
          startsAt: new Date().toISOString(),
          endsAt: null,
          closedMessage: null,
          consultationFormat: 'multiple',
          resultsVisibility: 'public',
          regionId,
          regionalMeeting: meetingIn(testYear, { location: 'Pergamino' })
        }
      })

      expect(res.status).toBe(200)
      expect(res.data.regionalMeeting?.location).toBe('Pergamino')
      const stored = await prisma.regionalMeetingAgendaItem.count({ where: { consultationId: created.data.id } })
      expect(stored).toBe(1)
    })

    it('exige el encuentro al editar', async () => {
      const created = await createRegional('editar-sin-encuentro', meetingIn(testYear))
      expect(created.status).toBe(201)

      const res = await api(`/api/consultations/${created.data.id}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: {
          slug: `${slugPrefix}-editar-sin-encuentro`,
          title: 'Agenda e2e editar sin encuentro',
          summary: null,
          body: null,
          startsAt: new Date().toISOString(),
          endsAt: null,
          closedMessage: null,
          consultationFormat: 'multiple',
          resultsVisibility: 'public',
          regionId: null,
          regionalMeeting: null
        }
      })

      expect(res.status).toBe(422)
    })
  })

  describe('Agenda pública', () => {
    it('filtra por año y lista los años con encuentros', async () => {
      const res = await api<AgendaResponse>(`/api/regional-meetings/agenda?year=${testYear}`)
      expect(res.status).toBe(200)
      expect(res.data.year).toBe(testYear)

      const ids = res.data.items.map(item => item.consultation.id)
      expect(ids).toContain(visibleId)
      expect(ids).not.toContain(otherYearId)
      expect(res.data.years).toEqual(expect.arrayContaining([testYear, testYear + 1, new Date().getFullYear()]))
      expect(res.data.years).toEqual([...res.data.years].sort((a, b) => b - a))

      const next = await api<AgendaResponse>(`/api/regional-meetings/agenda?year=${testYear + 1}`)
      expect(next.data.items.map(item => item.consultation.id)).toContain(otherYearId)
    })

    it('excluye las consultas ocultas en la vista pública', async () => {
      const res = await api<AgendaResponse>(`/api/regional-meetings/agenda?year=${testYear}`)
      expect(res.data.items.map(item => item.consultation.id)).not.toContain(hiddenId)
    })

    it('incluye las ocultas para administradores', async () => {
      const res = await api<AgendaResponse>(`/api/regional-meetings/agenda?year=${testYear}`, { cookie: adminCookie })
      expect(res.data.items.map(item => item.consultation.id)).toContain(hiddenId)
    })

    it('expone la URL de inscripción solo con la ventana abierta', async () => {
      const res = await api<AgendaResponse>(`/api/regional-meetings/agenda?year=${testYear}`)
      const open = res.data.items.find(item => item.consultation.id === openId)
      const future = res.data.items.find(item => item.consultation.id === futureWindowId)

      expect(open?.registrationState).toBe('open')
      expect(open?.registrationUrl).toBe('https://forms.gle/abierta')
      expect(future?.registrationState).toBe('scheduled')
      expect(future?.registrationUrl).toBeNull()
    })
  })
})
