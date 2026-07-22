import * as z from 'zod'

const slugField = z
  .string()
  .trim()
  .min(1, 'El slug es requerido')
  .max(120, 'El slug no puede superar los 120 caracteres')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones')

const nameField = z
  .string()
  .trim()
  .min(1, 'El nombre es requerido')
  .max(120, 'El nombre no puede superar los 120 caracteres')

const descriptionField = z
  .string()
  .trim()
  .max(1000, 'La descripción no puede superar los 1000 caracteres')
  .nullable()

const sectionIdField = z.int().positive('La sección debe ser un ID válido')

export const CreateSectionSchema = z.object({
  slug: slugField,
  name: nameField,
  description: descriptionField,
  isActive: z.boolean().default(true),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0)
})

export const UpdateSectionSchema = z.object({
  slug: slugField,
  name: nameField,
  description: descriptionField
})

export const PatchSectionSchema = z.object({
  isActive: z.boolean().optional(),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').optional()
}).refine(
  value => value.isActive !== undefined || value.displayOrder !== undefined,
  'Debés enviar al menos un campo para actualizar'
)

export const CreateCategorySchema = z.object({
  sectionId: sectionIdField,
  slug: slugField,
  name: nameField,
  description: descriptionField,
  isActive: z.boolean().default(true),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0)
})

export const UpdateCategorySchema = z.object({
  sectionId: sectionIdField,
  slug: slugField,
  name: nameField,
  description: descriptionField
})

export const PatchCategorySchema = z.object({
  isActive: z.boolean().optional(),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').optional()
}).refine(
  value => value.isActive !== undefined || value.displayOrder !== undefined,
  'Debés enviar al menos un campo para actualizar'
)

export const CategoriesQuerySchema = z.object({
  sectionSlug: slugField.optional()
})

export const CreateTagSchema = z.object({
  slug: slugField,
  name: nameField,
  description: descriptionField,
  isActive: z.boolean().default(true)
})

export const UpdateTagSchema = z.object({
  slug: slugField,
  name: nameField,
  description: descriptionField,
  isActive: z.boolean()
})

export type CreateSectionInput = z.output<typeof CreateSectionSchema>
export type UpdateSectionInput = z.output<typeof UpdateSectionSchema>
export type PatchSectionInput = z.output<typeof PatchSectionSchema>
export type CreateCategoryInput = z.output<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.output<typeof UpdateCategorySchema>
export type PatchCategoryInput = z.output<typeof PatchCategorySchema>
export type CategoriesQueryInput = z.output<typeof CategoriesQuerySchema>
export type CreateTagInput = z.output<typeof CreateTagSchema>
export type UpdateTagInput = z.output<typeof UpdateTagSchema>
