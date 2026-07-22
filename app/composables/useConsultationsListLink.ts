/**
 * Ruta del listado de consultas apropiada según el rol: el admin de plataforma
 * gestiona desde `/admin/consultas`; el colaborador (gestor de consultas
 * puntuales) lo hace desde su panel en "Mi cuenta". Se usa en el panel de una
 * consulta —accesible por ambos roles— para que "Volver a consultas" apunte al
 * lugar correcto.
 */
export function useConsultationsListLink() {
  const { isPlatformAdmin } = useAccountRoles()
  return computed(() => (isPlatformAdmin.value ? '/admin/consultas' : '/mi-cuenta/consultas'))
}
