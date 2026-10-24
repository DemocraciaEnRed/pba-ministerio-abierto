import { LazyExportsRequestModal } from '#components'
import type { DataExport, DataExportRequest } from '~/types/exports'

export interface RequestExportOptions {
  /** Aclaración que se muestra en la confirmación (qué incluye el archivo). */
  detail?: string
}

/**
 * Pedido de exportaciones CSV. Abre un diálogo que pide confirmación, crea la
 * exportación (que se genera en segundo plano) y luego indica dónde
 * descargarla. Resuelve con la exportación creada o `null` si se canceló.
 */
export function useDataExport() {
  const overlay = useOverlay()
  const modal = overlay.create(LazyExportsRequestModal)
  const requesting = ref(false)

  async function requestExport(request: DataExportRequest, options: RequestExportOptions = {}): Promise<DataExport | null> {
    if (requesting.value) return null
    requesting.value = true
    try {
      return (await modal.open({ request, detail: options.detail })) ?? null
    } finally {
      requesting.value = false
    }
  }

  return { requesting, requestExport }
}

/** Contador compartido que cambia cada vez que se pide una exportación. */
export function useDataExportsVersion() {
  return useState('data-exports-version', () => 0)
}
