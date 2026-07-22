import * as z from 'zod'

const labelField = z
  .string()
  .trim()
  .min(1, 'El texto del enlace es requerido')
  .max(120, 'El texto del enlace no puede superar los 120 caracteres')

const urlField = z
  .string()
  .trim()
  .min(1, 'La URL es requerida')
  .max(2048, 'La URL no puede superar los 2048 caracteres')
  .pipe(z.url('La URL debe ser válida (incluí http:// o https://)'))

const displayOrderField = z
  .number()
  .int('El orden debe ser un entero')
  .min(0, 'El orden no puede ser negativo')

export const CreateConsultationLinkSchema = z.object({
  label: labelField,
  url: urlField,
  displayOrder: displayOrderField.default(0)
})

export const UpdateConsultationLinkSchema = z.object({
  label: labelField,
  url: urlField,
  displayOrder: displayOrderField
})

export type CreateConsultationLinkInput = z.output<typeof CreateConsultationLinkSchema>
export type UpdateConsultationLinkInput = z.output<typeof UpdateConsultationLinkSchema>
