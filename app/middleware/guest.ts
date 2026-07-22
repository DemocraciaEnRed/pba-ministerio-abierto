// Redirige a home si el usuario ya tiene sesión (para páginas de login/registro).
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()
  if (loggedIn.value) {
    return navigateTo('/')
  }
})
