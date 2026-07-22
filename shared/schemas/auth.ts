import * as z from 'zod'
import {
  SOCIAL_PLATFORM_KEYS,
  isValidSocialHandle,
  normalizeSocialHandle
} from '#shared/social/platforms'
import {
  BUENOS_AIRES,
  PROVINCES,
  isValidBuenosAiresMunicipality
} from '#shared/data/argentina'

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo electrónico inválido'))

/** Campo de texto opcional que convierte cadenas vacías en `null`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform(value => (value.length ? value : null))
    .nullable()
    .optional()

/**
 * Teléfono argentino. El prefijo `+54` se asume fijo (se muestra en el form),
 * así que solo se ingresan código de área y número. Se normaliza quitando
 * separadores y se guarda en formato `+54XXXXXXXXXX`.
 */
const phoneField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu número de teléfono')
  .transform(value => value.replace(/[\s()+.-]/g, ''))
  .pipe(
    z
      .string()
      .regex(/^\d{8,13}$/, 'Ingresá un teléfono válido: código de área y número')
  )
  .transform(value => `+54${value}`)

const socialLinksField = z
  .array(
    z.object({
      platform: z.enum(SOCIAL_PLATFORM_KEYS),
      handle: z.string().trim().min(1, 'Ingresá tu usuario').max(255, 'Máximo 255 caracteres')
    })
  )
  .max(SOCIAL_PLATFORM_KEYS.length, 'Demasiadas redes sociales')
  .superRefine((links, ctx) => {
    const seen = new Set<string>()
    links.forEach((link, index) => {
      if (seen.has(link.platform)) {
        ctx.addIssue({ code: 'custom', path: [index, 'platform'], message: 'Red social duplicada' })
      }
      seen.add(link.platform)

      const handle = normalizeSocialHandle(link.handle)
      if (!handle) {
        ctx.addIssue({ code: 'custom', path: [index, 'handle'], message: 'Ingresá tu usuario' })
        return
      }
      if (!isValidSocialHandle(link.platform, handle)) {
        ctx.addIssue({ code: 'custom', path: [index, 'handle'], message: 'El usuario no es válido para esta red' })
      }
    })
  })
  .transform(links =>
    links.map(link => ({ platform: link.platform, handle: normalizeSocialHandle(link.handle) }))
  )

export const LoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'La contraseña es requerida')
})

export const RegisterSchema = z
  .object({
    email: emailField,
    password: z.string().min(8, 'Debe tener al menos 8 caracteres').max(72, 'Máximo 72 caracteres'),
    firstName: z.string().trim().min(1, 'Ingresá tu nombre').max(100, 'Máximo 100 caracteres'),
    lastName: z.string().trim().min(1, 'Ingresá tu apellido').max(100, 'Máximo 100 caracteres'),
    provincia: z.enum(PROVINCES, { message: 'Elegí tu provincia' }),
    municipio: optionalText(120),
    phone: phoneField,
    representsInstitution: z.boolean(),
    organization: optionalText(120)
  })
  .superRefine((data, ctx) => {
    if (data.representsInstitution && !data.organization) {
      ctx.addIssue({
        code: 'custom',
        path: ['organization'],
        message: 'Ingresá el nombre de la institución u organización'
      })
    }

    // El municipio solo es obligatorio (y validado contra la lista) cuando la
    // provincia es Buenos Aires. Para el resto se ignora (se guarda como null).
    if (data.provincia === BUENOS_AIRES) {
      if (!data.municipio) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Elegí tu municipio' })
      } else if (!isValidBuenosAiresMunicipality(data.municipio)) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Municipio inválido' })
      }
    }
  })

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresá tu nombre').max(100, 'Máximo 100 caracteres').optional(),
  lastName: z.string().trim().min(1, 'Ingresá tu apellido').max(100, 'Máximo 100 caracteres').optional(),
  displayName: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres').optional(),
  organization: optionalText(120),
  profession: optionalText(120),
  aboutMe: optionalText(2000),
  socialLinks: socialLinksField.optional()
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'Debe tener al menos 8 caracteres').max(72, 'Máximo 72 caracteres')
})

export const RequestEmailChangeSchema = z.object({
  newEmail: emailField,
  currentPassword: z.string().min(1, 'La contraseña actual es requerida')
})

export const ConfirmEmailChangeSchema = z.object({
  token: z.string().min(1)
})

export const VerifyEmailSchema = z.object({
  token: z.string().min(1)
})

export const ResendVerificationSchema = z.object({
  email: emailField
})

export const RequestPasswordResetSchema = z.object({
  email: emailField
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Debe tener al menos 8 caracteres').max(72, 'Máximo 72 caracteres')
})

export type LoginInput = z.output<typeof LoginSchema>
export type RegisterInput = z.output<typeof RegisterSchema>
export type UpdateProfileInput = z.output<typeof UpdateProfileSchema>
export type ChangePasswordInput = z.output<typeof ChangePasswordSchema>
export type RequestEmailChangeInput = z.output<typeof RequestEmailChangeSchema>
export type ConfirmEmailChangeInput = z.output<typeof ConfirmEmailChangeSchema>
export type VerifyEmailInput = z.output<typeof VerifyEmailSchema>
export type ResendVerificationInput = z.output<typeof ResendVerificationSchema>
export type RequestPasswordResetInput = z.output<typeof RequestPasswordResetSchema>
export type ResetPasswordInput = z.output<typeof ResetPasswordSchema>
