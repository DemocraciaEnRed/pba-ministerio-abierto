<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { UpdateAttachmentSchema, type UpdateAttachmentInput } from '#shared/schemas/attachment'

export interface AdminAttachment {
  id: number
  assetId: number
  displayOrder: number
  title: string | null
  filename: string | null
  mediaType: 'image' | 'document' | 'video' | 'audio' | 'other'
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

const props = withDefaults(defineProps<{
  open: boolean
  /** Endpoint base de archivos de la entidad, ej. `/api/consultations/mi-slug/attachments`. */
  basePath: string
  initialValues?: AdminAttachment | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*'

const toast = useToast()
const formId = useId()
const formRef = ref<Form<UpdateAttachmentInput>>()

const saving = ref(false)
const selectedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)

interface AttachmentFormState {
  title: string
  displayOrder: number
  isPublic: boolean
}

const state = reactive<AttachmentFormState>({
  title: '',
  displayOrder: 0,
  isPublic: true
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const editSchema = computed(() => (isEdit.value ? UpdateAttachmentSchema : undefined))

const publicDescription = computed(() =>
  state.isPublic
    ? 'El archivo se muestra en la página pública para descargar.'
    : 'El archivo queda oculto en la página pública.'
)

function hydrate() {
  const values = props.initialValues
  state.title = values?.title ?? ''
  state.displayOrder = values?.displayOrder ?? 0
  state.isPublic = values?.isPublic ?? true
  selectedFile.value = null
  fileError.value = null
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files && target.files.length > 0 ? target.files[0]! : null
  if (selectedFile.value) fileError.value = null
}

async function onSubmit(event: FormSubmitEvent<UpdateAttachmentInput>) {
  saving.value = true
  try {
    if (isEdit.value && props.initialValues) {
      const data = event.data
      await $fetch(`${props.basePath}/${props.initialValues.id}`, {
        method: 'PATCH',
        body: {
          title: data.title,
          displayOrder: data.displayOrder,
          isPublic: data.isPublic
        }
      })
    } else {
      if (!selectedFile.value) {
        fileError.value = 'Adjuntá un archivo.'
        return
      }
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      if (state.title.trim()) formData.append('title', state.title.trim())
      await $fetch(props.basePath, {
        method: 'POST',
        body: formData
      })
    }

    toast.add({
      title: isEdit.value ? 'Archivo actualizado' : 'Archivo subido',
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
    :title="isEdit ? 'Editar archivo' : 'Subir archivo'"
    description="Gestioná los archivos que la ciudadanía puede descargar."
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
          label="Archivo"
          name="file"
          :error="fileError || undefined"
          required
          help="Documentos (PDF, Word, Excel, CSV, TXT) o imágenes. Máximo 15 MB."
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
          v-else
          label="Archivo"
        >
          <div class="rounded-md border border-default px-3 py-2 text-sm">
            <p class="font-medium">
              {{ props.initialValues?.filename || `Archivo #${props.initialValues?.id}` }}
            </p>
            <p class="text-xs text-muted">
              {{ props.initialValues?.mimeType || 'Sin tipo' }}
            </p>
          </div>
        </UFormField>

        <UFormField
          label="Título"
          name="title"
          help="Nombre que se muestra en la lista de descargas. Si lo dejás vacío se usa el nombre del archivo."
        >
          <UInput
            v-model="state.title"
            class="w-full"
            placeholder="Ej.: Reglamento de la consulta"
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
            label="Visible para descargar"
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
          :label="isEdit ? 'Guardar cambios' : 'Subir archivo'"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
