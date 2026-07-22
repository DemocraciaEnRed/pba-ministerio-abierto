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

// Filtros de la bandeja de moderación por consulta.
export const CommentsModerationQuerySchema = z.object({
  scope: z.enum(['all', 'consultation', 'topic']).default('all'),
  topicId: z.coerce.number().int('El tema debe ser un entero').positive('El tema debe ser un ID válido').optional(),
  moderationStatus: moderationStatusFilter,
  page: pageField,
  perPage: perPageField
})

// Filtros de la bandeja de moderación de un tema (el contenedor ya está fijado por la ruta).
export const TopicCommentsModerationQuerySchema = z.object({
  moderationStatus: moderationStatusFilter,
  page: pageField,
  perPage: perPageField
})

// Presentación del listado público de comentarios. `view=thread` fuerza el hilo
// anidado público incluso para administradores (que por defecto ven la bandeja).
export const CommentsThreadQuerySchema = z.object({
  view: z.enum(['thread']).optional()
})

// Paginado del hilo de respuestas de un comentario (carga bajo demanda, 5 por página).
export const RepliesQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(50, 'La cantidad máxima es 50').default(5),
  order: z.enum(['recent', 'oldest']).default('recent')
})

export type CreateCommentInput = z.output<typeof CreateCommentSchema>
export type ModerateCommentInput = z.output<typeof ModerateCommentSchema>
export type CommentReactionInput = z.output<typeof CommentReactionSchema>
export type CommentsModerationQueryInput = z.output<typeof CommentsModerationQuerySchema>
export type TopicCommentsModerationQueryInput = z.output<typeof TopicCommentsModerationQuerySchema>
export type CommentsThreadQueryInput = z.output<typeof CommentsThreadQuerySchema>
export type RepliesQueryInput = z.output<typeof RepliesQuerySchema>
