import * as z from 'zod'

const coverAltTextField = z
  .string()
  .trim()
  .max(250, 'El texto alternativo no puede superar los 250 caracteres')
  .nullable()

/**
 * Actualiza los metadatos de la portada existente (por ahora solo el texto
 * alternativo) sin reemplazar la imagen. La subida/reemplazo de la imagen usa
 * `multipart/form-data`, no este esquema.
 */
export const UpdateCoverSchema = z.object({
  altText: coverAltTextField
})

export type UpdateCoverInput = z.output<typeof UpdateCoverSchema>
