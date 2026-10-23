import type { ConsultationTypeSlug } from '#shared/data/consultation-types'
import { RegionalMeetingAgendaQuerySchema } from '#shared/schemas/regional-meetings'
import { regionalMeetingYear } from '#shared/utils/regional-meetings'
import { serializeRegionalMeetingAgendaItem } from '~~/server/utils/serializers/regionalMeetingAgendaItem'

const SECTION_SLUG = 'encuentros-regionales' satisfies ConsultationTypeSlug

/** Límites UTC del año calendario en hora Argentina (UTC-3, sin horario de verano). */
function yearRange(year: number) {
  return {
    gte: new Date(Date.UTC(year, 0, 1, 3)),
    lt: new Date(Date.UTC(year + 1, 0, 1, 3))
  }
}

/**
 * Agenda de Encuentros Regionales: un ítem por consulta de la sección, filtrado
 * por el año del encuentro (por defecto, el actual). Lectura pública: solo
 * consultas visibles. Los administradores de plataforma ven todas (incluidas
 * las ocultas), lo que el formulario usa para advertir región/año repetidos.
 */
export default defineEventHandler(async (event) => {
  const query = await parseQuery(event, RegionalMeetingAgendaQuerySchema)
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const currentYear = regionalMeetingYear(new Date())
  const year = query.year ?? currentYear

  const consultationWhere = {
    section: { slug: SECTION_SLUG },
    ...(isAdmin ? {} : { visibility: 'visible' as const })
  }

  const [items, allDates] = await Promise.all([
    prisma.regionalMeetingAgendaItem.findMany({
      where: { heldAt: yearRange(year), consultation: consultationWhere },
      orderBy: [{ heldAt: 'asc' }, { id: 'asc' }],
      include: {
        consultation: {
          select: {
            id: true,
            slug: true,
            title: true,
            visibility: true,
            startsAt: true,
            endsAt: true,
            section: { select: { slug: true } },
            region: { select: { id: true, slug: true, name: true } }
          }
        }
      }
    }),
    prisma.regionalMeetingAgendaItem.findMany({
      where: { consultation: consultationWhere },
      select: { heldAt: true }
    })
  ])

  const years = [...new Set([currentYear, ...allDates.map(item => regionalMeetingYear(item.heldAt))])]
    .sort((a, b) => b - a)

  return {
    year,
    years,
    items: isAdmin
      ? items.map(item => serializeRegionalMeetingAgendaItem(item, 'admin'))
      : items.map(item => serializeRegionalMeetingAgendaItem(item, 'public'))
  }
})
