/**
 * Utilidades para resolver una página institucional por slug.
 */
export function parsePageSlug(
  event: Parameters<typeof getRouterParam>[0],
  paramName: string = 'slug'
): string {
  const rawValue = getRouterParam(event, paramName)
  if (!rawValue) {
    throw createError({
      statusCode: 400,
      message: 'El slug de la página es requerido'
    })
  }

  return rawValue
}

export async function findPageBySlug(slug: string) {
  return prisma.sitePage.findUnique({ where: { slug } })
}
