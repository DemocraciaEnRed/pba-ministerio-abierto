import * as z from 'zod'
import { PROVINCES } from '#shared/data/argentina'
import type { RegistrationFormKind } from '#shared/data/consultation-types'
import { emailField, phoneField, optionalText } from '#shared/schemas/auth'

// --- Formulario (administración) ---

const formTitleField = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(200, 'El título no puede superar los 200 caracteres')

const dateTimeField = (label: string) =>
  z
    .string({ error: `${label} es requerida` })
    .trim()
    .min(1, `${label} es requerida`)
    .refine(value => !Number.isNaN(Date.parse(value)), `${label} debe ser una fecha válida`)
    .transform(value => new Date(value))

const venueTextField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} es requerido`)
    .max(max, `${label} no puede superar los ${max} caracteres`)

export const ConsultationRegistrationFormSchema = z
  .object({
    title: formTitleField,
    eventAt: dateTimeField('La fecha del evento'),
    opensAt: dateTimeField('La fecha de apertura'),
    closesAt: dateTimeField('La fecha de cierre'),
    venueName: venueTextField('El lugar', 160),
    venueAddress: venueTextField('La dirección', 200),
    venueCity: venueTextField('La ciudad', 120),
    venueProvince: z.enum(PROVINCES, { error: 'Elegí una provincia' })
  })
  .superRefine((data, ctx) => {
    if (data.opensAt >= data.closesAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: 'El cierre debe ser posterior a la apertura'
      })
    }

    if (data.eventAt < data.opensAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['eventAt'],
        message: 'El evento no puede ser anterior a la apertura de inscripciones'
      })
    }
  })

// --- Inscripción (formulario público) ---

export const REGISTRATION_PARTICIPANT_CHARACTERS = ['individual', 'legal_entity'] as const
export const REGISTRATION_PARTICIPATION_MODES = ['attendee', 'speaker_request', 'speaker_report'] as const

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Ingresá ${label}`)
    .max(100, 'Máximo 100 caracteres')

const dniField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu DNI')
  .transform(value => value.replace(/[\s.]/g, ''))
  .pipe(z.string().regex(/^\d{7,9}$/, 'Ingresá un DNI válido (solo números)'))

const proofUrlField = z
  .string()
  .trim()
  .max(500, 'El enlace no puede superar los 500 caracteres')
  .transform(value => (value.length ? value : null))
  .nullable()
  .optional()
  .refine(
    value => !value || z.url().safeParse(value).success,
    'Ingresá un enlace válido (debe empezar con http:// o https://)'
  )

const questionsField = z
  .array(
    z
      .string()
      .trim()
      .max(2000, 'Cada pregunta puede tener hasta 2000 caracteres')
  )
  .max(20, 'No podés agregar más de 20 preguntas')

const registrationBaseShape = {
  firstName: nameField('tu nombre'),
  lastName: nameField('tu apellido'),
  dni: dniField,
  email: emailField,
  phone: phoneField,
  character: z.enum(REGISTRATION_PARTICIPANT_CHARACTERS, { error: 'Elegí el carácter en que participás' }),
  entityName: optionalText(200),
  entityAddress: optionalText(200),
  entityEmail: z
    .string()
    .trim()
    .toLowerCase()
    .transform(value => (value.length ? value : null))
    .nullable()
    .optional()
    .refine(value => !value || z.email().safeParse(value).success, 'Correo electrónico inválido'),
  entityPhone: optionalText(40),
  proofUrl: proofUrlField.default(null),
  /** `true` cuando el cliente adjunta un archivo en el multipart. */
  hasProofFile: z.boolean().default(false),
  participationMode: z
    .enum(REGISTRATION_PARTICIPATION_MODES, { error: 'Elegí una forma de participación' })
    .nullable()
    .optional()
    .default(null),
  presentationSummary: optionalText(5000),
  documentationDetail: optionalText(5000),
  questions: questionsField.default([]),
  // Campo trampa (honeypot): las personas no lo ven, los bots suelen completarlo.
  website: z.string().optional()
}

/**
 * El schema depende del tipo de consulta: solo las audiencias piden forma de
 * participación y sección de exposición. El servidor resuelve el `kind` desde
 * la base, así que el cliente no puede saltearse esas validaciones.
 */
export function buildConsultationRegistrationSchema(kind: RegistrationFormKind) {
  return z.object(registrationBaseShape).superRefine((data, ctx) => {
    if (data.character === 'legal_entity') {
      if (!data.entityName) {
        ctx.addIssue({ code: 'custom', path: ['entityName'], message: 'Ingresá la denominación o razón social' })
      }
      if (!data.entityAddress) {
        ctx.addIssue({ code: 'custom', path: ['entityAddress'], message: 'Ingresá el domicilio' })
      }
      if (!data.entityEmail) {
        ctx.addIssue({ code: 'custom', path: ['entityEmail'], message: 'Ingresá el correo electrónico' })
      }
      if (!data.entityPhone) {
        ctx.addIssue({ code: 'custom', path: ['entityPhone'], message: 'Ingresá el teléfono de contacto' })
      }
      if (!data.hasProofFile && !data.proofUrl) {
        ctx.addIssue({
          code: 'custom',
          path: ['proofUrl'],
          message: 'Adjuntá el instrumento que acredita la personería o ingresá un enlace'
        })
      }
    }

    if (kind !== 'hearing') return

    if (!data.participationMode) {
      ctx.addIssue({
        code: 'custom',
        path: ['participationMode'],
        message: 'Elegí una forma de participación'
      })
      return
    }

    if (data.participationMode === 'attendee') return

    if (!data.presentationSummary) {
      ctx.addIssue({
        code: 'custom',
        path: ['presentationSummary'],
        message: 'Describí brevemente la exposición a realizar'
      })
    }
    if (!data.documentationDetail) {
      ctx.addIssue({
        code: 'custom',
        path: ['documentationDetail'],
        message: 'Detallá la documentación acompañada'
      })
    }
    if (!data.questions.some(question => question.trim().length > 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions', 0],
        message: 'Ingresá al menos una pregunta'
      })
    }
  })
}

export const ConsultationRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export type ConsultationRegistrationFormInput = z.output<typeof ConsultationRegistrationFormSchema>
export type CreateConsultationRegistrationInput = z.output<ReturnType<typeof buildConsultationRegistrationSchema>>
export type ConsultationRegistrationsQueryInput = z.output<typeof ConsultationRegistrationsQuerySchema>
