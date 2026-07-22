import * as z from 'zod'

const slugField = z
  .string()
  .trim()
  .min(1, 'El slug es requerido')
  .max(120, 'El slug no puede superar los 120 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones')

const pageKeyField = z
  .string()
  .trim()
  .min(1, 'La clave de página es requerida')
  .max(120, 'La clave de página no puede superar los 120 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'La clave de página solo puede tener minúsculas, números y guiones')

const titleField = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(180, 'El título no puede superar los 180 caracteres')

export const CreatePageSchema = z.object({
  pageKey: pageKeyField,
  title: titleField,
  slug: slugField,
  content: z.string().trim().max(100000, 'El contenido no puede superar los 100000 caracteres').nullable(),
  isPublished: z.boolean()
})

export const UpdatePageSchema = z.object({
  title: titleField,
  slug: slugField,
  content: z.string().trim().max(100000, 'El contenido no puede superar los 100000 caracteres').nullable(),
  isPublished: z.boolean()
})

export type CreatePageInput = z.output<typeof CreatePageSchema>
export type UpdatePageInput = z.output<typeof UpdatePageSchema>
