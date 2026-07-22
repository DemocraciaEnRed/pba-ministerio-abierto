// Redirige a login si el usuario no tiene sesión activa.
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
