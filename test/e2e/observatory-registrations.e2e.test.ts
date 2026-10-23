import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { createTestPrisma, type TestPrisma } from './db'
import { api, login, postMultipart } from './http'
import { csvDataLines, runExport } from './exports'
import type { AdminConsultationRegistrationFormDTO } from '../../server/utils/serializers/consultationRegistrationForm'
import type { AdminConsultationRegistrationDTO } from '../../server/utils/serializers/consultationRegistration'
import type { RegistrationConfirmation } from '../../shared/data/consultation-registrations'

interface RegistrationResponse {
  success: boolean
  confirmation?: RegistrationConfirmation
}

describe('Server e2e: inscripciones del Observatorio', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    browser: false
  })

  let prisma: TestPrisma
  let adminCookie: string
  let citizenCookie: string
  let hybridId: number
  let virtualId: number
  let directoryId: number
  let institutionId: number
  let categoryId: number
  let accreditationPublicId: string
  const ids: number[] = []
  const mark = `obs-inscripcion-${Date.now()}`
  const meetingUrl = 'https://example.com/reunion-privada-observatorio'
  const day = 86_400_000

  function formBody(overrides: Record<string, unknown> = {}) {
    return {
      title: 'Reunión de trabajo',
      eventAt: new Date(Date.now() + day).toISOString(),
      opensAt: new Date(Date.now() - day).toISOString(),
      closesAt: new Date(Date.now() + day).toISOString(),
      venueName: 'Sala de reuniones',
      venueAddress: 'Calle 7 123',
      venueCity: 'La Plata',
      venueProvince: 'Buenos Aires',
      ...overrides
    }
  }

  function hybridBody(overrides: Record<string, unknown> = {}) {
    return formBody({
      eventMode: 'hybrid',
      admissionPolicy: 'open',
      meetingUrl,
      accreditationEnabled: true,
      accreditationOpensAt: new Date(Date.now() - day).toISOString(),
      accreditationClosesAt: new Date(Date.now() + day).toISOString(),
      ...overrides
    })
  }

  function registration(overrides: Record<string, unknown> = {}) {
    return {
      firstName: 'Ana',
      lastName: 'Pérez',
      dni: '30111222',
      email: 'ana.obs@example.com',
      phone: '11 12345678',
      institutionSource: 'directory',
      institutionId,
      attendanceMode: 'virtual',
      ...overrides
    }
  }

  function post(id: number, overrides: Record<string, unknown> = {}, cookie?: string) {
    return postMultipart<RegistrationResponse>(`/api/consultations/${id}/registrations`, {
      fields: { payload: JSON.stringify(registration(overrides)) },
      cookie
    })
  }

  async function updateHybrid(overrides: Record<string, unknown> = {}) {
    const response = await api(`/api/consultations/${hybridId}/registration-form`, {
      method: 'PATCH', cookie: adminCookie, body: hybridBody(overrides)
    })
    expect(response.status).toBe(200)
  }

  beforeAll(async () => {
    prisma = createTestPrisma()
    adminCookie = await login('admin@consultas.local', 'Cambiar1234')
    citizenCookie = await login('ciudadania@consultas.local', 'Cambiar1234')
    const category = await prisma.observatoryInstitutionCategory.create({
      data: { slug: mark, name: 'Categoría histórica' }
    })
    categoryId = category.id
    const institution = await prisma.observatoryInstitution.create({
      data: { slug: mark, name: 'Institución histórica', categoryId }
    })
    institutionId = institution.id
    const section = await prisma.section.findUniqueOrThrow({ where: { slug: 'observatorio-obras-servicios' } })
    for (const suffix of ['hybrid', 'virtual', 'directory']) {
      const result = await api<{ id: number }>('/api/consultations', {
        method: 'POST', cookie: adminCookie,
        body: {
          slug: `${mark}-${suffix}`,
          title: `${mark} ${suffix}`,
          sectionId: section.id,
          summary: null,
          body: null,
          startsAt: new Date().toISOString(),
          endsAt: null,
          closedMessage: null
        }
      })
      expect(result.status).toBe(201)
      ids.push(result.data.id)
    }
    ;[hybridId, virtualId, directoryId] = ids as [number, number, number]
    for (const [id, body] of [
      [hybridId, hybridBody()],
      [virtualId, formBody({ eventMode: 'virtual', admissionPolicy: 'open', meetingUrl, venueName: null, venueAddress: null, venueCity: null, venueProvince: null })],
      [directoryId, formBody()]
    ] as const) {
      const response = await api<AdminConsultationRegistrationFormDTO>(`/api/consultations/${id}/registration-form`, {
        method: 'POST', cookie: adminCookie, body
      })
      expect(response.status).toBe(201)
      if (id === hybridId) accreditationPublicId = response.data.accreditation!.publicId
    }
  })

  afterAll(async () => {
    await prisma.consultation.deleteMany({ where: { id: { in: ids } } })
    if (institutionId) await prisma.observatoryInstitution.delete({ where: { id: institutionId } })
    if (categoryId) await prisma.observatoryInstitutionCategory.delete({ where: { id: categoryId } })
    await prisma.$disconnect()
  })

  it('conserva defaults presenciales y solo directorio; impide un segundo formulario', async () => {
    const response = await api<AdminConsultationRegistrationFormDTO>(`/api/consultations/${directoryId}/registration-form`, { cookie: adminCookie })
    expect(response.data.eventMode).toBe('in_person')
    expect(response.data.admissionPolicy).toBe('directory_only')
    expect(response.data.kind).toBe('observatory')
    const duplicate = await api(`/api/consultations/${directoryId}/registration-form`, { method: 'POST', cookie: adminCookie, body: formBody() })
    expect(duplicate.status).toBe(409)
  })

  it('mantiene privados el enlace y el listado de personas', async () => {
    for (const cookie of [undefined, citizenCookie, adminCookie]) {
      const response = await api<Record<string, unknown>>(`/api/consultations/${hybridId}/registration-form?view=public`, { cookie })
      expect(response.status).toBe(200)
      expect(response.data).not.toHaveProperty('meetingUrl')
      expect(JSON.stringify(response.data)).not.toContain(meetingUrl)
    }
    const publicForm = await api<Record<string, unknown>>(`/api/consultations/${hybridId}/registration-form`)
    expect(publicForm.data).not.toHaveProperty('meetingUrl')
    const adminForm = await api<AdminConsultationRegistrationFormDTO>(`/api/consultations/${hybridId}/registration-form`, { cookie: adminCookie })
    expect(adminForm.data.meetingUrl).toBe(meetingUrl)
    expect((await api(`/api/consultations/${hybridId}/registrations`)).status).toBe(401)
    expect((await api(`/api/consultations/${hybridId}/registrations`, { cookie: citizenCookie })).status).toBe(403)
    expect((await api(`/api/consultations/${hybridId}/registration-form`, { method: 'PATCH', cookie: citizenCookie, body: hybridBody() })).status).toBe(403)
  })

  it('no exige lugar para virtual; valida lugar presencial y protocolo del enlace', async () => {
    const virtual = await api<AdminConsultationRegistrationFormDTO>(`/api/consultations/${virtualId}/registration-form`, { cookie: adminCookie })
    expect(virtual.data.venueName).toBeNull()
    for (const overrides of [{ venueName: null }, { meetingUrl: 'javascript:alert(1)' }, { meetingUrl: 'ftp://example.com/reunion' }]) {
      expect((await api(`/api/consultations/${hybridId}/registration-form`, { method: 'PATCH', cookie: adminCookie, body: hybridBody(overrides) })).status).toBe(422)
    }
  })

  it('inscribe instituciones sin personería y devuelve el enlace solo para virtual', async () => {
    const virtual = await post(hybridId, { institutionName: 'Nombre adulterado', character: 'individual' })
    expect(virtual.status).toBe(201)
    expect(virtual.data.confirmation).toMatchObject({ attendanceMode: 'virtual', meetingUrl, emailSent: true })
    const presencial = await post(hybridId, { attendanceMode: 'in_person' })
    expect(presencial.status).toBe(201)
    expect(presencial.data.confirmation?.meetingUrl).toBeNull()
    const saved = await prisma.consultationRegistration.findFirstOrThrow({ where: { form: { consultationId: hybridId } }, orderBy: { id: 'desc' } })
    expect(saved).toMatchObject({ institutionName: 'Institución histórica', institutionCategoryName: 'Categoría histórica', character: 'legal_entity', proofAssetId: null, entityName: null })
  })

  it('admite otra organización y persona física sin guardar datos incompatibles', async () => {
    expect((await post(hybridId, { institutionSource: 'other', institutionName: 'Organización nueva' })).status).toBe(201)
    expect((await post(hybridId, { institutionSource: 'individual', institutionName: 'No guardar', entityName: 'No guardar', character: 'legal_entity' })).status).toBe(201)
    const saved = await prisma.consultationRegistration.findFirstOrThrow({ where: { form: { consultationId: hybridId } }, orderBy: { id: 'desc' } })
    expect(saved).toMatchObject({ institutionSource: 'individual', character: 'individual', institutionId: null, institutionName: null, entityName: null })
  })

  it('exige datos personales, institución válida y una sola modalidad en híbrida', async () => {
    for (const overrides of [
      { dni: '' }, { email: 'incorrecto' }, { phone: '' }, { firstName: '' },
      { institutionId: null }, { institutionId: 99999999 },
      { attendanceMode: null }, { attendanceMode: ['virtual', 'in_person'] },
      { institutionSource: 'other', institutionName: '' }
    ]) {
      expect((await post(hybridId, overrides)).status, JSON.stringify(overrides)).toBe(422)
    }
  })

  it('deriva modalidad única y rechaza una selección incompatible', async () => {
    const response = await post(virtualId, { attendanceMode: undefined, institutionSource: 'individual' })
    expect(response.status).toBe(201)
    expect(response.data.confirmation?.attendanceMode).toBe('virtual')
    expect((await post(virtualId, { attendanceMode: 'in_person' })).status).toBe(422)
    const presencial = await post(directoryId, { attendanceMode: undefined })
    expect(presencial.status).toBe(201)
    expect(presencial.data.confirmation).toMatchObject({ attendanceMode: 'in_person', meetingUrl: null })
  })

  it('aplica las tres políticas desde el servidor y conserva inscripciones previas', async () => {
    const count = await prisma.consultationRegistration.count({ where: { form: { consultationId: hybridId } } })
    await updateHybrid({ admissionPolicy: 'directory_only' })
    expect((await post(hybridId, { institutionSource: 'individual' })).status).toBe(422)
    expect((await post(hybridId, { institutionSource: 'other', institutionName: 'Nueva' })).status).toBe(422)
    expect(await prisma.consultationRegistration.count({ where: { form: { consultationId: hybridId } } })).toBe(count)
    await updateHybrid({ admissionPolicy: 'directory_and_other' })
    expect((await post(hybridId, { institutionSource: 'individual' })).status).toBe(422)
    expect((await post(hybridId, { institutionSource: 'other', institutionName: 'Nueva' })).status).toBe(201)
    await updateHybrid()
  })

  it('revalida institución y categoría inactivas incluso para platform-admin', async () => {
    await prisma.observatoryInstitution.update({ where: { id: institutionId }, data: { isActive: false, name: 'Nombre nuevo' } })
    expect((await post(hybridId, {}, adminCookie)).status).toBe(422)
    await prisma.observatoryInstitution.update({ where: { id: institutionId }, data: { isActive: true } })
    await prisma.observatoryInstitutionCategory.update({ where: { id: categoryId }, data: { isActive: false } })
    expect((await post(hybridId, {}, adminCookie)).status).toBe(422)
    await prisma.observatoryInstitutionCategory.update({ where: { id: categoryId }, data: { isActive: true, name: 'Categoría nueva' } })
    const history = await prisma.consultationRegistration.findFirstOrThrow({ where: { form: { consultationId: hybridId }, institutionId }, orderBy: { id: 'asc' } })
    expect(history.institutionName).toBe('Institución histórica')
    expect(history.institutionCategoryName).toBe('Categoría histórica')
  })

  it('mantiene la unicidad por cuenta, no por DNI o mail de visitantes', async () => {
    expect((await post(hybridId, {}, citizenCookie)).status).toBe(201)
    expect((await post(hybridId, {}, citizenCookie)).status).toBe(409)
    expect((await post(hybridId)).status).toBe(201)
    expect((await post(hybridId)).status).toBe(201)
  })

  it('no persiste ni revela el enlace mediante el honeypot', async () => {
    const before = await prisma.consultationRegistration.count({ where: { form: { consultationId: hybridId } } })
    const response = await post(hybridId, { website: 'https://spam.example.com' })
    expect(response.status).toBe(201)
    expect(response.data).toEqual({ success: true })
    expect(await prisma.consultationRegistration.count({ where: { form: { consultationId: hybridId } } })).toBe(before)
  })

  it('conserva modalidades previas al editar y permite un enlace aún no cargado', async () => {
    await updateHybrid({ eventMode: 'virtual', meetingUrl: null })
    const response = await post(hybridId, { attendanceMode: undefined, institutionSource: 'individual' })
    expect(response.status).toBe(201)
    expect(response.data.confirmation?.meetingUrl).toBeNull()
    expect(await prisma.consultationRegistration.count({ where: { form: { consultationId: hybridId }, attendanceMode: 'in_person' } })).toBeGreaterThan(0)
    await updateHybrid()
  })

  it('respeta las ventanas de inscripción', async () => {
    await updateHybrid({ opensAt: new Date(Date.now() - 2 * day).toISOString(), closesAt: new Date(Date.now() - day).toISOString() })
    expect((await post(hybridId)).status).toBe(422)
    await updateHybrid({ opensAt: new Date(Date.now() + day).toISOString(), closesAt: new Date(Date.now() + 2 * day).toISOString() })
    expect((await post(hybridId)).status).toBe(422)
    await updateHybrid()
  })

  it('expone snapshots y modalidad en el listado y CSV con el mismo ancho de cabeceras', async () => {
    const list = await api<{ items: AdminConsultationRegistrationDTO[] }>(`/api/consultations/${hybridId}/registrations`, { cookie: adminCookie })
    expect(list.status).toBe(200)
    expect(list.data.items.some(item => item.attendanceMode === 'virtual')).toBe(true)
    const { parts } = await runExport({ kind: 'consultation_registrations', consultationId: hybridId }, adminCookie)
    for (const part of parts) {
      expect(part.csv).toContain('"Modalidad de asistencia"')
      expect(part.csv).not.toContain(meetingUrl)
      const cells = (line: string) => [...line.matchAll(/"((?:[^"]|"")*)"/g)].length
      const header = part.csv.split(/\r?\n/)[0]!
      expect(cells(header)).toBe(23)
      for (const line of csvDataLines(part.csv)) expect(cells(line)).toBe(cells(header))
    }
    expect(parts.some(part => part.csv.includes('Institución histórica'))).toBe(true)
  })

  it('acredita sin inscripción y admite repetidos; vincula el DNI registrado', async () => {
    const context = await api<Record<string, unknown>>(`/api/accreditations/${accreditationPublicId}`)
    expect(context.data).toMatchObject({ kind: 'observatory', eventMode: 'hybrid' })
    expect(JSON.stringify(context.data)).not.toContain(meetingUrl)
    for (let n = 0; n < 2; n++) {
      const entry = await api<{ linkedToRegistration: boolean }>(`/api/accreditations/${accreditationPublicId}/entries`, { method: 'POST', body: { dni: 'sin inscripción' } })
      expect(entry.status).toBe(201)
      expect(entry.data.linkedToRegistration).toBe(false)
    }
    const linked = await api<{ linkedToRegistration: boolean }>(`/api/accreditations/${accreditationPublicId}/entries`, { method: 'POST', body: { dni: '30111222' } })
    expect(linked.status).toBe(201)
    expect(linked.data.linkedToRegistration).toBe(true)
    await updateHybrid({ accreditationEnabled: false })
    expect((await api(`/api/accreditations/${accreditationPublicId}`)).status).toBe(404)
    expect(await prisma.accreditationEntry.count({ where: { accreditation: { publicId: accreditationPublicId } } })).toBe(3)
  })

  it('no publica el enlace en el HTML de éxito abierto directamente', async () => {
    const response = await fetch(url(`/observatorio-obras-servicios/${virtualId}/${mark}-virtual/inscripcion/exito`))
    expect(response.status).toBe(200)
    expect(await response.text()).not.toContain(meetingUrl)
  })
})
