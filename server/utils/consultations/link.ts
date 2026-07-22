/**
 * Resuelve el enlace relacionado a partir del parámetro de ruta `linkId`,
 * validando que exista y pertenezca a la consulta indicada.
 */
export async function resolveConsultationLink(
  event: Parameters<typeof getRouterParam>[0],
  consultationId: number
) {
  const rawValue = getRouterParam(event, 'linkId')
  const linkId = Number(rawValue)

  if (!Number.isInteger(linkId) || linkId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'El identificador del enlace es inválido'
    })
  }

  const link = await prisma.consultationRelatedLink.findUnique({
    where: { id: linkId }
  })

  if (!link || link.consultationId !== consultationId) {
    throw createError({
      statusCode: 404,
      message: 'Enlace no encontrado'
    })
  }

  return link
}
