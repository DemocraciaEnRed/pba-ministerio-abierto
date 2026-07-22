import * as z from 'zod'

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Correo electrónico inválido'))

const logoAssetField = z.int().positive('El logo debe ser un ID válido').nullable()

export const UpdatePlatformSettingsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(150, 'El nombre no puede superar los 150 caracteres'),
  platformName: z.string().trim().min(1, 'El nombre de la plataforma no puede estar vacío').max(150, 'El nombre de la plataforma no puede superar los 150 caracteres').nullable(),
  logoLightAssetId: logoAssetField,
  logoDarkAssetId: logoAssetField,
  symbolLightAssetId: logoAssetField,
  symbolDarkAssetId: logoAssetField,
  contactEmail: emailField.nullable()
})

export type UpdatePlatformSettingsInput = z.output<typeof UpdatePlatformSettingsSchema>
