import { CommentMetricsQuerySchema } from '#shared/schemas/comment'
import { getConsultationCommentMetrics } from '~~/server/utils/comments/metrics'
import { resolveConsultationIdFromParam } from '~~/server/utils/consultations/slug'

/**
 * Métricas agregadas de comentarios para el panel de gestión de la consulta.
 * Reservado a gestores de la consulta y administradores de plataforma.
 */
export default defineEventHandler(async (event) => {
  const consultationId = await resolveConsultationIdFromParam(event)
  const { range } = await parseQuery(event, CommentMetricsQuerySchema)

  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'consultation', id: consultationId })

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true }
  })

  if (!consultation) {
    throw createError({ statusCode: 404, message: 'Consulta no encontrada' })
  }

  return getConsultationCommentMetrics(consultationId, range)
})
