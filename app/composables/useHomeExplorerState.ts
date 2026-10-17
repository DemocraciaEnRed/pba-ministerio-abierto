export type HomeExplorerState = 'all' | 'scheduled' | 'open' | 'closed'

/**
 * Filtro de estado del explorador de la home, compartido para que otros
 * bloques (p. ej. los indicadores de la agenda) puedan preseleccionarlo.
 */
export function useHomeExplorerState() {
  return useState<HomeExplorerState>('home-explorer-state', () => 'all')
}
