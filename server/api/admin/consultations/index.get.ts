import { ConsultationsQuerySchema } from '#shared/schemas/consultation'
import { serializeConsultation } from '~~/server/utils/serializers/consultation'
import { buildConsultationFilters } from '~~/server/utils/consultation-query'

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

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: {
        section: true,
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
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      skip,
      take: query.perPage
    }),
    prisma.consultation.count({ where })
  ])

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
