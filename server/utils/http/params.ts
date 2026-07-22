import type { H3Event } from 'h3'

export function parsePositiveIntParam(event: H3Event, paramName: string, resourceName: string): number {
  const rawId = getRouterParam(event, paramName)
  const id = Number(rawId)

  if (!rawId || !Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `El id de ${resourceName} es inválido`
    })
  }

  return id
}
