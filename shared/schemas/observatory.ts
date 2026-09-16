import * as z from 'zod'
import {
  BUENOS_AIRES,
  PROVINCES,
  isValidBuenosAiresMunicipality
} from '#shared/data/argentina'
import { emailField, phoneField, optionalText } from '#shared/schemas/auth'
import { isValidYoutubeUrl } from '#shared/utils/youtube'

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
  .max(180, 'El nombre no puede superar los 180 caracteres')

const displayOrderField = z.int().min(0, 'El orden no puede ser negativo')

const categoryIdField = z.int().positive('La categoría debe ser un ID válido')

const logoAssetIdField = z.int().positive('El logo debe ser un ID válido').nullable()

const websiteUrlField = z
  .string()
  .trim()
  .max(500, 'El enlace no puede superar los 500 caracteres')
  .nullable()
  .transform(value => (value ? value : null))
  .refine(
    value => value === null || z.url().safeParse(value).success,
    'Ingresá un enlace válido (debe empezar con http:// o https://)'
  )

// --- Catálogo de instituciones (ABM de platform-admin) ---

export const CreateObservatoryInstitutionCategorySchema = z.object({
  slug: slugField,
  name: nameField,
  isActive: z.boolean().default(true),
  displayOrder: displayOrderField.default(0)
})

export const PatchObservatoryInstitutionCategorySchema = z
  .object({
    slug: slugField.optional(),
    name: nameField.optional(),
    isActive: z.boolean().optional(),
    displayOrder: displayOrderField.optional()
  })
  .refine(
    value => Object.values(value).some(field => field !== undefined),
    'Debés enviar al menos un campo para actualizar'
  )

export const CreateObservatoryInstitutionSchema = z.object({
  categoryId: categoryIdField,
  slug: slugField,
  name: nameField,
  logoAssetId: logoAssetIdField.default(null),
  websiteUrl: websiteUrlField.default(null),
  isActive: z.boolean().default(true),
  displayOrder: displayOrderField.default(0)
})

export const PatchObservatoryInstitutionSchema = z
  .object({
    categoryId: categoryIdField.optional(),
    slug: slugField.optional(),
    name: nameField.optional(),
    logoAssetId: logoAssetIdField.optional(),
    websiteUrl: websiteUrlField.optional(),
    isActive: z.boolean().optional(),
    displayOrder: displayOrderField.optional()
  })
  .refine(
    value => Object.values(value).some(field => field !== undefined),
    'Debés enviar al menos un campo para actualizar'
  )

// --- Publicaciones (ABM de platform-admin, borrado real) ---

const publicationTitleField = z
  .string()
  .trim()
  .min(1, 'El título es requerido')
  .max(200, 'El título no puede superar los 200 caracteres')

const publicationYearField = z
  .int('El año debe ser un número entero')
  .min(1900, 'El año debe ser mayor a 1900')
  .max(2100, 'El año no puede superar 2100')

const coverAssetIdField = z.int('La portada debe ser un ID válido').positive('La portada debe ser un ID válido').nullable()

const documentAssetIdField = z.int().positive('El documento debe ser un ID válido').nullable()

const downloadUrlField = z
  .string()
  .trim()
  .max(500, 'El enlace no puede superar los 500 caracteres')
  .nullable()
  .transform(value => (value ? value : null))
  .refine(
    value => value === null || z.url().safeParse(value).success,
    'Ingresá un enlace válido (debe empezar con http:// o https://)'
  )

// Regla de negocio: la descarga sale de un PDF subido o de una URL externa.
// Se exige exactamente una de las dos.
function assertCoverRequired(
  coverAssetId: number | null | undefined,
  ctx: z.RefinementCtx
) {
  if (coverAssetId == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['coverAssetId'],
      message: 'La portada es requerida'
    })
  }
}

function assertSingleDownloadSource(
  documentAssetId: number | null | undefined,
  externalUrl: string | null | undefined,
  ctx: z.RefinementCtx
) {
  const hasDocument = documentAssetId != null
  const hasUrl = externalUrl != null

  if (!hasDocument && !hasUrl) {
    ctx.addIssue({
      code: 'custom',
      path: ['documentAssetId'],
      message: 'Subí un PDF o ingresá una URL de descarga'
    })
  }

  if (hasDocument && hasUrl) {
    ctx.addIssue({
      code: 'custom',
      path: ['externalUrl'],
      message: 'Elegí una sola opción: PDF subido o URL de descarga'
    })
  }
}

export const CreateObservatoryPublicationSchema = z
  .object({
    title: publicationTitleField,
    description: optionalText(5000),
    publicationYear: publicationYearField,
    coverAssetId: coverAssetIdField.default(null),
    documentAssetId: documentAssetIdField.default(null),
    externalUrl: downloadUrlField.default(null),
    isActive: z.boolean().default(true),
    displayOrder: displayOrderField.default(0)
  })
  .superRefine((data, ctx) => {
    assertCoverRequired(data.coverAssetId, ctx)
    assertSingleDownloadSource(data.documentAssetId, data.externalUrl, ctx)
  })

export const PatchObservatoryPublicationSchema = z
  .object({
    title: publicationTitleField.optional(),
    description: optionalText(5000),
    publicationYear: publicationYearField.optional(),
    coverAssetId: coverAssetIdField.unwrap().optional(),
    documentAssetId: documentAssetIdField.optional(),
    externalUrl: downloadUrlField.optional(),
    isActive: z.boolean().optional(),
    displayOrder: displayOrderField.optional()
  })
  .refine(
    value => Object.values(value).some(field => field !== undefined),
    'Debés enviar al menos un campo para actualizar'
  )
  .superRefine((data, ctx) => {
    // En el PATCH solo controlamos que no lleguen ambas fuentes a la vez; el
    // handler resuelve el estado final (limpia la fuente que no se usa).
    if (data.documentAssetId != null && data.externalUrl != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['externalUrl'],
        message: 'Elegí una sola opción: PDF subido o URL de descarga'
      })
    }
  })

