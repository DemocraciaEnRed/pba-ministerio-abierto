import * as z from 'zod'

const slugField = z
  .string()
  .trim()
  .min(1, 'El slug es requerido')
  .max(120, 'El slug no puede superar los 120 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones')

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

export const ConsultationsQuerySchema = z.object({
  q: z.string().trim().max(120, 'El texto de búsqueda no puede superar los 120 caracteres').optional(),
  visibility: z.enum(['hidden', 'visible', 'archived']).optional(),
  state: z.enum(['scheduled', 'open', 'closed', 'archived']).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  sectionSlug: slugField.optional(),
  sectionIds: idListField,
  categoryIds: idListField,
  tagIds: idListField,
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export const CreateConsultationSchema = z.object({
  slug: slugField,
  title: titleField,
  summary: textAreaField,
  body: textAreaField,
  consultationFormat: z.enum(['single', 'multiple']).default('multiple'),
  startsAt: requiredStartDateField,
  endsAt: dateField.default(null),
  closedMessage: textAreaField,
  resultsVisibility: z.enum(['hidden', 'participants_only', 'public']).default('public')
})

export const UpdateConsultationSchema = z.object({
  slug: slugField,
  title: titleField,
  summary: textAreaField,
  body: textAreaField,
  consultationFormat: z.enum(['single', 'multiple']),
  startsAt: requiredStartDateField,
  endsAt: dateField,
  closedMessage: textAreaField,
  resultsVisibility: z.enum(['hidden', 'participants_only', 'public']),
  // Si es true, al guardar se recortan las fechas de los temas que quedan fuera
  // de la nueva ventana de la consulta (ver clampTopicWindowToConsultation).
  adjustTopics: z.boolean().default(false)
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
export type AssignConsultationMemberInput = z.output<typeof AssignConsultationMemberSchema>
