import type { RouterConfig } from '@nuxt/schema'

// Scroll suave a anclas (#seccion) con un offset para el nav sticky de consultas.
export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
}
