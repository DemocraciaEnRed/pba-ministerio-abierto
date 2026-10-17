import * as z from 'zod'

const slugField = z
  .string()
  .trim()
  .min(1, 'El slug es requerido')
  .max(120, 'El slug no puede superar los 120 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones')

// Nombre legible de la URL pública (`/{seccion}/{id}/{nombre}`). No identifica
// la consulta (puede repetirse) y es opcional: si falta, el servidor lo genera
// desde el título al crear y lo conserva al editar.
const addressNameField = z.preprocess(
  value => (value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value),
  z
    .string()
    .trim()
    .max(120, 'La dirección no puede superar los 120 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'La dirección solo puede tener minúsculas, números y guiones')
    .optional()
)

const titleField = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(180, 'El título no puede superar los 180 caracteres')

const textAreaField = z
  .string()
  .trim()
  .max(10000, 'El contenido no puede superar los 10000 caracteres')
  .nullable()

const dateField = z
  .string()
  .trim()
  .datetime('La fecha debe estar en formato ISO válido')
  .transform(value => new Date(value))
  .nullable()

const requiredStartDateField = z
  .string({ error: 'La fecha de inicio de participación es requerida' })
  .trim()
  .min(1, 'La fecha de inicio de participación es requerida')
  .datetime('La fecha debe estar en formato ISO válido')
  .transform(value => new Date(value))

const idListField = z
  .preprocess(
    (value) => {
      if (value === undefined || value === null || value === '') return undefined
      const raw = Array.isArray(value) ? value : [value]
      const ids = raw
        .flatMap(item => String(item).split(','))
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => Number(item))
      return ids.length > 0 ? ids : undefined
    },
    z
      .array(z.number().int('El ID debe ser un entero').positive('El ID debe ser positivo'))
      .optional()
  )

const commentsEnabledField = z.boolean().default(true)

const participationStateField = z.enum(['scheduled', 'open', 'closed'], {
  message: 'El estado debe ser programada, abierta o finalizada'
})

// Lista de estados temporales en CSV (`open,scheduled`) o repetida en la query.
// Se conserva el orden recibido sin duplicados: define el orden de los grupos.
const participationStateListField = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === '') return undefined
    const raw = Array.isArray(value) ? value : [value]
    const states = raw
      .flatMap(item => String(item).split(','))
      .map(item => item.trim())
      .filter(item => item.length > 0)
    return states.length > 0 ? [...new Set(states)] : undefined
  },
  z.array(participationStateField).optional()
)

const queryDateField = z
  .string()
  .trim()
  .datetime('La fecha debe estar en formato ISO válido')
  .transform(value => new Date(value))
  .optional()

/** Ventana máxima para `activeFrom`/`activeTo` (agenda), en días. */
export const CONSULTATIONS_ACTIVE_WINDOW_MAX_DAYS = 92

export const ConsultationsQuerySchema = z.object({
  q: z.string().trim().max(120, 'El texto de búsqueda no puede superar los 120 caracteres').optional(),
  visibility: z.enum(['hidden', 'visible', 'archived']).optional(),
  state: z.enum(['scheduled', 'open', 'closed', 'archived']).optional(),
  states: participationStateListField,
  activeFrom: queryDateField,
  activeTo: queryDateField,
  featured: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  /** Solo instancias con la inscripción presencial abierta ahora. */
  registrationOpen: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  sectionSlug: slugField.optional(),
  sectionIds: idListField,
  regionSlug: slugField.optional(),
  regionIds: idListField,
  observatoryWorkGroupSlug: slugField.optional(),
  observatoryWorkGroupIds: idListField,
  categoryIds: idListField,
  tagIds: idListField,
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
}).superRefine((query, ctx) => {
  if (query.state && query.states) {
    ctx.addIssue({
      code: 'custom',
      path: ['states'],
      message: 'Usá "state" o "states", no ambos a la vez'
    })
  }

  if (Boolean(query.activeFrom) !== Boolean(query.activeTo)) {
    ctx.addIssue({
      code: 'custom',
      path: [query.activeFrom ? 'activeTo' : 'activeFrom'],
      message: 'Indicá las dos fechas del rango (desde y hasta)'
    })
    return
  }

  if (query.activeFrom && query.activeTo) {
    if (query.activeFrom > query.activeTo) {
      ctx.addIssue({
        code: 'custom',
        path: ['activeTo'],
        message: 'La fecha "hasta" debe ser posterior a la fecha "desde"'
      })
      return
    }

    const maxMs = CONSULTATIONS_ACTIVE_WINDOW_MAX_DAYS * 24 * 60 * 60 * 1000
    if (query.activeTo.getTime() - query.activeFrom.getTime() > maxMs) {
      ctx.addIssue({
        code: 'custom',
        path: ['activeTo'],
        message: `El rango de fechas no puede superar los ${CONSULTATIONS_ACTIVE_WINDOW_MAX_DAYS} días`
      })
    }
  }
})

