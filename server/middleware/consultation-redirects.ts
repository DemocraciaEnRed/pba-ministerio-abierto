import { consultationPanelPath, consultationPublicPath, parseConsultationId } from '#shared/utils/consultation-url'

/**
 * Redirecciones permanentes (301) de las direcciones de consultas:
 *
 * - `/consultas/{id}` (enlace corto) → `/{seccion}/{id}/{nombre}`.
 * - `/consultas/{slug-anterior}` (enlaces publicados antes del cambio de
 *   formato, guardados en `ConsultationLegacySlug`) → URL canónica.
 * - En ambos casos se conservan las subrutas públicas (`/inscripcion`,
 *   `/inscripcion/exito`, `/temas/{tema}`) y la query string.
 * - `/consultas/{slug-anterior}/panel/...` → `/consultas/{id}/panel/...`.
 *
 * Una consulta oculta solo se redirige para quien puede gestionarla; para el
 * resto la ruta sigue de largo hasta el 404, sin revelar su dirección.
 */

const PUBLIC_SUB_PATH = /^(?:inscripcion(?:\/exito)?|temas\/[^/]+)$/

export default defineEventHandler(async (event) => {
  const method = event.method
  if (method !== 'GET' && method !== 'HEAD') return

  const url = getRequestURL(event)
  const match = /^\/consultas\/([^/]+)(?:\/(.*?))?\/?$/.exec(url.pathname)
  if (!match) return

  let segment: string
  try {
    segment = decodeURIComponent(match[1]!)
  } catch {
    return
  }
  const subPath = match[2] ?? ''
  const isPanel = subPath === 'panel' || subPath.startsWith('panel/')

  const numericId = parseConsultationId(segment)
  if (numericId !== null) {
    // El panel ya vive en `/consultas/{id}/panel` y una subruta no reconocida
    // puede ser la canónica de una consulta sin sección (`/consultas/{id}/{nombre}`).
    if (isPanel || (subPath && !PUBLIC_SUB_PATH.test(subPath))) return
    const consultation = await prisma.consultation.findUnique({
      where: { id: numericId },
      select: { id: true, slug: true, visibility: true, section: { select: { slug: true } } }
    })
    if (!consultation || !(await canSeeConsultation(event, consultation))) return
    return redirectTo(event, consultationPublicPath(consultation, subPath), url.search)
  }

  if (subPath && !isPanel && !PUBLIC_SUB_PATH.test(subPath)) return

  const legacy = await prisma.consultationLegacySlug.findUnique({
    where: { slug: segment },
    select: {
      consultation: {
        select: { id: true, slug: true, visibility: true, section: { select: { slug: true } } }
      }
    }
  })
  const consultation = legacy?.consultation
  if (!consultation) return

  // El panel exige sesión y permisos propios: el id no revela nada por sí solo.
  if (isPanel) {
    return redirectTo(event, consultationPanelPath(consultation.id, subPath.slice('panel'.length)), url.search)
  }

  if (!(await canSeeConsultation(event, consultation))) return
  return redirectTo(event, consultationPublicPath(consultation, subPath), url.search)
})

async function canSeeConsultation(
  event: Parameters<typeof getAuthContext>[0],
  consultation: { id: number, visibility: string }
): Promise<boolean> {
  if (consultation.visibility !== 'hidden') return true
  const ctx = await getAuthContext(event)
  return ctx.isPlatformAdmin || (ctx.user ? await ctx.isConsultationAdmin(consultation.id) : false)
}

function redirectTo(event: Parameters<typeof sendRedirect>[0], path: string, search: string) {
  const location = `${path}${search}`
  const current = getRequestURL(event)
  if (`${current.pathname}${current.search}` === location) return
  return sendRedirect(event, location, 301)
}
