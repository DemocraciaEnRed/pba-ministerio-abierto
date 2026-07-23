/**
 * Participation window resolution and validation utilities.
 * Handles the logic of theme-specific windows vs. consultation-level defaults.
 */

/**
 * Window dates (start and end).
 */
export interface ParticipationWindow {
  startsAt: Date | null
  endsAt: Date | null
}

/**
 * Trunca una fecha a la precisión de minutos (descarta segundos y milisegundos).
 * La UI de fechas opera con granularidad de minutos, por lo que las comparaciones
 * de ventana deben ignorar los segundos para no rechazar valores equivalentes
 * (p. ej. un tema a las 22:50:00 contra una consulta guardada a las 22:50:30).
 */
export function floorToMinute(date: Date): number {
  return Math.floor(date.getTime() / 60_000)
}

/**
 * Resolve the effective participation window for a topic.
 * If the topic has theme-specific window dates, use those.
 * Otherwise, inherit from the consultation window.
 */
export function getEffectiveParticipationWindow(
  topic: { participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: { startsAt: Date | null, endsAt: Date | null }
): ParticipationWindow {
  // Cada extremo se resuelve por separado: si el tema define su propia fecha se
  // usa esa, y si no, se hereda la de la consulta. La fecha de inicio del tema
  // es obligatoria, por lo que en la práctica el inicio siempre proviene del tema.
  return {
    startsAt: topic.participationStartsAt ?? consultation.startsAt,
    endsAt: topic.participationEndsAt ?? consultation.endsAt
  }
}

/**
 * Check if participation in a topic is currently open.
 * Returns true if:
 * 1. Topic is visible
 * 2. Current time is within the participation window
 */
export function isTopicParticipationWindowOpen(
  topic: { visibility: string, participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: { startsAt: Date | null, endsAt: Date | null },
  now: Date = new Date()
): boolean {
  // Participation only possible if topic is visible
  if (topic.visibility !== 'visible') {
    return false
  }

  const window = getEffectiveParticipationWindow(topic, consultation)

  // Check start boundary
  if (window.startsAt !== null && now < window.startsAt) {
    return false
  }

  // Check end boundary
  if (window.endsAt !== null && now >= window.endsAt) {
    return false
  }

  return true
}

/**
 * Valida que la ventana de participación de un tema quede dentro de la de su
 * consulta: el inicio no puede ser anterior al inicio de la consulta y el cierre
 * (si se define) no puede superar el cierre de la consulta. También verifica que
 * el cierre del tema no sea anterior a su inicio. Lanza 422 con errores por campo.
 */
export function assertTopicWindowWithinConsultation(
  topic: { participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: { startsAt: Date | null, endsAt: Date | null }
): void {
  const errors: { field: string, message: string }[] = []

  if (
    topic.participationStartsAt
    && consultation.startsAt
    && floorToMinute(topic.participationStartsAt) < floorToMinute(consultation.startsAt)
  ) {
    errors.push({
      field: 'participationStartsAt',
      message: 'La fecha de inicio no puede ser anterior al inicio de la consulta.'
    })
  }

  if (
    topic.participationEndsAt
    && consultation.endsAt
    && floorToMinute(topic.participationEndsAt) > floorToMinute(consultation.endsAt)
  ) {
    errors.push({
      field: 'participationEndsAt',
      message: 'La fecha de cierre no puede ser posterior al cierre de la consulta.'
    })
  }

  if (
    topic.participationStartsAt
    && topic.participationEndsAt
    && floorToMinute(topic.participationEndsAt) < floorToMinute(topic.participationStartsAt)
  ) {
    errors.push({
      field: 'participationEndsAt',
      message: 'La fecha de cierre no puede ser anterior al inicio.'
    })
  }

  if (errors.length > 0) {
    throw createError({
      statusCode: 422,
      message: VALIDATION_ERROR_MESSAGE,
      data: errors
    })
  }
}

/**
 * Check if participation window has closed (past the end date).
 * Used to determine if results should be published (if configured).
 */
export function hasParticipationWindowClosed(
  topic: { participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: { startsAt: Date | null, endsAt: Date | null },
  now: Date = new Date()
): boolean {
  const window = getEffectiveParticipationWindow(topic, consultation)

  if (window.endsAt === null) {
    return false // Never closes if no end date
  }

  return now >= window.endsAt
}

/**
 * Recorta la ventana de un tema para que quede dentro de la de su consulta:
 * - Si el inicio del tema es anterior al inicio de la consulta, se sube al de la consulta.
 * - Si el cierre del tema (propio) supera el cierre de la consulta, se baja al de la consulta.
 * - Si tras subir el inicio el cierre queda antes del inicio, se alinea el cierre al de la consulta.
 *
 * Un tema sin cierre propio (`participationEndsAt = null`) no se toca: ya hereda el
 * cierre de la consulta mediante la ventana efectiva. Devuelve las nuevas fechas si
 * hubo algún cambio, o `null` si la ventana ya estaba dentro de rango.
 */
export function clampTopicWindowToConsultation(
  topic: { participationStartsAt: Date | null, participationEndsAt: Date | null },
  consultation: { startsAt: Date | null, endsAt: Date | null }
): { participationStartsAt: Date | null, participationEndsAt: Date | null } | null {
  let start = topic.participationStartsAt
  let end = topic.participationEndsAt
  let changed = false

  if (start && consultation.startsAt && floorToMinute(start) < floorToMinute(consultation.startsAt)) {
    start = consultation.startsAt
    changed = true
  }

  if (end && consultation.endsAt && floorToMinute(end) > floorToMinute(consultation.endsAt)) {
    end = consultation.endsAt
    changed = true
  }

  if (start && end && floorToMinute(end) < floorToMinute(start)) {
    end = consultation.endsAt
    changed = true
  }

  return changed ? { participationStartsAt: start, participationEndsAt: end } : null
}
