/** Zona horaria en la que se interpreta el año de un Encuentro Regional. */
export const REGIONAL_MEETING_TIME_ZONE = 'America/Argentina/Buenos_Aires'

const yearFormatter = new Intl.DateTimeFormat('en-US', { timeZone: REGIONAL_MEETING_TIME_ZONE, year: 'numeric' })

/** Año (hora Argentina) en que se realiza el encuentro; define el tab de la agenda. */
export function regionalMeetingYear(heldAt: Date | string): number {
  return Number(yearFormatter.format(typeof heldAt === 'string' ? new Date(heldAt) : heldAt))
}
