import type { ZodType, ZodError } from 'zod'
import type { H3Event } from 'h3'

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
      message: 'Validation error',
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
      message: 'Validation error',
      data: formatZodError(result.error)
    })
  }
  return result.data
}
