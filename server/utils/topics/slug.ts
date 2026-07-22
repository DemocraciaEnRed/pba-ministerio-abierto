/**
 * Topic slug/ID resolution utilities.
 * Since slugs are unique per (consultationId, slug) pair,
 * all topic lookups require consultation context.
 */

/**
 * Parse router parameter to identify a topic by ID or slug.
 * Returns the parsed identifier; caller must use in context of a consultation.
 */
export function parseTopicSlugOrId(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'topicSlugOrId'
): { id?: number, slug?: string } {
  const rawValue = getRouterParam(event, paramName)
  if (!rawValue) {
    throw createError({
      statusCode: 400,
      message: 'El identificador de tema es requerido'
    })
  }

  const maybeId = Number(rawValue)
  if (Number.isInteger(maybeId) && maybeId > 0) {
    return { id: maybeId }
  }

  return { slug: rawValue }
}

/**
 * Resolve a topic by ID or slug within a consultation.
 * Throws 404 if not found.
 */
export async function resolveTopicBySlugOrId(
  consultationId: number,
  identifier: { id?: number, slug?: string },
  include?: Parameters<typeof prisma.topic.findUnique>[0]['include']
) {
  const topic = identifier.id
    ? await prisma.topic.findUnique({
        where: { id: identifier.id },
        include
      })
    : await prisma.topic.findUnique({
        where: {
          consultationId_slug: {
            consultationId,
            slug: identifier.slug!
          }
        },
        include
      })

  if (!topic) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  return topic
}

/**
 * Resuelve el id numérico de un tema a partir del parámetro de ruta, aceptando
 * tanto un id como un slug, dentro del contexto de una consulta.
 *
 * - Si el parámetro es un id numérico, lo devuelve sin verificar existencia
 *   (el handler resolverá el 404 con su propia lógica de dominio, igual que
 *   hacía `parsePositiveIntParam`).
 * - Si el parámetro es un slug, hace una búsqueda liviana dentro de la consulta
 *   para obtener el id y lanza 404 si no existe.
 */
export async function resolveTopicIdFromParam(
  event: Parameters<typeof getRouterParam>[0],
  consultationId: number,
  paramName: string = 'topicSlugOrId'
): Promise<number> {
  const identifier = parseTopicSlugOrId(event, paramName)
  if (identifier.id) {
    return identifier.id
  }

  const topic = await prisma.topic.findUnique({
    where: {
      consultationId_slug: {
        consultationId,
        slug: identifier.slug!
      }
    },
    select: { id: true }
  })

  if (!topic) {
    throw createError({
      statusCode: 404,
      message: 'Tema no encontrado'
    })
  }

  return topic.id
}
