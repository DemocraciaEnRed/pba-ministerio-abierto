import { afterEach, describe, expect, it, vi } from 'vitest'
import nunjucks from 'nunjucks'
import {
  buildConsultationRegistrationFormSchema,
  buildConsultationRegistrationSchema
} from '../../shared/schemas/consultation-registrations'
import { serializeConsultationRegistrationForm } from '../../server/utils/serializers/consultationRegistrationForm'
import { serializeRegistrationConfirmation } from '../../server/utils/serializers/consultationRegistration'
import { sendRegistrationConfirmationEmail, type RegistrationConfirmationData } from '../../server/utils/mailer/messages'
import { sendMail } from '../../server/utils/mailer/send'

vi.mock('../../server/utils/mailer/send', () => ({ sendMail: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const eventAt = new Date('2027-01-01T15:00:00.000Z')
const form = {
  id: 1, consultationId: 2, title: 'Reunión', body: null,
  eventAt, opensAt: new Date('2026-12-01T15:00:00.000Z'), closesAt: new Date('2026-12-31T15:00:00.000Z'),
  eventMode: 'virtual' as const, admissionPolicy: 'open' as const,
  meetingUrl: 'https://example.com/privado',
  venueName: null, venueAddress: null, venueCity: null, venueProvince: null,
  createdAt: eventAt, updatedAt: eventAt
}
const participant = {
  firstName: 'Ana', lastName: 'Pérez', dni: '30.111.222', email: 'ana@example.com',
  phone: '11 12345678', institutionSource: 'individual'
}

describe('Reglas y DTO de inscripción', () => {
  it('valida modalidad y política sin habilitarlas en variantes previas', () => {
    const virtualForm = { ...form, eventAt: form.eventAt.toISOString(), opensAt: form.opensAt.toISOString(), closesAt: form.closesAt.toISOString() }
    expect(buildConsultationRegistrationFormSchema('observatory').safeParse(virtualForm).success).toBe(true)
    for (const kind of ['hearing', 'consultation', 'dialogue'] as const) {
      expect(buildConsultationRegistrationFormSchema(kind).safeParse(virtualForm).success).toBe(false)
      expect(buildConsultationRegistrationSchema(kind).safeParse({ ...participant, character: 'legal_entity' }).success).toBe(false)
    }
  })

  it('normaliza DNI y teléfono y no exige datos legales al Observatorio', () => {
    const parsed = buildConsultationRegistrationSchema('observatory', form).parse(participant)
    expect(parsed.dni).toBe('30111222')
    expect(parsed.phone).toBe('+541112345678')
    expect(parsed.proofUrl).toBeNull()
  })

  it('omite el enlace en el DTO público y lo conserva en administración', () => {
    const publicDTO = serializeConsultationRegistrationForm(form, 'public', { kind: 'observatory' })
    expect(publicDTO).not.toHaveProperty('meetingUrl')
    expect(JSON.stringify(publicDTO)).not.toContain(form.meetingUrl)
    expect(serializeConsultationRegistrationForm(form, 'admin', { kind: 'observatory' }).meetingUrl).toBe(form.meetingUrl)
  })

  it('no entrega el enlace en una confirmación presencial', () => {
    expect(serializeRegistrationConfirmation({
      consultationId: '2', attendanceMode: 'in_person', meetingUrl: form.meetingUrl, emailSent: false
    })).toEqual({ consultationId: '2', attendanceMode: 'in_person', meetingUrl: null, emailSent: false })
  })
})

describe('Correo de confirmación', () => {
  function data(overrides: Partial<RegistrationConfirmationData> = {}): RegistrationConfirmationData {
    return {
      displayName: 'Ana Pérez', consultationTitle: 'Consulta', consultationUrl: '/consultas/2/reunion',
      formTitle: 'Reunión de trabajo', eventAt, venueName: 'Sala', venueAddress: 'Calle 7',
      venueCity: 'La Plata', venueProvince: 'Buenos Aires', participationMode: null, isLegalEntity: true,
      observatory: { attendanceMode: 'virtual', institutionSource: 'directory', institutionName: 'Institución', meetingUrl: form.meetingUrl },
      ...overrides
    }
  }

  async function renderMail(payload: RegistrationConfirmationData) {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: 'https://example.com' } }))
    await sendRegistrationConfirmationEmail('ana@example.com', payload)
    const call = vi.mocked(sendMail).mock.calls.at(-1)![0]
    const environment = new nunjucks.Environment(new nunjucks.FileSystemLoader('server/emails/templates'), { autoescape: true })
    return { call, html: environment.render('registration-confirmation.njk', call.data) }
  }

  it('incluye enlace e institución para inscripción virtual, sin lugar ficticio', async () => {
    const { html } = await renderMail(data())
    expect(html).toContain(form.meetingUrl)
    expect(html).toContain('Virtual')
    expect(html).toContain('Institución')
    expect(html).not.toContain('Calle 7')
  })

  it('informa cuando el enlace todavía no está disponible', async () => {
    const { html } = await renderMail(data({
      observatory: { attendanceMode: 'virtual', institutionSource: 'individual', institutionName: null, meetingUrl: null }
    }))
    expect(html).toContain('La organización te comunicará los datos de conexión.')
    expect(html).toContain('Persona física')
    expect(html).not.toContain(form.meetingUrl)
  })

  it('incluye lugar presencial sin enlace virtual', async () => {
    const { html } = await renderMail(data({
      observatory: { attendanceMode: 'in_person', institutionSource: 'other', institutionName: 'Otra organización', meetingUrl: null }
    }))
    expect(html).toContain('Calle 7')
    expect(html).toContain('Presencial')
    expect(html).not.toContain(form.meetingUrl)
  })

  it('preserva el correo legal anterior', async () => {
    const { html } = await renderMail(data({ observatory: null }))
    expect(html).toContain('Representante de Persona Jurídica')
    expect(html).toContain('Calle 7')
    expect(html).not.toContain('Modalidad')
  })

  it('propaga el error de envío para que el handler pueda notificarlo', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: 'https://example.com' } }))
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('SMTP no disponible'))
    await expect(sendRegistrationConfirmationEmail('ana@example.com', data())).rejects.toThrow('SMTP no disponible')
  })
})
