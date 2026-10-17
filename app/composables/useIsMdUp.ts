/**
 * `true` cuando el viewport alcanza el breakpoint `md` (768px). Arranca en
 * `false` (SSR / primer render) y se actualiza al montar.
 */
export function useIsMdUp() {
  const matches = ref(false)

  onMounted(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const update = () => {
      matches.value = mediaQuery.matches
    }
    update()
    mediaQuery.addEventListener('change', update)
    onBeforeUnmount(() => mediaQuery.removeEventListener('change', update))
  })

  return matches
}
