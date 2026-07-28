import { parsePositiveIntParam } from '~~/server/utils/http/params'

export default defineEventHandler(async (event) => {
  const groupId = parsePositiveIntParam(event, 'id', 'grupo de testimonios')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.regionalMeetingTestimonialGroup.findUnique({
    where: { id: groupId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Grupo de testimonios no encontrado'
    })
  }

  // Los testimonios asociados se eliminan en cascada (onDelete: Cascade).
  await prisma.regionalMeetingTestimonialGroup.delete({ where: { id: groupId } })

  return { success: true }
})
