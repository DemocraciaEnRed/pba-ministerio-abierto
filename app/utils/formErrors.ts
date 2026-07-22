import type { FormError } from '@nuxt/ui'

interface ServerFieldError {
  field: string
  message: string
}

interface FetchLikeError {
  statusCode?: number
  status?: number
  data?: {
    statusCode?: number
    message?: string
    data?: ServerFieldError[]
  }
}

interface FormLike {
  setErrors: (errors: FormError[]) => void
}

/**
 * Aplica los errores de validación del backend (422) sobre un `UForm` para que
 * se muestren inline junto a cada campo.
 *
 * El backend responde con `data: [{ field, message }]` (ver server/utils/validate.ts).
 *
 * @returns `true` si eran errores de validación y se aplicaron; `false` en caso
 * contrario, para que quien llama muestre un toast genérico.
 */
export function applyServerErrors(form: FormLike | null | undefined, error: unknown): boolean {
  const e = error as FetchLikeError | null
  const statusCode = e?.statusCode ?? e?.status ?? e?.data?.statusCode
  const fieldErrors = e?.data?.data

  if (statusCode !== 422 || !Array.isArray(fieldErrors) || fieldErrors.length === 0 || !form) {
    return false
  }

  form.setErrors(
    fieldErrors.map(fieldError => ({
      name: fieldError.field,
      message: fieldError.message
    }))
  )

  return true
}

/** Extrae un mensaje legible de un error de `$fetch` para mostrar en un toast. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  const e = error as { data?: { message?: string }, message?: string } | null
  return e?.data?.message || e?.message || fallback
}
