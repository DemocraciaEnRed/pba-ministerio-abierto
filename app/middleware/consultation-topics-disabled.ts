export default defineNuxtRouteMiddleware(() => {
  throw createError({
    statusCode: 404,
    message: 'Página no encontrada'
  })
})
