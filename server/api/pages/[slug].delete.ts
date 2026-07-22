import { parsePageSlug } from '~~/server/utils/pages/slug'

export default defineEventHandler(async (event) => {
  const slug = parsePageSlug(event)
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'delete', { type: 'platform' })

  const existing = await prisma.sitePage.findUnique({
    where: { slug },
    select: { id: true }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Página no encontrada'
    })
  }

  await prisma.sitePage.delete({
    where: { slug }
  })

  setResponseStatus(event, 204)
})
