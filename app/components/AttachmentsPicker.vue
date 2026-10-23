<script setup lang="ts">
import {
  UPLOAD_ATTACHMENTS_ACCEPT,
  UPLOAD_ATTACHMENTS_HELP,
  UPLOAD_ATTACHMENTS_MAX_FILES,
  validateUploadAttachments
} from '#shared/utils/attachments'

/**
 * Selector de hasta 3 adjuntos (30 MB en total) con barra de cuota. Valida en
 * cliente con la misma política que aplica el servidor.
 */
const files = defineModel<File[]>({ default: () => [] })

withDefaults(
  defineProps<{
    disabled?: boolean
    /** Texto del botón para sumar archivos. */
    label?: string
  }>(),
  { disabled: false, label: 'Adjuntar archivos' }
)

const fileInput = ref<HTMLInputElement | null>(null)
const error = ref<string | null>(null)

const canAddMore = computed(() => files.value.length < UPLOAD_ATTACHMENTS_MAX_FILES)
const quotaFiles = computed(() => files.value.map(file => ({ name: file.name, sizeBytes: file.size })))

watch(() => files.value.length, (length) => {
  if (length === 0) error.value = null
})

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  input.value = ''
  if (selected.length === 0) return

  const candidate = [...files.value, ...selected]
  const validationError = validateUploadAttachments(candidate)
  if (validationError) {
    error.value = validationError
    return
  }
  error.value = null
  files.value = candidate
}

function removeFile(index: number): void {
  error.value = null
  files.value = files.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-2">
    <AttachmentsQuota :files="quotaFiles">
      <template #actions="{ index }">
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          :disabled="disabled"
          :aria-label="`Quitar ${files[index]?.name ?? 'archivo'}`"
          @click="removeFile(index)"
        />
      </template>
    </AttachmentsQuota>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        v-if="canAddMore"
        icon="i-lucide-paperclip"
        :label="files.length > 0 ? 'Sumar otro archivo' : label"
        color="neutral"
        variant="subtle"
        size="sm"
        :disabled="disabled"
        @click="fileInput?.click()"
      />
      <span
        v-if="files.length > 0"
        class="text-xs text-muted"
      >
        {{ files.length }} de {{ UPLOAD_ATTACHMENTS_MAX_FILES }} archivos
      </span>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="UPLOAD_ATTACHMENTS_ACCEPT"
      class="hidden"
      @change="onFileChange"
    >

    <p
      v-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>
    <p
      v-else-if="files.length === 0"
      class="text-xs text-muted"
    >
      {{ UPLOAD_ATTACHMENTS_HELP }}
    </p>
  </div>
</template>
