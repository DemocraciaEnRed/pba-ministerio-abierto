import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { REGISTRATION_EVENT_MODE_LABELS } from '#shared/data/consultation-registrations'

/** Cantidad de días que cubre la agenda de la home. */
export const AGENDA_DAYS = 30

export interface AgendaSource {
  startsAt: string | null
  endsAt: string | null
  /** Inscripción presencial (formulario de inscripción), si la instancia la tiene. */
  registration?: {
    eventAt: string
    opensAt: string
    closesAt: string
    path?: string
    venueName?: string
    venueCity?: string
    eventMode?: keyof typeof REGISTRATION_EVENT_MODE_LABELS
  } | null
  /**
   * Encuentro presencial de Encuentros Regionales (inscripción en un formulario
   * externo). La ventana de inscripción es opcional.
   */
  regionalMeeting?: {
    location: string
    heldAt: string
    registrationUrl: string | null
    registrationOpensAt: string | null
    registrationClosesAt: string | null
  } | null
}

/**
 * Encuentro presencial de una instancia, unificando el formulario de
 * inscripción propio y los datos de Encuentros Regionales.
 */
export interface AgendaEncounter {
  eventAt: string
  opensAt: string | null
  closesAt: string | null
  venue: string
  /** Destino de la inscripción; `null` si no hay enlace disponible. */
  path: string | null
  /** `true` si `path` es un formulario externo. */
  external: boolean
}

export function resolveAgendaEncounter(item: AgendaSource): AgendaEncounter | null {
  if (item.registration) {
    return {
      eventAt: item.registration.eventAt,
      opensAt: item.registration.opensAt,
      closesAt: item.registration.closesAt,
      venue: [
        item.registration.eventMode && item.registration.eventMode !== 'in_person' ? REGISTRATION_EVENT_MODE_LABELS[item.registration.eventMode] : null,
        [item.registration.venueName, item.registration.venueCity].filter(Boolean).join(', ')
      ].filter(Boolean).join(' · '),
      path: item.registration.path ?? null,
      external: false
    }
  }
  if (item.regionalMeeting) {
    return {
      eventAt: item.regionalMeeting.heldAt,
      opensAt: item.regionalMeeting.registrationOpensAt,
      closesAt: item.regionalMeeting.registrationClosesAt,
      venue: item.regionalMeeting.location,
      path: item.regionalMeeting.registrationUrl,
      external: true
    }
  }
  return null
}

/**
 * Hito de la agenda:
 * - `opens` / `closes`: apertura o cierre de la participación;
 * - `registration_opens` / `registration_closes`: ventana de inscripción presencial;
 * - `event`: el encuentro presencial.
 */
export type AgendaMilestoneKind = 'opens' | 'closes' | 'registration_opens' | 'registration_closes' | 'event'

export interface AgendaMilestone<T> {
  item: T
  kind: AgendaMilestoneKind
  date: Date
  /** Día local en formato `YYYY-MM-DD` (compatible con `CalendarDate#toString()`). */
  dayKey: string
}

export interface AgendaDay<T> {
  dayKey: string
  date: Date
  milestones: AgendaMilestone<T>[]
}

export interface AgendaStats {
  /** Instancias con la participación abierta en este momento. */
  openNow: number
  /** Instancias que abren su participación dentro de la ventana. */
  opensSoon: number
  /** Instancias abiertas que cierran en los próximos 7 días. */
  closesThisWeek: number
  /** Instancias con la inscripción presencial abierta en este momento. */
  registrationOpen: number
}

/** Ventana de la agenda: desde el inicio de hoy hasta el fin del día +`days`. */
export function getAgendaWindow(now: Date = new Date(), days: number = AGENDA_DAYS) {
  const from = dayjs(now).startOf('day')
  return {
    from: from.toDate(),
    to: from.add(days, 'day').endOf('day').toDate()
  }
}

/** Clave de día local `YYYY-MM-DD`. */
export function agendaDayKey(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * Hitos que caen dentro de `[from, to]`, ordenados por fecha. Cada instancia
 * aporta apertura/cierre de la participación y, si tiene encuentro presencial
 * (formulario de inscripción o Encuentro Regional), el encuentro y la
 * apertura/cierre de la inscripción.
 */
export function buildAgendaMilestones<T extends AgendaSource>(
  items: readonly T[],
  from: Date,
  to: Date
): AgendaMilestone<T>[] {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const milestones: AgendaMilestone<T>[] = []

  const push = (item: T, kind: AgendaMilestoneKind, value: string | null) => {
    if (!value) return
    const date = new Date(value)
    const ms = date.getTime()
    if (ms < fromMs || ms > toMs) return
    milestones.push({ item, kind, date, dayKey: agendaDayKey(date) })
  }

  for (const item of items) {
    push(item, 'opens', item.startsAt)
    push(item, 'closes', item.endsAt)
    const encounter = resolveAgendaEncounter(item)
    if (encounter) {
      push(item, 'registration_opens', encounter.opensAt)
      push(item, 'registration_closes', encounter.closesAt)
      push(item, 'event', encounter.eventAt)
    }
  }

  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Agrupa hitos (ya ordenados) por día local, preservando el orden. */
export function groupMilestonesByDay<T>(milestones: readonly AgendaMilestone<T>[]): AgendaDay<T>[] {
  const days: AgendaDay<T>[] = []
  for (const milestone of milestones) {
    const last = days.at(-1)
    if (last && last.dayKey === milestone.dayKey) {
      last.milestones.push(milestone)
    } else {
      days.push({
        dayKey: milestone.dayKey,
        date: dayjs(milestone.date).startOf('day').toDate(),
        milestones: [milestone]
      })
    }
  }
  return days
}

/** Indicadores resumidos de la agenda calculados a partir de las fechas. */
export function computeAgendaStats<T extends AgendaSource>(
  items: readonly T[],
  now: Date,
  to: Date
): AgendaStats {
  const nowMs = now.getTime()
  const toMs = to.getTime()
  const weekMs = dayjs(now).add(7, 'day').valueOf()
  const stats: AgendaStats = { openNow: 0, opensSoon: 0, closesThisWeek: 0, registrationOpen: 0 }

  for (const item of items) {
    const encounter = resolveAgendaEncounter(item)
    if (encounter?.opensAt && encounter.closesAt
      && new Date(encounter.opensAt).getTime() <= nowMs
      && new Date(encounter.closesAt).getTime() >= nowMs) {
      stats.registrationOpen++
    }

    if (!item.startsAt) continue
    const startsAt = new Date(item.startsAt).getTime()
    const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : null
    const isOpen = startsAt <= nowMs && (endsAt === null || endsAt > nowMs)

    if (isOpen) {
      stats.openNow++
      if (endsAt !== null && endsAt <= weekMs) stats.closesThisWeek++
    } else if (startsAt > nowMs && startsAt <= toMs) {
      stats.opensSoon++
    }
  }

  return stats
}

/** Distancia legible en días: "hoy", "mañana" o "en N días". */
export function formatAgendaRelativeDay(date: Date, now: Date = new Date()): string {
  const diff = dayjs(date).startOf('day').diff(dayjs(now).startOf('day'), 'day')
  if (diff <= 0) return 'hoy'
  if (diff === 1) return 'mañana'
  return `en ${diff} días`
}

/** Hora local `HH:mm`, p. ej. "18:30". */
export function formatAgendaTime(date: Date): string {
  return dayjs(date).format('HH:mm')
}

/** Fecha larga de un día, p. ej. "sábado 24 de octubre". */
export function formatAgendaDay(date: Date): string {
  return dayjs(date).locale('es').format('dddd D [de] MMMM')
}