// --- Registro audiovisual (ABM de platform-admin, borrado real) ---

const youtubeUrlField = z
  .string()
  .trim()
  .min(1, 'Ingresá el enlace del video')
  .max(500, 'El enlace no puede superar los 500 caracteres')
  .refine(isValidYoutubeUrl, 'Ingresá un enlace válido de YouTube')

const videoDateField = z
  .string()
  .trim()
  .nullable()
  .transform(value => (value ? value : null))
  .refine(
    value => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Ingresá una fecha válida (AAAA-MM-DD)'
  )

export const CreateObservatoryVideoSchema = z.object({
  title: publicationTitleField,
  youtubeUrl: youtubeUrlField,
  videoDate: videoDateField.default(null),
  isActive: z.boolean().default(true),
  displayOrder: displayOrderField.default(0)
})

export const PatchObservatoryVideoSchema = z
  .object({
    title: publicationTitleField.optional(),
    youtubeUrl: youtubeUrlField.optional(),
    videoDate: videoDateField.optional(),
    isActive: z.boolean().optional(),
    displayOrder: displayOrderField.optional()
  })
  .refine(
    value => Object.values(value).some(field => field !== undefined),
    'Debés enviar al menos un campo para actualizar'
  )

// --- Métricas de alcance (catálogo fijo de platform-admin) ---

const metricLabelField = z
  .string()
  .trim()
  .min(1, 'La etiqueta es requerida')
  .max(80, 'La etiqueta no puede superar los 80 caracteres')

const metricValueField = z
  .string()
  .trim()
  .min(1, 'El valor es requerido')
  .max(20, 'El valor no puede superar los 20 caracteres')

export const UpdateObservatoryMetricSchema = z.object({
  label: metricLabelField,
  value: metricValueField
})

// --- Aportes (formulario público) ---

const firstNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu nombre')
  .max(100, 'Máximo 100 caracteres')

const lastNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu apellido')
  .max(100, 'Máximo 100 caracteres')

const provinciaField = z.enum(PROVINCES, { message: 'Elegí tu provincia' })

const contributionLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Ingresá un enlace')
    .max(2000, 'El enlace no puede superar los 2000 caracteres')
    .pipe(z.url('Ingresá un enlace válido (debe empezar con http:// o https://)')),
  title: optionalText(160)
})

export const ObservatoryContributionLinkSchema = contributionLinkSchema

export const ObservatoryContributionsQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export const CreateObservatoryContributionSchema = z
  .object({
    firstName: firstNameField,
    lastName: lastNameField,
    email: emailField,
    phone: phoneField,
    provincia: provinciaField,
    municipio: optionalText(120),
    institutionId: z.int({ error: 'Elegí tu institución' }).positive('Elegí tu institución'),
    workGroupIds: z
      .array(z.int().positive('El eje de trabajo debe ser un ID válido'))
      .min(1, 'Elegí al menos un eje de trabajo'),
    description: optionalText(5000),
    enlaces: z.array(contributionLinkSchema).max(20, 'No podés agregar más de 20 enlaces').default([]),
    /// El archivo viaja aparte del JSON (multipart). Este flag permite validar en
    /// el formulario que haya al menos un contenido; el server lo re-verifica
    /// contra el archivo real recibido.
    hasAttachment: z.boolean().default(false),
    // Campo trampa (honeypot): las personas no lo ven, los bots suelen completarlo.
    website: z.string().optional()
  })
  .superRefine((data, ctx) => {
    // El municipio solo es obligatorio (y validado contra la lista) cuando la
    // provincia es Buenos Aires. Para el resto se ignora (se guarda como null).
    if (data.provincia === BUENOS_AIRES) {
      if (!data.municipio) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Elegí tu municipio' })
      } else if (!isValidBuenosAiresMunicipality(data.municipio)) {
        ctx.addIssue({ code: 'custom', path: ['municipio'], message: 'Municipio inválido' })
      }
    }

    // Un aporte necesita contenido: la descripción es opcional, pero entonces
    // tiene que venir acompañada de un archivo adjunto o de un enlace.
    if (!data.description && !data.hasAttachment && data.enlaces.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Describí tu aporte o adjuntá un archivo o enlace'
      })
    }
  })

export type CreateObservatoryInstitutionCategoryInput = z.output<typeof CreateObservatoryInstitutionCategorySchema>
export type PatchObservatoryInstitutionCategoryInput = z.output<typeof PatchObservatoryInstitutionCategorySchema>
export type CreateObservatoryInstitutionInput = z.output<typeof CreateObservatoryInstitutionSchema>
export type PatchObservatoryInstitutionInput = z.output<typeof PatchObservatoryInstitutionSchema>
export type CreateObservatoryPublicationInput = z.output<typeof CreateObservatoryPublicationSchema>
export type PatchObservatoryPublicationInput = z.output<typeof PatchObservatoryPublicationSchema>
export type CreateObservatoryVideoInput = z.output<typeof CreateObservatoryVideoSchema>
export type PatchObservatoryVideoInput = z.output<typeof PatchObservatoryVideoSchema>
export type UpdateObservatoryMetricInput = z.output<typeof UpdateObservatoryMetricSchema>
export type ObservatoryContributionLinkInput = z.output<typeof ObservatoryContributionLinkSchema>
export type ObservatoryContributionsQueryInput = z.output<typeof ObservatoryContributionsQuerySchema>
export type CreateObservatoryContributionInput = z.output<typeof CreateObservatoryContributionSchema>
