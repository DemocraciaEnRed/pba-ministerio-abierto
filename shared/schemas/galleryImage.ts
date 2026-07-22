import * as z from 'zod'

const titleField = z
  .string()
  .trim()
  .max(180, 'El epígrafe no puede superar los 180 caracteres')
  .nullable()
  .transform(value => (value && value.length > 0 ? value : null))

const altTextField = z
  .string()
  .trim()
  .max(250, 'El texto alternativo no puede superar los 250 caracteres')
  .nullable()
  .transform(value => (value && value.length > 0 ? value : null))

const descriptionField = z
  .string()
  .trim()
  .max(4000, 'La descripción no puede superar los 4000 caracteres')
  .nullable()
  .transform(value => (value && value.length > 0 ? value : null))

const displayOrderField = z
  .int('El orden debe ser un entero')
  .min(0, 'El orden no puede ser negativo')

/**
 * Cuerpo JSON para editar una imagen de galería ya subida. La imagen en sí no
 * se reemplaza: solo se editan el epígrafe, el texto alternativo, la
 * descripción, el orden y la visibilidad pública.
 */
export const UpdateGalleryImageSchema = z.object({
  title: titleField,
  altText: altTextField,
  description: descriptionField,
  displayOrder: displayOrderField,
  isPublic: z.boolean()
})

export type UpdateGalleryImageInput = z.output<typeof UpdateGalleryImageSchema>
