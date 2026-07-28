import * as z from 'zod'
import {
  BUENOS_AIRES,
  BUENOS_AIRES_MUNICIPALITIES,
  PROVINCES,
  isValidBuenosAiresMunicipality
} from '#shared/data/argentina'
import { isValidEjeTematicoSelection } from '#shared/data/regional-meetings-ejes'
import { emailField, phoneField, optionalText } from '#shared/schemas/auth'

const locationField = z
  .string()
  .trim()
  .min(1, 'El lugar es requerido')
  .max(160, 'El lugar no puede superar los 160 caracteres')

const heldAtField = z
  .string({ error: 'La fecha es requerida' })
  .trim()
  .min(1, 'La fecha es requerida')
  .datetime('La fecha debe estar en formato ISO válido')
  .transform(value => new Date(value))

const yearField = z
  .int('El año debe ser un número entero')
  .min(2000, 'El año no puede ser anterior a 2000')
  .max(2100, 'El año no puede ser posterior a 2100')
  .nullable()

const municipalityField = z.enum(BUENOS_AIRES_MUNICIPALITIES, {
  error: 'Elegí un municipio válido'
})

const regionIdField = z
  .int('La región debe ser un ID válido')
  .positive('La región debe ser un ID válido')
  .nullable()

const groupNameField = z
  .string()
  .trim()
  .min(1, 'El nombre del encuentro es requerido')
  .max(160, 'El nombre no puede superar los 160 caracteres')

const testimonialBodyField = z
  .string()
  .trim()
  .min(1, 'El testimonio es requerido')
  .max(2000, 'El testimonio no puede superar los 2000 caracteres')

const authorNameField = z
  .string()
  .trim()
  .min(1, 'El nombre es requerido')
  .max(120, 'El nombre no puede superar los 120 caracteres')

// --- Agenda ---

export const UpdateAgendaItemSchema = z.object({
  location: locationField,
  heldAt: heldAtField,
  year: yearField.default(null),
  held: z.boolean().default(false)
})

// --- Testimonios ---

const testimonialItemSchema = z.object({
  body: testimonialBodyField,
  authorName: authorNameField,
  municipality: municipalityField
})

const testimonialsListField = z
  .array(testimonialItemSchema)
  .max(3, 'Un encuentro no puede tener más de 3 testimonios')

export const CreateTestimonialGroupSchema = z.object({
  name: groupNameField,
  municipality: municipalityField,
  heldAt: heldAtField,
  regionId: regionIdField.default(null),
  testimonials: testimonialsListField.default([])
})

export const UpdateTestimonialGroupSchema = CreateTestimonialGroupSchema

// --- Aportes (formulario público) ---

const firstNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu nombre')
  .max(100, 'Máximo 100 caracteres')

const lastNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu apellido')
  .max(100, 'Máximo 100 caracteres')

const provinciaField = z.enum(PROVINCES, { message: 'Elegí tu provincia' })

const ejeTematicoField = z
  .string()
  .trim()
  .min(1, 'Elegí un eje temático')

const subejeTematicoField = z
  .string()
  .trim()
  .transform(value => (value.length ? value : null))
  .nullable()
  .optional()

const submissionLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Ingresá un enlace')
    .max(2000, 'El enlace no puede superar los 2000 caracteres')
    .pipe(z.url('Ingresá un enlace válido (debe empezar con http:// o https://)')),
  title: optionalText(160)
})

export const RegionalMeetingSubmissionLinkSchema = submissionLinkSchema

export const RegionalMeetingSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

const submissionLinksField = z
  .array(submissionLinkSchema)
  .max(20, 'No podés agregar más de 20 enlaces')

export const CreateRegionalMeetingSubmissionSchema = z
  .object({
    firstName: firstNameField,
    lastName: lastNameField,
    email: emailField,
    phone: phoneField,
    provincia: provinciaField,
    municipio: optionalText(120),
    representsInstitution: z.boolean(),
    organization: optionalText(120),
    ejeTematico: ejeTematicoField,
    subejeTematico: subejeTematicoField.default(null),
    ideaProyecto: optionalText(5000),
    comentarios: optionalText(5000),
    enlaces: submissionLinksField.default([]),
    // Campo trampa (honeypot): las personas no lo ven, los bots suelen completarlo.
    website: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.representsInstitution && !data.organization) {
      ctx.addIssue({
        code: 'custom',
        path: ['organization'],
        message: 'Ingresá el nombre de la institución u organización'
      })
    }

    // El municipio solo es obligatorio (y validado contra la lista) cuando la
    // provincia es Buenos Aires. Para el resto se ignora (se guarda como null).
    if (data.provincia === BUENOS_AIRES) {
      if (!data.municipio) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Elegí tu municipio' })
      } else if (!isValidBuenosAiresMunicipality(data.municipio)) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Municipio inválido' })
      }
    }

    if (!isValidEjeTematicoSelection(data.ejeTematico, data.subejeTematico)) {
      ctx.addIssue({ code: 'custom', path: ['ejeTematico'], message: 'Elegí un eje temático válido' })
    }
  })

export type UpdateAgendaItemInput = z.output<typeof UpdateAgendaItemSchema>
export type TestimonialItemInput = z.output<typeof testimonialItemSchema>
export type CreateTestimonialGroupInput = z.output<typeof CreateTestimonialGroupSchema>
export type UpdateTestimonialGroupInput = z.output<typeof UpdateTestimonialGroupSchema>
export type CreateRegionalMeetingSubmissionInput = z.output<typeof CreateRegionalMeetingSubmissionSchema>
export type RegionalMeetingSubmissionLinkInput = z.output<typeof submissionLinkSchema>
export type RegionalMeetingSubmissionsQueryInput = z.output<typeof RegionalMeetingSubmissionsQuerySchema>
