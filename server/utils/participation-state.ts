/**
 * Estado temporal de participación DERIVADO de las fechas de una consulta o
 * tema versus la hora del servidor. No se almacena en la base de datos.
 *
 * - `scheduled` (Programada): ahora es anterior a la fecha de inicio.
 * - `open` (Abierta): ahora es igual o posterior al inicio y, si hay cierre,
 *   anterior al cierre. Sin fecha de cierre, la participación es indefinida.
 * - `closed` (Cerrada): ahora es igual o posterior a la fecha de cierre.
 */
export type ParticipationState = 'scheduled' | 'open' | 'closed'

export interface ParticipationWindowInput {
  startsAt: Date | null
  endsAt: Date | null
}

/**
 * Deriva el estado temporal a partir de una ventana de fechas.
 * La visibilidad (oculta/visible/archivada) se maneja por separado: este
 * cálculo solo considera las fechas.
 */
export function deriveParticipationState(
  window: ParticipationWindowInput,
  now: Date = new Date()
): ParticipationState {
  if (window.startsAt && now < window.startsAt) {
    return 'scheduled'
  }
  if (window.endsAt && now >= window.endsAt) {
    return 'closed'
  }
  return 'open'
}
