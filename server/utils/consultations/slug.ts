/**
 * Utilidades para resolver una consulta por slug o id.
 * El parámetro de ruta se llama `slugOrId` de forma uniforme en todo el
 * subárbol `/api/consultations/[slugOrId]/*`, por lo que su valor puede ser
 * un id numérico o un slug.
 */

/**
 * Interpreta el parámetro de ruta como id numérico o slug.
 */
export function parseConsultationSlugOrId(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'slugOrId'
): { id?: number, slug?: string } {
  const rawValue = getRouterParam(event, paramName)
  if (!rawValue) {
    throw createError({
      statusCode: 400,
      message: 'El identificador de consulta es requerido'
    })
  }

  const maybeId = Number(rawValue)
  if (Number.isInteger(maybeId) && maybeId > 0) {
    return { id: maybeId }
  }

  return { slug: rawValue }
}

/**
 * Resuelve una consulta por id o slug. Lanza 404 si no existe.
 */
export async function resolveConsultationBySlugOrId(
  identifier: { id?: number, slug?: string },
  include?: Parameters<typeof prisma.consultation.findUnique>[0]['include']
) {
  const consultation = identifier.id
    ? await prisma.consultation.findUnique({
        where: { id: identifier.id },
        include
      })
    : await prisma.consultation.findUnique({
        where: { slug: identifier.slug! },
        include
      })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  return consultation
}

/**
 * Resuelve el id numérico de una consulta a partir del parámetro de ruta,
 * aceptando tanto un id como un slug.
 *
 * - Si el parámetro es un id numérico, lo devuelve sin verificar existencia
 *   (el handler resolverá el 404 con su propia lógica de dominio, igual que
 *   hacía `parsePositiveIntParam`).
 * - Si el parámetro es un slug, hace una búsqueda liviana para obtener el id y
 *   lanza 404 si no existe (única forma de traducir slug → id).
 */
export async function resolveConsultationIdFromParam(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'slugOrId'
): Promise<number> {
  const identifier = parseConsultationSlugOrId(event, paramName)
  if (identifier.id) {
    return identifier.id
  }

  const consultation = await prisma.consultation.findUnique({
    where: { slug: identifier.slug! },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({
      statusCode: 404,
      message: 'Consulta no encontrada'
    })
  }

  return consultation.id
}
