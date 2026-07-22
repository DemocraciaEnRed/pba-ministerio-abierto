<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { UpdateGalleryImageSchema, type UpdateGalleryImageInput } from '#shared/schemas/galleryImage'

export interface AdminGalleryImage {
  id: number
  assetId: number
  displayOrder: number
  title: string | null
  altText: string | null
  description: string | null
  filename: string | null
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

const props = withDefaults(defineProps<{
  open: boolean
  /** Endpoint base de la galería de la entidad, ej. `/api/consultations/mi-slug/gallery`. */
  basePath: string
  initialValues?: AdminGalleryImage | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

const toast = useToast()
const formId = useId()
const formRef = ref<Form<UpdateGalleryImageInput>>()

const saving = ref(false)
const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const fileError = ref<string | null>(null)

interface GalleryFormState {
  title: string
  altText: string
  description: string
  displayOrder: number
  isPublic: boolean
}

const state = reactive<GalleryFormState>({
  title: '',
  altText: '',
  description: '',
  displayOrder: 0,
  isPublic: true
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const editSchema = computed(() => (isEdit.value ? UpdateGalleryImageSchema : undefined))

const publicDescription = computed(() =>
  state.isPublic
    ? 'La imagen se muestra en la galería de la página pública.'
    : 'La imagen queda oculta en la página pública.'
)

function clearPreview() {
  if (filePreview.value) {
    URL.revokeObjectURL(filePreview.value)
    filePreview.value = null
  }
}

function hydrate() {
  const values = props.initialValues
  state.title = values?.title ?? ''
  state.altText = values?.altText ?? ''
  state.description = values?.description ?? ''
  state.displayOrder = values?.displayOrder ?? 0
  state.isPublic = values?.isPublic ?? true
  selectedFile.value = null
  fileError.value = null
  clearPreview()
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

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

async function onSubmit(event: FormSubmitEvent<UpdateGalleryImageInput>) {
  saving.value = true
  try {
    if (isEdit.value && props.initialValues) {
      const data = event.data
      await $fetch(`${props.basePath}/${props.initialValues.id}`, {
        method: 'PATCH',
        body: {
          title: data.title,
          altText: data.altText,
          description: data.description,
          displayOrder: data.displayOrder,
          isPublic: data.isPublic
        }
      })
    } else {
      if (!selectedFile.value) {
        fileError.value = 'Adjuntá una imagen.'
        return
      }
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (state.title.trim()) formData.append('title', state.title.trim())
      if (state.altText.trim()) formData.append('altText', state.altText.trim())
      if (state.description.trim()) formData.append('description', state.description.trim())
      await $fetch(props.basePath, {
        method: 'POST',
        body: formData
      })
    }

    toast.add({
      title: isEdit.value ? 'Imagen actualizada' : 'Imagen subida',
      color: 'success'
    })

    isOpen.value = false
    emit('saved')
  } catch (error) {
    if (!applyServerErrors(formRef.value, error)) {
      toast.add({
        title: 'No se pudo guardar',
        description: getErrorMessage(error),
        color: 'error'
      })
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="isEdit ? 'Editar imagen' : 'Subir imagen'"
    description="Gestioná las imágenes de la galería."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="editSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          v-if="!isEdit"
          label="Imagen"
          name="file"
          :error="fileError || undefined"
          required
          help="Imágenes JPG, PNG, WebP o GIF. Máximo 15 MB."
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

        <div
          v-if="!isEdit && filePreview"
          class="overflow-hidden rounded-md border border-default"
        >
          <img
            :src="filePreview"
            alt="Vista previa de la imagen a subir"
            class="max-h-48 w-full bg-elevated object-contain"
          >
        </div>

        <div
          v-else-if="isEdit && props.initialValues?.url"
          class="overflow-hidden rounded-md border border-default"
        >
          <img
            :src="props.initialValues.url"
            :alt="props.initialValues.altText || props.initialValues.title || 'Imagen de la galería'"
            class="max-h-48 w-full bg-elevated object-contain"
          >
        </div>

        <UFormField
          label="Epígrafe"
          name="title"
          help="Texto breve que se muestra debajo de la imagen. Opcional."
        >
          <UInput
            v-model="state.title"
            class="w-full"
            placeholder="Ej.: Asamblea vecinal, marzo 2026"
          />
        </UFormField>

        <UFormField
          label="Texto alternativo (alt)"
          name="altText"
          help="Describe la imagen para lectores de pantalla y accesibilidad."
        >
          <UInput
            v-model="state.altText"
            class="w-full"
            placeholder="Ej.: Personas participando en una asamblea al aire libre"
          />
        </UFormField>

        <UFormField
          label="Descripción"
          name="description"
          help="Texto más extenso opcional para acompañar la imagen."
        >
          <UTextarea
            v-model="state.description"
            :rows="3"
            class="w-full"
            placeholder="Detalle o contexto de la imagen."
          />
        </UFormField>

        <template v-if="isEdit">
          <UFormField
            label="Orden"
            name="displayOrder"
            help="Menor número aparece primero."
          >
            <UInput
              v-model.number="state.displayOrder"
              type="number"
              min="0"
              class="w-full"
            />
          </UFormField>

          <USwitch
            v-model="state.isPublic"
            label="Visible en la galería"
            :description="publicDescription"
          />
        </template>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        />
        <UButton
          type="submit"
          :form="formId"
          :label="isEdit ? 'Guardar cambios' : 'Subir imagen'"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
