import * as z from 'zod'

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo electrónico inválido'))

/**
 * Alta de un administrador vía el endpoint oculto de bootstrap.
 * `secret` se compara contra NUXT_ADMIN_BOOTSTRAP_SECRET en el handler;
 * si no coincide, el endpoint responde 404 (finge no existir).
 */
export const BootstrapAdminSchema = z.object({
  secret: z.string().min(1, 'El secreto es requerido'),
  email: emailField,
  password: z
    .string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
  firstName: z.string().trim().min(1, 'Ingresá el nombre').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().trim().min(1, 'Ingresá el apellido').max(100, 'Máximo 100 caracteres'),
  role: z.enum(['platform_admin', 'collaborator'], { message: 'Rol inválido' })
})

export type BootstrapAdminInput = z.output<typeof BootstrapAdminSchema>
