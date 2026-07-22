import * as z from 'zod'

const mediaTypeValues = ['image', 'document', 'video', 'audio', 'other'] as const
const assetOwnerTypeValues = ['consultation', 'topic', 'closure'] as const
const assetLinkRoleValues = ['cover', 'attachment', 'context', 'gallery'] as const

type MediaTypeInput = (typeof mediaTypeValues)[number]
type AssetOwnerTypeInput = (typeof assetOwnerTypeValues)[number]
type AssetLinkRoleInput = (typeof assetLinkRoleValues)[number]

const optionalTitleField = z
  .string()
  .trim()
  .min(1, 'El título no puede estar vacío')
  .max(180, 'El título no puede superar los 180 caracteres')
  .nullable()
  .optional()

const optionalDescriptionField = z
  .string()
  .trim()
  .max(4000, 'La descripción no puede superar los 4000 caracteres')
  .nullable()
  .optional()

const optionalAltTextField = z
  .string()
  .trim()
  .max(250, 'El texto alternativo no puede superar los 250 caracteres')
  .nullable()
  .optional()

const mediaTypeField = z
  .string()
  .trim()
  .refine((value): value is MediaTypeInput => mediaTypeValues.includes(value as MediaTypeInput), 'Tipo de medio inválido')
  .transform(value => value as MediaTypeInput)

const ownerTypeField = z
  .string()
  .trim()
  .refine((value): value is AssetOwnerTypeInput => assetOwnerTypeValues.includes(value as AssetOwnerTypeInput), 'Tipo de entidad inválido')
  .transform(value => value as AssetOwnerTypeInput)

const linkRoleField = z
  .string()
  .trim()
  .refine((value): value is AssetLinkRoleInput => assetLinkRoleValues.includes(value as AssetLinkRoleInput), 'Rol de vínculo inválido')
  .transform(value => value as AssetLinkRoleInput)

export const UploadedAssetMetadataSchema = z.object({
  title: optionalTitleField,
  description: optionalDescriptionField,
  altText: optionalAltTextField,
  mediaType: mediaTypeField.optional()
})

export const CreateExternalAssetSchema = z.object({
  title: optionalTitleField,
  description: optionalDescriptionField,
  externalUrl: z
    .string()
    .trim()
    .min(1, 'La URL externa es requerida')
    .url('La URL externa es inválida'),
  mediaType: mediaTypeField
})

export const CreateAssetLinkSchema = z.object({
  assetId: z.int().positive('El asset debe ser un ID válido'),
  ownerType: ownerTypeField,
  ownerId: z.int().positive('La entidad dueña debe ser un ID válido'),
  role: linkRoleField,
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').default(0),
  isPublic: z.boolean().default(true)
})

export const PatchAssetLinkSchema = z.object({
  role: linkRoleField.optional(),
  displayOrder: z.int().min(0, 'El orden no puede ser negativo').optional(),
  isPublic: z.boolean().optional()
}).refine(
  value => value.role !== undefined || value.displayOrder !== undefined || value.isPublic !== undefined,
  'Debés enviar al menos un campo para actualizar'
)

export type UploadedAssetMetadataInput = z.output<typeof UploadedAssetMetadataSchema>
export type CreateExternalAssetInput = z.output<typeof CreateExternalAssetSchema>
export type CreateAssetLinkInput = z.output<typeof CreateAssetLinkSchema>
export type PatchAssetLinkInput = z.output<typeof PatchAssetLinkSchema>