export const CreateConsultationSchema = z.object({
  slug: addressNameField,
  title: titleField,
  // El tipo de consulta se define solo en el alta: determina qué estructura habilita.
  sectionId: z
    .int('El tipo de consulta debe ser un ID válido')
    .positive('Elegí un tipo de consulta'),
  summary: textAreaField,
  body: textAreaField,
  consultationFormat: z.enum(['single', 'multiple']).default('multiple'),
  startsAt: requiredStartDateField,
  endsAt: dateField.default(null),
  closedMessage: textAreaField,
  commentsEnabled: commentsEnabledField,
  commentsGuidance: textAreaField.default(null),
  resultsVisibility: z.enum(['hidden', 'participants_only', 'public']).default('public')
})

export const UpdateConsultationSchema = z.object({
  slug: addressNameField,
  title: titleField,
  summary: textAreaField,
  body: textAreaField,
  consultationFormat: z.enum(['single', 'multiple']),
  startsAt: requiredStartDateField,
  endsAt: dateField,
  closedMessage: textAreaField,
  commentsEnabled: commentsEnabledField,
  commentsGuidance: textAreaField.default(null),
  resultsVisibility: z.enum(['hidden', 'participants_only', 'public'])
})

export const SetConsultationVisibilitySchema = z.object({
  visibility: z.enum(['hidden', 'visible', 'archived'])
})

export const UpdateConsultationFormatSchema = z.object({
  consultationFormat: z.enum(['single', 'multiple'])
})

export const UpdateConsultationFeaturedSchema = z.object({
  featured: z.boolean()
})

export const SetConsultationCategoriesSchema = z.object({
  categories: z.array(z.object({
    categoryId: z.int().positive('La categoría debe ser un ID válido'),
    isPrimary: z.boolean().default(false),
    displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0)
  })).max(20, 'No podés asignar más de 20 categorías')
}).superRefine((value, ctx) => {
  const primaryCount = value.categories.filter(category => category.isPrimary).length
  if (primaryCount > 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Solo puede haber una categoría principal',
      path: ['categories']
    })
  }
})

export const SetConsultationTagsSchema = z.object({
  tagIds: z.array(z.int().positive('La etiqueta debe ser un ID válido')).max(50, 'No podés asignar más de 50 etiquetas')
})

export const SetConsultationSectionSchema = z.object({
  sectionId: z.int().positive('La sección debe ser un ID válido').nullable()
})

export const SetConsultationRegionSchema = z.object({
  regionId: z.int().positive('La región debe ser un ID válido').nullable()
})

export const SetConsultationWorkGroupsSchema = z.object({
  observatoryWorkGroupIds: z
    .array(z.int().positive('El grupo de trabajo debe ser un ID válido'))
})

export const AssignConsultationMemberSchema = z.object({
  userId: z.int().positive('El usuario debe ser un ID válido'),
  role: z.enum(['consultation_admin']).default('consultation_admin')
})

// Query paginada de las consultas donde el usuario autenticado es miembro.
export const MyConsultationsQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export type ConsultationsQueryInput = z.output<typeof ConsultationsQuerySchema>
export type MyConsultationsQueryInput = z.output<typeof MyConsultationsQuerySchema>
export type CreateConsultationInput = z.output<typeof CreateConsultationSchema>
export type UpdateConsultationInput = z.output<typeof UpdateConsultationSchema>
export type SetConsultationVisibilityInput = z.output<typeof SetConsultationVisibilitySchema>
export type UpdateConsultationFormatInput = z.output<typeof UpdateConsultationFormatSchema>
export type UpdateConsultationFeaturedInput = z.output<typeof UpdateConsultationFeaturedSchema>
export type SetConsultationCategoriesInput = z.output<typeof SetConsultationCategoriesSchema>
export type SetConsultationTagsInput = z.output<typeof SetConsultationTagsSchema>
export type SetConsultationSectionInput = z.output<typeof SetConsultationSectionSchema>
export type SetConsultationRegionInput = z.output<typeof SetConsultationRegionSchema>
export type SetConsultationWorkGroupsInput = z.output<typeof SetConsultationWorkGroupsSchema>
export type AssignConsultationMemberInput = z.output<typeof AssignConsultationMemberSchema>
