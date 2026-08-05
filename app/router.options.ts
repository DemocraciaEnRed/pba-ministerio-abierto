import type { RouterConfig } from '@nuxt/schema'

function getHashScrollOffset(hash: string): number {
  if (!import.meta.client) return 80

  try {
    const target = document.querySelector(hash)
    if (!target) return 80

    const targetMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    const documentPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    return targetMargin + documentPadding || 80
  } catch {
    return 80
  }
}

// Scroll suave a anclas (#seccion) con un offset para el nav sticky de consultas.
export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, top: getHashScrollOffset(to.hash), behavior: 'smooth' }
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
}
