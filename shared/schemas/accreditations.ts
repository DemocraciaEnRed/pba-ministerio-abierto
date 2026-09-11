import * as z from 'zod'

// El DNI se acepta tal como se ingresa: cualquier texto no vacío, sin validar
// formato ni deduplicar. Solo se recorta y se limita el largo.
const accreditationDniField = z
  .string()
  .trim()
  .min(1, 'Ingresá el DNI')
  .max(40, 'El DNI no puede superar los 40 caracteres')

/** Nombre/apellido opcional: cadena vacía se normaliza a `null`. */
const optionalPersonName = z
  .string()
  .trim()
  .max(100, 'Máximo 100 caracteres')
  .transform(value => (value.length ? value : null))
  .nullable()
  .optional()
  .default(null)

/** Correo opcional: cadena vacía se normaliza a `null`; si viene, debe ser válido. */
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .transform(value => (value.length ? value : null))
  .nullable()
  .optional()
  .default(null)
  .refine(value => !value || z.email().safeParse(value).success, 'Correo electrónico inválido')

export const AccreditationEntrySchema = z.object({
  dni: accreditationDniField,
  firstName: optionalPersonName,
  lastName: optionalPersonName,
  email: optionalEmail
})

// Completar (opcionalmente) nombre y apellido de un ingreso ya registrado.
export const AccreditationEntryDetailsSchema = z.object({
  firstName: optionalPersonName,
  lastName: optionalPersonName
})

export const AccreditationEntriesQuerySchema = z.object({
  page: z.coerce.number().int('La página debe ser un entero').min(1, 'La página mínima es 1').default(1),
  perPage: z.coerce.number().int('La cantidad debe ser un entero').min(1, 'La cantidad mínima es 1').max(100, 'La cantidad máxima es 100').default(20)
})

export type AccreditationEntryInput = z.output<typeof AccreditationEntrySchema>
export type AccreditationEntryDetailsInput = z.output<typeof AccreditationEntryDetailsSchema>
export type AccreditationEntriesQueryInput = z.output<typeof AccreditationEntriesQuerySchema>
