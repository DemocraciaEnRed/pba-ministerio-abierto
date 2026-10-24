/** Filtro "solo con inscripción presencial abierta" del explorador de la home. */
export function useHomeExplorerRegistrationOpen() {
  return useState<boolean>('home-explorer-registration-open', () => false)
}
