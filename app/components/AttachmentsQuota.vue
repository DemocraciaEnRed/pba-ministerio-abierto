<script setup lang="ts">
import {
  formatFileSize,
  UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES,
  UPLOAD_ATTACHMENTS_MAX_TOTAL_LABEL
} from '#shared/utils/attachments'

/**
 * Barra de cuota de adjuntos: muestra cuánto ocupa cada archivo de los 30 MB
 * disponibles por envío. La leyenda lista cada archivo (nombre + peso) con el
 * color de su segmento; el slot `actions` agrega botones por archivo (quitar,
 * descargar).
 */
export interface AttachmentsQuotaFile {
  name: string
  sizeBytes: number | null
}

const props = withDefaults(
  defineProps<{
    files: AttachmentsQuotaFile[]
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

defineSlots<{
  actions?: (props: { index: number }) => unknown
}>()

const SEGMENT_COLORS = ['primary', 'secondary', 'info'] as const

const items = computed(() =>
  props.files.map((file, index) => ({
    label: file.name,
    value: file.sizeBytes ?? 0,
    color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    sizeBytes: file.sizeBytes
  }))
)

const totalBytes = computed(() =>
  props.files.reduce((total, file) => total + (file.sizeBytes ?? 0), 0)
)
</script>

<template>
  <div
    v-if="files.length > 0"
    class="space-y-1.5"
  >
    <div class="flex items-center justify-between gap-2 text-xs text-muted">
      <span>Espacio usado</span>
      <span>{{ formatFileSize(totalBytes) || '0 B' }} de {{ UPLOAD_ATTACHMENTS_MAX_TOTAL_LABEL }}</span>
    </div>
    <UProgressGroup
      :items="items"
      :max="UPLOAD_ATTACHMENTS_MAX_TOTAL_BYTES"
      :size="size"
      :ui="{ list: 'gap-1.5', item: 'text-sm', itemTrailing: 'flex items-center gap-1 text-xs' }"
    >
      <template #item-trailing="{ item, index }">
        <span>{{ formatFileSize(item.sizeBytes) }}</span>
        <slot
          name="actions"
          :index="index"
        />
      </template>
    </UProgressGroup>
  </div>
</template>
