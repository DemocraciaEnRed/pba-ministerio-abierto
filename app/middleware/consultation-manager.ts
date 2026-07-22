interface ConsultationManageProbe {
  canManage?: boolean
}

/**
 * Permite acceder al panel de gestión de una consulta a quien puede
 * administrarla: admin de plataforma o gestor de esa consulta concreta
 * (con `ConsultationMembership`). La membresía por consulta no vive en la
 * sesión, así que se resuelve consultando el detalle de la consulta, que
 * expone `canManage` según el rol efectivo del usuario sobre ese recurso.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }

  const slug = String(to.params.slugConsulta)
  const consultation = await requestFetch<ConsultationManageProbe>(`/api/consultations/${slug}`)
    .catch(() => null)

  if (!consultation?.canManage) {
    throw createError({
      statusCode: 403,
      message: 'No tenés permisos para gestionar esta consulta'
    })
  }
})
