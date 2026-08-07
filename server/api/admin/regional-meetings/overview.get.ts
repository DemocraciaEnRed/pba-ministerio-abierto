import type { ConsultationTypeSlug } from '#shared/data/consultation-types'
import { CommentMetricsQuerySchema } from '#shared/schemas/comment'
import { getCommentMetrics, resolveMetricsWindow, sectionCommentsWhere } from '~~/server/utils/comments/metrics'
import { consultationStateWhere } from '~~/server/utils/consultation-query'

const SECTION_SLUG = 'encuentros-regionales' satisfies ConsultationTypeSlug

/**
 * Endpoint orientado al panel de Encuentros Regionales (BFF).
 *
 * Compone en una sola respuesta los aportes recibidos, el estado de las
 * consultas de la sección y la actividad de comentarios, para evitar que la
 * pantalla dispare varias consultas por su cuenta. Solo lectura y reservada a
 * administradores de plataforma; ver la excepción documentada en
 * `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const { range } = await parseQuery(event, CommentMetricsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const now = new Date()
  const window = resolveMetricsWindow(range, now)
  const sectionWhere = { section: { slug: SECTION_SLUG } }

  const [
    submissionsTotal,
    submissionsInRange,
    consultationsTotal,
    scheduled,
    open,
    closed,
    activity
  ] = await Promise.all([
    prisma.regionalMeetingSubmission.count(),
    prisma.regionalMeetingSubmission.count({
      where: window.from ? { createdAt: { gte: window.from, lte: window.to } } : { createdAt: { lte: window.to } }
    }),
    prisma.consultation.count({ where: sectionWhere }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('scheduled', now)] } }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('open', now)] } }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('closed', now)] } }),
    getCommentMetrics(sectionCommentsWhere(SECTION_SLUG), range, now)
  ])

  return {
    range,
    submissions: { total: submissionsTotal, inRange: submissionsInRange },
    // `scheduled + open + closed` puede ser menor que `total`: esos estados solo aplican a consultas visibles.
    consultations: { total: consultationsTotal, scheduled, open, closed },
    activity
  }
})
