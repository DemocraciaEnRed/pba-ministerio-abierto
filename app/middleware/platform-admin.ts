// Requiere sesión activa y rol platform_admin para acceder a la administración.
export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession()
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }

  const session = await requestFetch('/api/auth/session').catch(() => null)

  if (!session?.authenticated || !session.user?.roles?.isPlatformAdmin) {
    throw createError({
      statusCode: 403,
      message: 'No tenés permisos para acceder a la administración'
    })
  }
})
