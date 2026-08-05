import { ConsultationsQuerySchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import {
  buildConsultationFilters,
  buildConsultationOrderBuckets,
  getConsultationPageSegments
} from '~~/server/utils/consultation-query'

/**
 * Endpoint orientado a la pantalla de administración de consultas (BFF).
 *
 * A diferencia del listado entity-driven `GET /api/consultations` (que sirve a
 * todos los roles y no embebe relaciones pesadas), esta ruta compone en una
 * sola respuesta lo que la grilla admin necesita para dar un pantallazo: la
 * consulta más un resumen liviano de sus temas de participación. Reservada a
 * administradores de plataforma; ver la excepción documentada en
 * `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, ConsultationsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const now = new Date()
  const skip = (query.page - 1) * query.perPage
  const where = buildConsultationFilters(query, now)
  const orderBuckets = buildConsultationOrderBuckets(query, now)

  const bucketCounts = await Promise.all(orderBuckets.map(bucket =>
    prisma.consultation.count({ where: { AND: [where, bucket.where] } })
  ))
  const total = bucketCounts.reduce((sum, count) => sum + count, 0)
  const pageSegments = getConsultationPageSegments(bucketCounts, skip, query.perPage)

  const consultations = (await Promise.all(pageSegments.map((segment) => {
    const bucket = orderBuckets[segment.bucketIndex]!
    return prisma.consultation.findMany({
      where: { AND: [where, bucket.where] },
      include: {
        section: true,
        region: true,
        categoryAssignments: {
          include: { category: true },
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }]
        },
        consultationTags: {
          include: { tag: true }
        },
        topics: {
          select: {
            id: true,
            slug: true,
            title: true,
            visibility: true,
            participationStartsAt: true,
            participationEndsAt: true
          },
          orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }]
        }
      },
      orderBy: bucket.orderBy,
      skip: segment.skip,
      take: segment.take
    })
  }))).flat()

  return {
    items: consultations.map(consultation => serializeConsultation(consultation, 'admin')),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.ceil(total / query.perPage)
    }
  }
})
