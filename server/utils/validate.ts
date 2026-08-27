import type { ZodType, ZodError } from 'zod'
import type { H3Event } from 'h3'

/**
 * Mensaje genérico (en español) para las respuestas 422 de validación.
 * Se comparte en todos los handlers para evitar cadenas duplicadas y drift.
 */
export const VALIDATION_ERROR_MESSAGE = 'Error de validación'

function formatZodError(error: ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message
  }))
}

export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: formatZodError(result.error)
    })
  }
  return result.data
}

export async function parseQuery<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const query = getQuery(event)
  const result = schema.safeParse(query)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: formatZodError(result.error)
    })
  }
  return result.data
}

/**
 * Valida un objeto ya materializado (p. ej. campos extraídos de un multipart)
 * con el mismo formato de error 422 que `parseBody`/`parseQuery`.
 */
export function parseData<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: formatZodError(result.error)
    })
  }
  return result.data
}
