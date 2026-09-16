import { parsePositiveIntParam } from '~~/server/utils/http/params'

// Borrado real: la publicación no tiene historial que preservar. Los assets de
// portada/documento quedan (la FK es SetNull) y se limpian por separado.
export default defineEventHandler(async (event) => {
  const publicationId = parsePositiveIntParam(event, 'id', 'publicación')
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.observatoryPublication.findUnique({
    where: { id: publicationId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Publicación no encontrada' })
  }

  await prisma.observatoryPublication.delete({ where: { id: publicationId } })

  setResponseStatus(event, 204)
  return null
})
