export interface DeltaIndicator {
  label: string
  /** Clase de color para el texto del indicador. */
  class: string
  icon: string
}

/**
 * Indicador de variación contra el período anterior.
 * Devuelve `null` cuando el rango no tiene comparación (p. ej. histórico).
 */
export function formatDelta(deltaAbs: number | null, deltaPct: number | null): DeltaIndicator | null {
  if (deltaAbs === null) return null

  if (deltaAbs === 0) {
    return { label: 'sin cambios', class: 'text-muted', icon: 'lucide:minus' }
  }

  const sign = deltaAbs > 0 ? '+' : '-'
  const percentage = deltaPct === null ? '' : ` (${sign}${Math.abs(deltaPct)}%)`

  return {
    label: `${sign}${Math.abs(deltaAbs)}${percentage}`,
    class: deltaAbs > 0 ? 'text-success' : 'text-warning',
    icon: deltaAbs > 0 ? 'lucide:trending-up' : 'lucide:trending-down'
  }
}
