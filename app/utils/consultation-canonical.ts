import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { isKnownConsultationTypeSlug } from '#shared/data/consultation-types'
import { CONSULTATION_FALLBACK_SECTION_SEGMENT, parseConsultationId } from '#shared/utils/consultation-url'

/**
 * Si la ruta pública actual no coincide con la URL canónica de la consulta
 * (sección o nombre desactualizados), redirige con 301 conservando la query y
 * el ancla. El id es lo único que identifica la consulta; lo demás es legible.
 *
 * Devolver el resultado desde el `setup` de la página (con `await`) para que
 * en SSR la respuesta sea la redirección.
 */
export function redirectToCanonicalConsultationPath(
  route: RouteLocationNormalizedLoaded,
  canonicalPath: string | null | undefined
) {
  if (!canonicalPath) return
  const currentPath = route.path.replace(/\/+$/, '') || '/'
  if (decodeURIComponent(currentPath) === canonicalPath) return
  return navigateTo(
    { path: canonicalPath, query: route.query, hash: route.hash },
    { redirectCode: 301, replace: true }
  )
}

/** Valida los parámetros `seccion` e `idConsulta` de las rutas públicas de consultas. */
export function isValidPublicConsultationRoute(params: Record<string, unknown>): boolean {
  const section = Array.isArray(params.seccion) ? params.seccion[0] : params.seccion
  if (typeof section !== 'string') return false
  const knownSection = isKnownConsultationTypeSlug(section) || section === CONSULTATION_FALLBACK_SECTION_SEGMENT
  return knownSection && parseConsultationId(params.idConsulta) !== null
}
