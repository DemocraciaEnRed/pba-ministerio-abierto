import type { SelfUserDTO } from '~~/server/utils/serializers/user'

/**
 * Composable de roles de la cuenta propia.
 *
 * Expone flags derivados del perfil autenticado (`/api/me`) para decidir qué
 * secciones mostrar en "Mi cuenta". Reutiliza la misma clave de `useFetch` para
 * deduplicar el pedido entre layout y páginas.
 */
export function useAccountRoles() {
  const { data: profile } = useFetch<SelfUserDTO>('/api/me', { key: 'mi-cuenta-perfil' })

  const isPlatformAdmin = computed(() => profile.value?.roles?.isPlatformAdmin ?? false)
  const isCollaborator = computed(() => profile.value?.roles?.isCollaborator ?? false)

  // Sólo los colaboradores gestionan consultas desde "Mi cuenta"; el admin de
  // plataforma lo hace desde su propio panel y el ciudadano no tiene acceso.
  const canManageConsultations = computed(() => isCollaborator.value && !isPlatformAdmin.value)

  return {
    profile,
    isPlatformAdmin,
    isCollaborator,
    canManageConsultations
  }
}
