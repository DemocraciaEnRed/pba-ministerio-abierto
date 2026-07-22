/**
 * Resuelve el enlace relacionado de un tema a partir del parámetro de ruta
 * `linkId`, validando que exista y pertenezca al tema indicado.
 */
export async function resolveTopicLink(
  event: Parameters<typeof getRouterParam>[0],
  topicId: number
) {
  const rawValue = getRouterParam(event, 'linkId')
  const linkId = Number(rawValue)

  if (!Number.isInteger(linkId) || linkId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'El identificador del enlace es inválido'
    })
  }

  const link = await prisma.topicRelatedLink.findUnique({
    where: { id: linkId }
  })

  if (!link || link.topicId !== topicId) {
    throw createError({
      statusCode: 404,
      message: 'Enlace no encontrado'
    })
  }

  return link
}
