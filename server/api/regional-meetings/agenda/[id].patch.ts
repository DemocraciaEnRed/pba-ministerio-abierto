import { UpdateAgendaItemSchema } from '#shared/schemas/regional-meetings'
import { parsePositiveIntParam } from '~~/server/utils/http/params'
import { serializeRegionalMeetingAgendaItem } from '~~/server/utils/serializers/regionalMeetingAgendaItem'

// Solo edición: los ítems de agenda son un catálogo fijo (uno por región).
// No se crean ni eliminan, y la región no cambia.
export default defineEventHandler(async (event) => {
  const itemId = parsePositiveIntParam(event, 'id', 'ítem de agenda')
  const body = await parseBody(event, UpdateAgendaItemSchema)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'platform' })

  const existing = await prisma.regionalMeetingAgendaItem.findUnique({
    where: { id: itemId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Ítem de agenda no encontrado'
    })
  }

  const updated = await prisma.regionalMeetingAgendaItem.update({
    where: { id: itemId },
    data: {
      location: body.location,
      heldAt: body.heldAt,
      year: body.year,
      held: body.held
    },
    include: { region: true }
  })

  return serializeRegionalMeetingAgendaItem(updated, 'admin')
})
