import { CommentMetricsQuerySchema } from '#shared/schemas/comment'
import { getCommentMetrics, resolveMetricsWindow } from '~~/server/utils/comments/metrics'
import { consultationStateWhere } from '~~/server/utils/consultation-query'

/**
 * Endpoint orientado al panel de administración de plataforma (BFF).
 *
 * Compone el pantallazo general —usuarios, consultas por estado y actividad de
 * comentarios— para que la pantalla no dispare una consulta por tarjeta. Solo
 * lectura y reservado a administradores de plataforma; ver la excepción
 * documentada en `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const { range } = await parseQuery(event, CommentMetricsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const now = new Date()
  const window = resolveMetricsWindow(range, now)

  const [
    usersTotal,
    usersInRange,
    consultationsTotal,
    scheduled,
    open,
    closed,
    hidden,
    archived,
    activity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: window.from ? { createdAt: { gte: window.from, lte: window.to } } : { createdAt: { lte: window.to } }
    }),
    prisma.consultation.count(),
    prisma.consultation.count({ where: consultationStateWhere('scheduled', now) }),
    prisma.consultation.count({ where: consultationStateWhere('open', now) }),
    prisma.consultation.count({ where: consultationStateWhere('closed', now) }),
    prisma.consultation.count({ where: { visibility: 'hidden' } }),
    prisma.consultation.count({ where: { visibility: 'archived' } }),
    getCommentMetrics({}, range, now)
  ])

  return {
    range,
    users: { total: usersTotal, inRange: usersInRange },
    // `scheduled + open + closed` solo cubre las visibles: el total incluye ocultas y archivadas.
    consultations: { total: consultationsTotal, scheduled, open, closed, hidden, archived },
    activity
  }
})
