import type { ParticipationState, Visibility } from '~/types/consulta'

export type EstadoBadgeColor = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

export interface EstadoBadge {
  label: string
  color: EstadoBadgeColor
  icon: string
}

/**
 * Filtro de estado que se ofrece en el listado público de consultas: incluye
 * el estado temporal derivado más `all` (sin filtro) y `archived`.
 */
export type ConsultationStatusFilter = 'all' | ParticipationState | 'archived'

/** Íconos (Lucide) del estado temporal derivado, compartidos en todo el front. */
export const participationStateIcons: Record<ParticipationState, string> = {
  scheduled: 'lucide:calendar-clock',
  open: 'lucide:circle-play',
  closed: 'lucide:circle-x'
}

/** Íconos (Lucide) de visibilidad, compartidos en todo el front. */
export const visibilityIcons: Record<Visibility, string> = {
  hidden: 'lucide:eye-off',
  visible: 'lucide:eye',
  archived: 'lucide:archive'
}

/** Íconos (Lucide) para las opciones del filtro de estado del listado. */
export const statusFilterIcons: Record<ConsultationStatusFilter, string> = {
  all: 'lucide:layers',
  scheduled: participationStateIcons.scheduled,
  open: participationStateIcons.open,
  closed: participationStateIcons.closed,
  archived: visibilityIcons.archived
}

/** Etiquetas de visibilidad para consultas (femenino) y temas (masculino). */
export const visibilityLabelsConsulta: Record<Visibility, string> = {
  hidden: 'Oculta',
  visible: 'Visible',
  archived: 'Archivada'
}

export const visibilityLabelsTema: Record<Visibility, string> = {
  hidden: 'Oculto',
  visible: 'Visible',
  archived: 'Archivado'
}

/**
 * Badge del estado temporal derivado (programada/abierta/cerrada) de una consulta.
 */
export function participationStateBadgeConsulta(state: ParticipationState): EstadoBadge {
  if (state === 'open') return { label: 'Abierta', color: 'success', icon: participationStateIcons.open }
  if (state === 'scheduled') return { label: 'Programada', color: 'primary', icon: participationStateIcons.scheduled }
  return { label: 'Cerrada', color: 'warning', icon: participationStateIcons.closed }
}

/**
 * Badge del estado temporal derivado de un tema (variante masculina).
 */
export function participationStateBadgeTema(state: ParticipationState): EstadoBadge {
  if (state === 'open') return { label: 'Abierto', color: 'success', icon: participationStateIcons.open }
  if (state === 'scheduled') return { label: 'Programado', color: 'primary', icon: participationStateIcons.scheduled }
  return { label: 'Cerrado', color: 'warning', icon: participationStateIcons.closed }
}

/**
 * Estado combinado que se muestra para una consulta. Si está oculta o
 * archivada prevalece la visibilidad; si está visible se muestra el estado
 * temporal derivado de las fechas.
 */
export function consultationStateBadge(
  visibility: Visibility,
  participationState: ParticipationState
): EstadoBadge {
  if (visibility === 'hidden') return { label: 'Oculta', color: 'neutral', icon: visibilityIcons.hidden }
  if (visibility === 'archived') return { label: 'Archivada', color: 'neutral', icon: visibilityIcons.archived }
  return participationStateBadgeConsulta(participationState)
}

/**
 * Estado combinado que se muestra para un tema.
 */
export function topicStateBadge(
  visibility: Visibility,
  participationState: ParticipationState
): EstadoBadge {
  if (visibility === 'hidden') return { label: 'Oculto', color: 'neutral', icon: visibilityIcons.hidden }
  if (visibility === 'archived') return { label: 'Archivado', color: 'neutral', icon: visibilityIcons.archived }
  return participationStateBadgeTema(participationState)
}
