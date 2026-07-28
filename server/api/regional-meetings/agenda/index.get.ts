import { serializeRegionalMeetingAgendaItem } from '~~/server/utils/serializers/regionalMeetingAgendaItem'

// Lectura pública: la timeline de Encuentros Regionales es visible sin sesión.
// Los administradores reciben la vista con metadatos (timestamps).
export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  const isAdmin = ctx.isPlatformAdmin

  if (isAdmin) {
    await assertCan(ctx, 'read', { type: 'platform' })
  }

  const items = await prisma.regionalMeetingAgendaItem.findMany({
    orderBy: { heldAt: 'asc' },
    include: { region: true }
  })

  if (isAdmin) {
    return items.map(item => serializeRegionalMeetingAgendaItem(item, 'admin'))
  }

  return items.map(item => serializeRegionalMeetingAgendaItem(item, 'public'))
})
