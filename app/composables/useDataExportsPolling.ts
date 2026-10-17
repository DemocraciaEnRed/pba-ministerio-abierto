import type { DataExport } from '~/types/exports'

const POLL_INTERVAL_MS = 3000

/**
 * Refresca un listado de exportaciones mientras alguna siga en curso, y avisa
 * con un toast cuando una pasa a estar lista o falla.
 */
export function useDataExportsPolling(items: Ref<DataExport[]>, refresh: () => Promise<unknown>) {
  const toast = useToast()
  let timer: ReturnType<typeof setTimeout> | undefined
  const previous = new Map<number, DataExport['status']>()

  const hasActive = computed(() => items.value.some(item => item.status === 'pending' || item.status === 'processing'))

  function schedule(): void {
    clearTimeout(timer)
    if (!hasActive.value) return
    timer = setTimeout(async () => {
      await refresh().catch(() => {})
      schedule()
    }, POLL_INTERVAL_MS)
  }

  watch(items, (list) => {
    for (const item of list) {
      const before = previous.get(item.id)
      if ((before === 'pending' || before === 'processing') && item.status === 'ready') {
        toast.add({ title: 'Tu exportación está lista', description: item.title, icon: 'i-lucide-circle-check', color: 'success' })
      } else if ((before === 'pending' || before === 'processing') && item.status === 'failed') {
        toast.add({ title: 'No se pudo generar la exportación', description: item.errorMessage ?? item.title, color: 'error' })
      }
      previous.set(item.id, item.status)
    }
  }, { immediate: true })

  onMounted(() => {
    watch(hasActive, schedule, { immediate: true })
  })
  onBeforeUnmount(() => clearTimeout(timer))
}
