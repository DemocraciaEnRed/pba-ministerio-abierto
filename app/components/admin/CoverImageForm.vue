<script setup lang="ts">
const props = defineProps<{
  /** Endpoint base de la portada de la entidad, ej. `/api/consultations/mi-slug/cover`. */
  basePath: string
  coverUrl: string | null
  coverAltText: string | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

const toast = useToast()

const saving = ref(false)
const removing = ref(false)
const confirmOpen = ref(false)

const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const fileError = ref<string | null>(null)
const altText = ref('')

const hasCover = computed(() => Boolean(props.coverUrl))
/** Imagen a mostrar en la vista previa: la recién elegida o la portada actual. */
const previewSrc = computed(() => filePreview.value ?? props.coverUrl)

function clearPreview() {
  if (filePreview.value) {
    URL.revokeObjectURL(filePreview.value)
    filePreview.value = null
  }
}

function hydrate() {
  altText.value = props.coverAltText ?? ''
  selectedFile.value = null
  fileError.value = null
  clearPreview()
}

// Rehidrata cuando el backend devuelve nuevos datos (tras subir/editar/eliminar).
watch(() => [props.coverUrl, props.coverAltText], hydrate, { immediate: true })

onBeforeUnmount(clearPreview)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  clearPreview()
  selectedFile.value = target.files && target.files.length > 0 ? target.files[0]! : null
  if (selectedFile.value) {
    fileError.value = null
    filePreview.value = URL.createObjectURL(selectedFile.value)
  }
}

async function onSubmit() {
  saving.value = true
  try {
    if (selectedFile.value) {
      // Subida/reemplazo de la imagen (incluye el alt en el mismo multipart).
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (altText.value.trim()) formData.append('altText', altText.value.trim())
      await $fetch(props.basePath, { method: 'POST', body: formData })
    } else if (hasCover.value) {
      // Solo se actualiza el texto alternativo de la portada existente.
      await $fetch(props.basePath, {
        method: 'PATCH',
        body: { altText: altText.value.trim() || null }
      })
    } else {
      fileError.value = 'Adjuntá una imagen para la portada.'
      return
    }

    toast.add({ title: 'Portada guardada', color: 'success' })
    emit('saved')
  } catch (error) {
    toast.add({
      title: 'No se pudo guardar',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function confirmRemove() {
  removing.value = true
  try {
    await $fetch(props.basePath, { method: 'DELETE' })
    toast.add({ title: 'Portada eliminada', color: 'success' })
    confirmOpen.value = false
    emit('saved')
  } catch (error) {
    toast.add({
      title: 'No se pudo eliminar',
      description: getErrorMessage(error),
      color: 'error'
    })
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="overflow-hidden rounded-lg border border-default bg-elevated">
      <img
        v-if="previewSrc"
        :src="previewSrc"
        :alt="coverAltText || 'Vista previa de la portada'"
        class="aspect-video w-full object-cover"
      >
      <div
        v-else
        class="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted"
      >
        <UIcon
          name="i-lucide-image"
          class="size-10"
        />
        <p class="text-sm">
          Sin portada
        </p>
      </div>
    </div>

    <UForm
      :state="{ altText }"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        :label="hasCover ? 'Reemplazar imagen' : 'Imagen'"
        name="file"
        :error="fileError || undefined"
        :required="!hasCover"
        help="Imágenes JPG, PNG, WebP o GIF. Máximo 15 MB. Se recomienda una relación de aspecto de 16:9."
      >
        <UInput
          type="file"
          :accept="ACCEPT"
          :disabled="saving"
          icon="i-lucide-upload"
          class="w-full"
          @change="onFileChange"
        />
      </UFormField>

      <UFormField
        label="Texto alternativo (alt)"
        name="altText"
        help="Describe la imagen para lectores de pantalla y accesibilidad."
      >
        <UInput
          v-model="altText"
          class="w-full"
          placeholder="Ej.: Vista aérea de la plaza principal del municipio"
        />
      </UFormField>

      <div class="flex flex-wrap items-center gap-3">
        <UButton
          type="submit"
          :label="hasCover ? 'Guardar cambios' : 'Subir portada'"
          icon="i-lucide-save"
          color="primary"
          :loading="saving"
        />
        <UButton
          v-if="hasCover"
          label="Eliminar portada"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          :disabled="saving"
          @click="confirmOpen = true"
        />
      </div>
    </UForm>

    <ConfirmModal
      v-model:open="confirmOpen"
      title="Eliminar portada"
      description="¿Seguro que querés eliminar la portada? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="removing"
      @confirm="confirmRemove"
    />
  </div>
</template>
