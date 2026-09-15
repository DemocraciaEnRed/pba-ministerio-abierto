import type { ConsultationTypeSlug } from '#shared/data/consultation-types'
import { CommentMetricsQuerySchema } from '#shared/schemas/comment'
import { getCommentMetrics, resolveMetricsWindow, sectionCommentsWhere } from '~~/server/utils/comments/metrics'
import { consultationStateWhere } from '~~/server/utils/consultation-query'

const SECTION_SLUG = 'observatorio-obras-servicios' satisfies ConsultationTypeSlug

/**
 * Endpoint orientado al panel del Observatorio (BFF).
 *
 * Compone el estado de las consultas de la sección, su distribución por grupo
 * de trabajo y la actividad de comentarios, para que la pantalla no dispare
 * varias consultas por su cuenta. Solo lectura y reservada a administradores de
 * plataforma; ver la excepción documentada en `docs/rutas-backend-entity-driven.md`.
 */
export default defineEventHandler(async (event) => {
  const { range } = await parseQuery(event, CommentMetricsQuerySchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'read', { type: 'platform' })

  const now = new Date()
  const window = resolveMetricsWindow(range, now)
  const sectionWhere = { section: { slug: SECTION_SLUG } }

  const [
    consultationsTotal,
    scheduled,
    open,
    closed,
    withoutWorkGroup,
    workGroups,
    countsByWorkGroup,
    activity
  ] = await Promise.all([
    prisma.consultation.count({ where: sectionWhere }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('scheduled', now)] } }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('open', now)] } }),
    prisma.consultation.count({ where: { AND: [sectionWhere, consultationStateWhere('closed', now)] } }),
    prisma.consultation.count({ where: { ...sectionWhere, workGroupAssignments: { none: {} } } }),
    prisma.observatoryWorkGroup.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, slug: true, name: true, color: true, iconColor: true, icon: true }
    }),
    // Una consulta puede pertenecer a varios grupos: la suma de counts puede superar el total.
    prisma.consultationObservatoryWorkGroup.groupBy({
      by: ['workGroupId'],
      where: { consultation: sectionWhere },
      _count: { _all: true }
    }),
    getCommentMetrics(sectionCommentsWhere(SECTION_SLUG), range, now)
  ])

  const totalByWorkGroupId = new Map(
    countsByWorkGroup.map(row => [row.workGroupId, row._count._all])
  )

  return {
    range,
    // `scheduled + open + closed` puede ser menor que `total`: esos estados solo aplican a consultas visibles.
    consultations: { total: consultationsTotal, scheduled, open, closed },
    workGroups: {
      withoutWorkGroup,
      items: workGroups.map(group => ({
        id: group.id,
        slug: group.slug,
        name: group.name,
        color: group.color,
        iconColor: group.iconColor,
        icon: group.icon,
        consultationsCount: totalByWorkGroupId.get(group.id) ?? 0
      }))
    },
    activity,
    // `window` se expone para que la pantalla rotule el rango sin recalcularlo.
    since: window.from?.toISOString() ?? null
  }
})
