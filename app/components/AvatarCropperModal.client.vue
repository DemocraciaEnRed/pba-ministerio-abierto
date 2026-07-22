<script setup lang="ts">
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps<{
  /** Controla la visibilidad del modal (v-model:open). */
  open: boolean
  /** URL (object URL) de la imagen original a recortar. */
  src: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'cropped': [file: File]
}>()

/** Lado del avatar exportado, en píxeles. */
const OUTPUT_SIZE = 512

interface CropperResult {
  canvas?: HTMLCanvasElement
}

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const cropperRef = ref<{ getResult: () => CropperResult } | null>(null)
const processing = ref(false)

function close() {
  isOpen.value = false
}

async function confirm() {
  const result = cropperRef.value?.getResult()
  const sourceCanvas = result?.canvas
  if (!sourceCanvas) return

  processing.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(sourceCanvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', 0.92)
    )
    if (!blob) return

    emit('cropped', new File([blob], 'avatar.webp', { type: 'image/webp' }))
    isOpen.value = false
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <UModal
    :open="isOpen"
    title="Recortar foto de perfil"
    description="Arrastrá y redimensioná para elegir el encuadre."
    @update:open="(value) => { if (!value) close() }"
  >
    <template #body>
      <div
        v-if="src"
        class="avatar-cropper-wrapper"
      >
        <Cropper
          ref="cropperRef"
          class="avatar-cropper"
          :src="src"
          :stencil-component="CircleStencil"
          :stencil-props="{ aspectRatio: 1 }"
          image-restriction="stencil"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="processing"
          @click="close"
        />
        <UButton
          label="Usar esta foto"
          icon="i-lucide-check"
          :loading="processing"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.avatar-cropper-wrapper {
  background: var(--ui-bg-muted, #f3f4f6);
  border-radius: var(--ui-radius, 0.5rem);
  overflow: hidden;
}

.avatar-cropper {
  max-height: 60vh;
}
</style>
