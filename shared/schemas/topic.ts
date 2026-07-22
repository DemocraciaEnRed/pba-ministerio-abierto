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

// Crear un nuevo tema dentro de una consulta
export const CreateTopicSchema = z.object({
  slug: slugField,
  title: titleField,
  summary: textAreaField,
  body: textAreaField,
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0),
  participationStartsAt: requiredStartDateField,
  participationEndsAt: dateField.default(null),
  mechanismType: z.enum(['support', 'vote', 'survey']).nullable().default(null),
  publishResultsWhenParticipationEnds: z.boolean().default(true)
})

// Actualizar datos del tema
export const UpdateTopicSchema = z.object({
  slug: slugField,
  title: titleField,
  summary: textAreaField,
  body: textAreaField,
  displayOrder: z.int().min(0, 'El orden no puede ser negativo'),
  participationStartsAt: requiredStartDateField,
  participationEndsAt: dateField,
  publishResultsWhenParticipationEnds: z.boolean()
})

// Cambiar el mecanismo de un tema (null = quitar el método, sólo posible sin bloqueo)
export const SetTopicMechanismSchema = z.object({
  mechanismType: z.enum(['support', 'vote', 'survey']).nullable()
})

// Configuración específica del método (voto/encuesta) y la consigna del tema.
// Todos los campos opcionales: se actualizan sólo los presentes. Sujeto al
// bloqueo de configuración. La consigna (questionText) es propia del mecanismo.
export const SetTopicMechanismConfigSchema = z
  .object({
    questionText: textAreaField.optional(),
    voteAllowAbstain: z.boolean().optional(),
    surveyMinSelections: z.int().min(1, 'El mínimo debe ser al menos 1').optional(),
    surveyMaxSelections: z.int().min(1, 'El máximo debe ser al menos 1').nullable().optional()
  })
  .refine(
    data => data.surveyMaxSelections == null
      || data.surveyMinSelections == null
      || data.surveyMaxSelections >= data.surveyMinSelections,
    { message: 'El máximo no puede ser menor que el mínimo', path: ['surveyMaxSelections'] }
  )

// Cambiar la visibilidad de un tema. Archivar es terminal.
export const SetTopicVisibilitySchema = z.object({
  visibility: z.enum(['hidden', 'visible', 'archived'])
})

// Bloquear o desbloquear la configuración del método de participación de un tema.
export const SetTopicConfigLockSchema = z.object({
  locked: z.boolean()
})

// Reordenar un tema dentro de la consulta
export const SetTopicOrderSchema = z.object({
  displayOrder: z.int().min(0, 'El orden no puede ser negativo')
})

// Asignar etiquetas a un tema
export const SetTopicTagsSchema = z.object({
  tagIds: z.array(z.int().positive('La etiqueta debe ser un ID válido')).max(50, 'No podés asignar más de 50 etiquetas')
})

// Crear opción de encuesta
export const CreateSurveyOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede superar los 200 caracteres'),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres')
    .nullable(),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0)
})

// Actualizar opción de encuesta
export const UpdateSurveyOptionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'La etiqueta es requerida')
    .max(200, 'La etiqueta no puede superar los 200 caracteres'),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres')
    .nullable(),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo'),
  isActive: z.boolean()
})

// Participación: apoyo
export const SupportParticipationSchema = z.object({})

// Participación: voto
export const VoteParticipationSchema = z.object({
  voteValue: z.enum(['in_favor', 'abstain', 'against'])
})

// Participación: encuesta (selección de una o varias opciones)
export const SurveyParticipationSchema = z.object({
  surveyOptionIds: z
    .array(z.int().positive('La opción de encuesta debe ser un ID válido'))
    .min(1, 'Elegí al menos una opción')
    .max(100, 'Demasiadas opciones seleccionadas')
})

export type CreateTopicInput = z.output<typeof CreateTopicSchema>
export type UpdateTopicInput = z.output<typeof UpdateTopicSchema>
export type SetTopicMechanismInput = z.output<typeof SetTopicMechanismSchema>
export type SetTopicMechanismConfigInput = z.output<typeof SetTopicMechanismConfigSchema>
export type SetTopicVisibilityInput = z.output<typeof SetTopicVisibilitySchema>
export type SetTopicConfigLockInput = z.output<typeof SetTopicConfigLockSchema>
export type SetTopicOrderInput = z.output<typeof SetTopicOrderSchema>
export type SetTopicTagsInput = z.output<typeof SetTopicTagsSchema>
export type CreateSurveyOptionInput = z.output<typeof CreateSurveyOptionSchema>
export type UpdateSurveyOptionInput = z.output<typeof UpdateSurveyOptionSchema>
export type SupportParticipationInput = z.output<typeof SupportParticipationSchema>
export type VoteParticipationInput = z.output<typeof VoteParticipationSchema>
export type SurveyParticipationInput = z.output<typeof SurveyParticipationSchema>
