<script setup lang="ts">
import { formatFileSize, type AttachmentFileDTO } from '#shared/utils/attachments'

/**
 * Badge "N adjuntos" que abre un popover para elegir qué archivo descargar.
 * Pensado para tablas y listados compactos.
 */
const props = withDefaults(
  defineProps<{
    attachments: AttachmentFileDTO[]
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { size: 'sm' }
)

const label = computed(() =>
  props.attachments.length === 1 ? '1 adjunto' : `${props.attachments.length} adjuntos`
)
</script>

<template>
  <UPopover
    v-if="attachments.length > 0"
    :content="{ align: 'start' }"
  >
    <UButton
      :label="label"
      icon="i-lucide-paperclip"
      color="neutral"
      variant="subtle"
      :size="size"
    />

    <template #content>
      <ul class="w-72 space-y-1 p-2">
        <li
          v-for="attachment in attachments"
          :key="attachment.id"
        >
          <UButton
            :to="attachment.downloadUrl"
            external
            download
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            block
            class="justify-start"
          >
            <span class="min-w-0 flex-1 truncate text-start">{{ attachment.filename }}</span>
            <span class="shrink-0 text-xs text-muted">{{ formatFileSize(attachment.sizeBytes) }}</span>
          </UButton>
        </li>
      </ul>
    </template>
  </UPopover>
</template>
