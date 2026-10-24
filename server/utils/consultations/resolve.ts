import { parseConsultationId } from '#shared/utils/consultation-url'

/**
 * Utilidades para resolver una consulta a partir del parámetro de ruta `[id]`
 * del subárbol `/api/consultations/[id]/*`.
 *
 * La API identifica las consultas solo por id: el nombre legible (slug) no es
 * único. Un parámetro no numérico se trata como consulta inexistente (404).
 */

function consultationNotFound() {
  return createError({
    statusCode: 404,
    message: 'Consulta no encontrada'
  })
}

/**
 * Interpreta el parámetro de ruta como id de consulta. Lanza 404 si no es un
 * entero positivo.
 */
export function parseConsultationIdParam(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'id'
): { id: number } {
  const id = parseConsultationId(getRouterParam(event, paramName))
  if (!id) {
    throw consultationNotFound()
  }
  return { id }
}

/**
 * Resuelve una consulta por id. Lanza 404 si no existe.
 */
export async function resolveConsultationById(
  identifier: { id: number },
  include?: Parameters<typeof prisma.consultation.findUnique>[0]['include']
) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: identifier.id },
    include
  })

  if (!consultation) {
    throw consultationNotFound()
  }

  return consultation
}

/**
 * Devuelve el id numérico de la consulta del parámetro de ruta, sin verificar
 * existencia (cada handler resuelve el 404 con su propia lógica de dominio).
 */
export async function resolveConsultationIdFromParam(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'id'
): Promise<number> {
  return parseConsultationIdParam(event, paramName).id
}
