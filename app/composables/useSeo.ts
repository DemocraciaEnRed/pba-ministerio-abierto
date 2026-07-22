import type { MaybeRefOrGetter } from 'vue'

/** Nombre del sitio, usado en el título y como fallback de los OpenGraph. */
export const SITE_NAME = 'Ministerio Abierto'

/** Descripción por defecto cuando una página no define la suya. */
export const DEFAULT_SEO_DESCRIPTION = 'Iniciativa de gobierno abierto del Ministerio de Infraestructura y Servicios Públicos de la provincia de Buenos Aires: información y participación ciudadana.'

/**
 * Descripción más extensa para vistas previas al compartir (og/twitter), donde
 * hay más espacio que en la meta description destinada a resultados de búsqueda.
 */
export const DEFAULT_SHARE_DESCRIPTION = 'Ministerio Abierto es una iniciativa de gobierno abierto del Ministerio de Infraestructura y Servicios Públicos. Es un espacio que reúne las distintas instancias participativas del Ministerio con el fin de facilitar el acceso a la información y canalizar la participación de la ciudadanía y de las partes interesadas.'

/** Imagen para vistas previas al compartir (og:image / twitter:image). */
export const DEFAULT_OG_IMAGE = '/img/sharer-01.png'

/**
 * Devuelve una función que convierte una ruta relativa en URL absoluta usando
 * `appUrl`. Necesario porque los scrapers de OpenGraph/Twitter exigen URLs
 * absolutas para `og:image` y `og:url`.
 */
export function useAbsoluteUrl() {
  const config = useRuntimeConfig()
  const base = String(config.public.appUrl ?? '').replace(/\/$/, '')

  return (path?: string | null): string => {
    if (!path) return base
    if (/^https?:\/\//i.test(path)) return path
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }
}

export interface PageSeoInput {
  /** Título de la página (sin el sufijo del sitio, que agrega el titleTemplate). */
  title?: string | null
  /** Descripción; si se omite se usa `DEFAULT_SEO_DESCRIPTION`. */
  description?: string | null
  /** Ruta o URL de la imagen de vista previa; si se omite se usa la imagen por defecto. */
  image?: string | null
  /** Texto alternativo de la imagen de vista previa. */
  imageAlt?: string | null
  /** Ruta canónica; por defecto la ruta actual. */
  url?: string | null
  /** Tipo OpenGraph. */
  type?: 'website' | 'article' | 'profile'
  /** Si es `true`, marca la página como no indexable. */
  noindex?: boolean
}

/**
 * Configura los meta tags de una página pública (título + OpenGraph + Twitter)
 * con URLs absolutas y fallbacks. Acepta un objeto reactivo o un getter para
 * soportar páginas dinámicas cuyo contenido llega vía `useAsyncData`.
 */
export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>) {
  const toAbsolute = useAbsoluteUrl()
  const route = useRoute()
  const get = (): PageSeoInput => toValue(input)

  useSeoMeta({
    title: () => get().title ?? undefined,
    description: () => get().description || DEFAULT_SEO_DESCRIPTION,
    ogTitle: () => get().title || SITE_NAME,
    ogDescription: () => get().description || DEFAULT_SHARE_DESCRIPTION,
    ogType: () => get().type ?? 'website',
    ogUrl: () => toAbsolute(get().url ?? route.path),
    ogImage: () => toAbsolute(get().image || DEFAULT_OG_IMAGE),
    ogImageAlt: () => get().imageAlt ?? undefined,
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: () => get().title || SITE_NAME,
    twitterDescription: () => get().description || DEFAULT_SHARE_DESCRIPTION,
    twitterImage: () => toAbsolute(get().image || DEFAULT_OG_IMAGE),
    twitterImageAlt: () => get().imageAlt ?? undefined,
    robots: () => (get().noindex ? 'noindex, nofollow' : undefined)
  })
}

/**
 * Configura el título de una página privada (auth, panel, administración) y la
 * marca como no indexable. No define OpenGraph porque no debe compartirse.
 */
export function usePrivatePageSeo(title: MaybeRefOrGetter<string>) {
  useSeoMeta({
    title: () => toValue(title),
    robots: 'noindex, nofollow'
  })
}
