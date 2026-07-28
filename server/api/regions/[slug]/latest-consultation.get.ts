export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Región no especificada' })
  }

  const ctx = await getAuthContext(event)
  const userId = ctx.user?.id ?? null

  // Solo se navega a consultas que el visitante puede ver: los administradores de
  // plataforma alcanzan cualquier consulta; el resto, las visibles o aquellas en las
  // que son miembros. Espeja el gating del listado GET /api/consultations.
  const visibilityWhere = ctx.isPlatformAdmin
    ? {}
    : userId
      ? {
          OR: [
            { visibility: { not: 'hidden' as const } },
            { memberships: { some: { userId } } }
          ]
        }
      : { visibility: { not: 'hidden' as const } }

  // "La" consulta de la región es la última creada (createdAt / id más alto). No hay
  // restricción de una consulta por región, por eso se toma la más reciente.
  const consultation = await prisma.consultation.findFirst({
    where: {
      region: { slug },
      ...visibilityWhere
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { slug: true }
  })

  return { slug: consultation?.slug ?? null }
})
