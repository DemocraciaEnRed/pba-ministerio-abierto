import dayjs from 'dayjs'
import 'dayjs/locale/es'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('es')

/**
 * Fecha legible en español, p. ej. "7 de julio de 2026 18:30".
 * Devuelve "Sin definir" cuando no hay valor.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return dayjs(value).format('D [de] MMMM [de] YYYY HH:mm')
}

/**
 * Fecha corta, p. ej. "07/07/2026".
 */
export function formatDateShort(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return dayjs(value).format('DD/MM/YYYY')
}

/**
 * Fecha relativa al momento actual, p. ej. "en 3 días" / "hace 2 horas".
 */
export function fromNow(value: string | null | undefined): string {
  if (!value) return 'Sin definir'
  return dayjs(value).fromNow()
}
