<script setup lang="ts">
import type { AttachmentFileDTO } from '#shared/utils/attachments'

/**
 * Lista de adjuntos descargables (vistas de administración): barra de cuota
 * con un botón de descarga por archivo.
 */
const props = defineProps<{
  attachments: AttachmentFileDTO[]
}>()

const quotaFiles = computed(() =>
  props.attachments.map(attachment => ({ name: attachment.filename, sizeBytes: attachment.sizeBytes }))
)
</script>

<template>
  <AttachmentsQuota
    v-if="attachments.length > 0"
    :files="quotaFiles"
  >
    <template #actions="{ index }">
      <UTooltip
        arrow
        :text="`Descargar ${attachments[index]?.filename ?? 'adjunto'}`"
      >
        <UButton
          :to="attachments[index]?.downloadUrl"
          external
          download
          icon="i-lucide-download"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="`Descargar ${attachments[index]?.filename ?? 'adjunto'}`"
        />
      </UTooltip>
    </template>
  </AttachmentsQuota>
</template>
