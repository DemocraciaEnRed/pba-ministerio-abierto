/**
 * Construcción de URLs de consultas (instancias participativas).
 *
 * - Pública canónica: `/{seccion}/{id}/{nombre}`. El `id` identifica la
 *   instancia; sección y nombre son legibles y, si no coinciden, se redirige.
 * - Enlace corto: `/consultas/{id}` (redirige a la canónica).
 * - Panel de gestión: `/consultas/{id}/panel/...`.
 *
 * Es la única fuente de verdad para armar estas rutas en frontend y backend.
 */

export const CONSULTATION_SLUG_MAX_LENGTH = 80

export interface ConsultationPathInput {
  id: number
  slug: string
  section?: { slug: string } | null
}

function normalizeSubPath(subPath?: string | null): string {
  if (!subPath) return ''
  const trimmed = subPath.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : ''
}

/**
 * Convierte un título en el nombre legible de la URL: minúsculas, sin acentos,
 * palabras separadas por guiones y cortado en una palabra completa.
 */
export function slugifyConsultationName(value: string, maxLength: number = CONSULTATION_SLUG_MAX_LENGTH): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= maxLength) return slug

  const cut = slug.slice(0, maxLength)
  // Si el corte cae en medio de una palabra, retrocedemos al último guion.
  const lastDash = cut.lastIndexOf('-')
  const wordBoundary = slug[maxLength] === '-' ? cut : lastDash > 0 ? cut.slice(0, lastDash) : cut
  return wordBoundary.replace(/-+$/g, '')
}

/** Enlace corto y estable: `/consultas/{id}`. */
export function consultationPermalinkPath(id: number | string, subPath?: string | null): string {
  return `/consultas/${id}${normalizeSubPath(subPath)}`
}

/** Segmento que reemplaza a la sección en consultas que no tienen una asignada. */
export const CONSULTATION_FALLBACK_SECTION_SEGMENT = 'consultas'

/**
 * URL pública canónica: `/{seccion}/{id}/{nombre}[/subruta]`.
 *
 * - `section: null` (consulta sin sección): `/consultas/{id}/{nombre}`.
 * - `section` sin cargar (`undefined`) o sin nombre: enlace corto `/consultas/{id}`,
 *   que el servidor redirige a la canónica.
 */
export function consultationPublicPath(consultation: ConsultationPathInput, subPath?: string | null): string {
  if (consultation.section === undefined || !consultation.slug) {
    return consultationPermalinkPath(consultation.id, subPath)
  }
  const sectionSegment = consultation.section?.slug || CONSULTATION_FALLBACK_SECTION_SEGMENT
  return `/${sectionSegment}/${consultation.id}/${consultation.slug}${normalizeSubPath(subPath)}`
}

/** Panel de gestión: `/consultas/{id}/panel[/subruta]`. */
export function consultationPanelPath(id: number | string, subPath?: string | null): string {
  return `/consultas/${id}/panel${normalizeSubPath(subPath)}`
}

/** Interpreta un parámetro de ruta como id de consulta; `null` si no es un entero positivo. */
export function parseConsultationId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const text = String(raw)
  if (!/^\d+$/.test(text)) return null
  const id = Number(text)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
