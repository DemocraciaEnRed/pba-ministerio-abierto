export function useScrollTo() {
  function scrollTo(
    id: string,
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }
  ): boolean {
    if (!import.meta.client) return false

    const normalizedId = id.startsWith('#') ? id.slice(1) : id
    const element = document.getElementById(normalizedId)

    if (!element) return false

    element.scrollIntoView(options)
    return true
  }

  return { scrollTo }
}
