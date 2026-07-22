import * as z from 'zod'

const titleField = z
  .string()
  .trim()
  .max(180, 'El título no puede superar los 180 caracteres')
  .nullable()
  .transform(value => (value && value.length > 0 ? value : null))

const displayOrderField = z
  .int('El orden debe ser un entero')
  .min(0, 'El orden no puede ser negativo')

/**
 * Cuerpo JSON para editar un archivo adjunto ya subido. El archivo en sí no se
 * reemplaza: solo se editan el título, el orden y la visibilidad pública.
 */
export const UpdateAttachmentSchema = z.object({
  title: titleField,
  displayOrder: displayOrderField,
  isPublic: z.boolean()
})

export type UpdateAttachmentInput = z.output<typeof UpdateAttachmentSchema>
