import * as z from 'zod'

const bodyField = z
  .string()
  .trim()
  .min(1, 'El comentario no puede estar vacío')
  .max(5000, 'El comentario no puede superar los 5000 caracteres')

const authorModeField = z.enum(['citizen', 'institution'])

const reactionTypeField = z.enum(['heart', 'agree', 'idea', 'relevant', 'deepen'])

// Crear un comentario (a nivel consulta o tema).
// `authorMode` solo se respeta para administradores; un ciudadano queda como 'citizen'.
export const CreateCommentSchema = z.object({
  body: bodyField,
  parentCommentId: z.int().positive('El comentario padre debe ser un ID válido').nullable().default(null),
  authorMode: authorModeField.optional()
})

// Cambiar el estado de moderación (reversible entre visible y oculto).
export const ModerateCommentSchema = z.object({
  moderationStatus: z.enum(['visible', 'hidden'])
})

// Agregar o quitar una reacción del usuario sobre un comentario.
export const CommentReactionSchema = z.object({
  reactionType: reactionTypeField
})

// Campos reutilizables para paginar y filtrar la bandeja de moderación.
const moderationStatusFilter = z.enum(['visible', 'hidden', 'deleted']).optional()
const pageField = z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1)
const perPageField = z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(50)
const searchField = z.string().trim().max(120, 'El texto de búsqueda no puede superar los 120 caracteres').optional()
  .transform(value => value || undefined)
// Fecha de calendario (YYYY-MM-DD); el servidor la interpreta como día completo en hora de Argentina.
const dayField = z.iso.date('La fecha debe tener el formato AAAA-MM-DD').optional()
// Los booleanos llegan como texto en la query string.
const queryFlagField = z.enum(['true', 'false'], { message: 'El valor debe ser true o false' })
  .optional()
  .transform(value => value === 'true')

/**
 * Filtros compartidos por la bandeja de moderación de la consulta y la del tema.
 * `level=top` lista solo comentarios de primer nivel (hilos) con su contador de
 * respuestas; `all` (por defecto) mantiene el listado plano histórico.
 */
const moderationFilters = {
  level: z.enum(['all', 'top']).default('all'),
  moderationStatus: moderationStatusFilter,
  q: searchField,
  from: dayField,
  to: dayField,
  unanswered: queryFlagField,
  withAttachment: queryFlagField,
  order: z.enum(['recent', 'oldest', 'mostReplied']).default('recent'),
  page: pageField,
  perPage: perPageField
}

function refineDayRange(value: { from?: string, to?: string }, ctx: z.RefinementCtx): void {
  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'La fecha final no puede ser anterior a la inicial' })
  }
}

// Filtros de la bandeja de moderación por consulta.
export const CommentsModerationQuerySchema = z.object({
  scope: z.enum(['all', 'consultation', 'topic']).default('all'),
  topicId: z.coerce.number().int('El tema debe ser un entero').positive('El tema debe ser un ID válido').optional(),
  ...moderationFilters
}).superRefine(refineDayRange)

// Filtros de la bandeja de moderación de un tema (el contenedor ya está fijado por la ruta).
export const TopicCommentsModerationQuerySchema = z.object(moderationFilters).superRefine(refineDayRange)

// Registro de comentarios de toda la plataforma (panel de administración).
export const PlatformCommentsLogQuerySchema = z.object({
  q: searchField,
  consultationId: z.coerce.number().int('La consulta debe ser un entero').positive('La consulta debe ser un ID válido').optional(),
  moderationStatus: moderationStatusFilter,
  from: dayField,
  to: dayField,
  page: pageField,
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
}).superRefine(refineDayRange)

// Presentación del listado público de comentarios. `view=thread` fuerza el hilo
// anidado público incluso para administradores (que por defecto ven la bandeja).
export const CommentsThreadQuerySchema = z.object({
  view: z.enum(['thread']).optional()
})

// Rango temporal del panel de actividad de comentarios.
export const CommentMetricsQuerySchema = z.object({
  range: z.enum(['7d', '14d', 'month', 'all'], { message: 'Rango inválido' }).default('14d')
})

// Paginado del hilo de respuestas de un comentario (carga bajo demanda, 5 por página).
export const RepliesQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(50, 'La cantidad máxima es 50').default(5),
  order: z.enum(['recent', 'oldest']).default('recent'),
  // `moderation` (solo administradores) incluye respuestas ocultas y borradas.
  view: z.enum(['moderation']).optional()
})

export type CreateCommentInput = z.output<typeof CreateCommentSchema>
export type ModerateCommentInput = z.output<typeof ModerateCommentSchema>
export type CommentReactionInput = z.output<typeof CommentReactionSchema>
export type CommentsModerationQueryInput = z.output<typeof CommentsModerationQuerySchema>
export type TopicCommentsModerationQueryInput = z.output<typeof TopicCommentsModerationQuerySchema>
export type PlatformCommentsLogQueryInput = z.output<typeof PlatformCommentsLogQuerySchema>
export type CommentsThreadQueryInput = z.output<typeof CommentsThreadQuerySchema>
export type CommentMetricsQueryInput = z.output<typeof CommentMetricsQuerySchema>
export type RepliesQueryInput = z.output<typeof RepliesQuerySchema>
