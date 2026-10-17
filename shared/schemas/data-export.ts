import * as z from 'zod'

export const DATA_EXPORT_KINDS = [
  'consultation_comments',
  'platform_comments',
  'consultation_registrations',
  'consultation_accreditations',
  'regional_meeting_submissions',
  'observatory_contributions'
] as const

const kindField = z.enum(DATA_EXPORT_KINDS, { message: 'Tipo de exportación inválido' })
const consultationIdField = z.coerce
  .number({ message: 'La consulta debe ser un ID válido' })
  .int('La consulta debe ser un ID válido')
  .positive('La consulta debe ser un ID válido')
const moderationStatusField = z.enum(['visible', 'hidden', 'deleted'], { message: 'Estado de moderación inválido' }).optional()
const searchField = z.string().trim().max(120, 'El texto de búsqueda no puede superar los 120 caracteres').optional()
  .transform(value => value || undefined)
// Fecha de calendario (YYYY-MM-DD); el servidor la interpreta como día completo en hora de Argentina.
const dayField = z.iso.date('La fecha debe tener el formato AAAA-MM-DD').optional()
const flagField = z.boolean({ message: 'El valor debe ser verdadero o falso' }).default(false)

function refineDayRange(value: { from?: string, to?: string }, ctx: z.RefinementCtx): void {
  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'La fecha final no puede ser anterior a la inicial' })
  }
}

/**
 * Filtros de la exportación de comentarios de una consulta: los mismos de la
 * bandeja de moderación. `topic` (slug o id) acota la exportación a un tema.
 */
export const ConsultationCommentsExportFiltersSchema = z.object({
  topic: z.string().trim().min(1, 'Indicá el tema').max(255, 'Tema inválido').optional(),
  moderationStatus: moderationStatusField,
  q: searchField,
  from: dayField,
  to: dayField,
  unanswered: flagField,
  withAttachment: flagField
}).superRefine(refineDayRange)

/** Filtros de la exportación del registro de comentarios de la plataforma. */
export const PlatformCommentsExportFiltersSchema = z.object({
  consultationId: consultationIdField.optional(),
  moderationStatus: moderationStatusField,
  q: searchField,
  from: dayField,
  to: dayField
}).superRefine(refineDayRange)

/** Pedido de una exportación. Cada tipo define su alcance y sus filtros. */
export const CreateDataExportSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('consultation_comments'),
    consultationId: consultationIdField,
    filters: ConsultationCommentsExportFiltersSchema.prefault({})
  }),
  z.object({
    kind: z.literal('platform_comments'),
    filters: PlatformCommentsExportFiltersSchema.prefault({})
  }),
  z.object({
    kind: z.literal('consultation_registrations'),
    consultationId: consultationIdField
  }),
  z.object({
    kind: z.literal('consultation_accreditations'),
    consultationId: consultationIdField
  }),
  z.object({
    kind: z.literal('regional_meeting_submissions')
  }),
  z.object({
    kind: z.literal('observatory_contributions')
  })
], { message: 'Tipo de exportación inválido' })

/** Listado de exportaciones. `scope=all` (solo platform-admin) incluye las de todas las personas. */
export const DataExportsQuerySchema = z.object({
  scope: z.enum(['mine', 'all'], { message: 'Alcance inválido' }).default('mine'),
  kind: kindField.optional(),
  consultationId: consultationIdField.optional(),
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(50, 'La cantidad máxima es 50').default(20)
})

export type DataExportKindInput = z.output<typeof kindField>
export type ConsultationCommentsExportFiltersInput = z.output<typeof ConsultationCommentsExportFiltersSchema>
export type PlatformCommentsExportFiltersInput = z.output<typeof PlatformCommentsExportFiltersSchema>
export type CreateDataExportInput = z.output<typeof CreateDataExportSchema>
export type DataExportsQueryInput = z.output<typeof DataExportsQuerySchema>
