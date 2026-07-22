// Requiere sesión activa y rol de colaborador (no admin de plataforma) para
// acceder a las secciones de gestión de consultas dentro de "Mi cuenta".
export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession()
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }

  const session = await requestFetch('/api/auth/session').catch(() => null)
  const roles = session?.user?.roles
  const canManage = Boolean(roles?.isCollaborator && !roles?.isPlatformAdmin)

  if (!session?.authenticated || !canManage) {
    return navigateTo('/mi-cuenta')
  }
})
