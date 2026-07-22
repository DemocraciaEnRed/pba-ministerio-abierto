import * as z from 'zod'

const queryTextField = z
  .string()
  .trim()
  .max(120, 'El texto de búsqueda no puede superar los 120 caracteres')

export const UsersQuerySchema = z.object({
  q: queryTextField.optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  role: z.enum(['platform_admin', 'collaborator']).optional(),
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
})

export const AssignPlatformRoleSchema = z.object({
  role: z.enum(['platform_admin', 'collaborator'], {
    message: 'El rol de plataforma es inválido'
  })
})

export type UsersQueryInput = z.output<typeof UsersQuerySchema>
export type UpdateUserStatusInput = z.output<typeof UpdateUserStatusSchema>
export type AssignPlatformRoleInput = z.output<typeof AssignPlatformRoleSchema>
