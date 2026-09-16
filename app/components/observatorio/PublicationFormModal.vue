<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import {
  CreateObservatoryPublicationSchema,
  type CreateObservatoryPublicationInput
} from '#shared/schemas/observatory'
import type { AdminObservatoryPublicationDTO } from '~~/server/utils/serializers/observatoryPublication'

defineOptions({ name: 'ObservatorioPublicationFormModal' })

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminObservatoryPublicationDTO | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateObservatoryPublicationInput>>()

const saving = ref(false)

const sourceItems = [
  { label: 'Subir PDF', value: 'pdf' as const },
  { label: 'URL de descarga', value: 'url' as const }
]
const sourceType = ref<'pdf' | 'url'>('pdf')

const state = reactive<{
  title: string
  description: string
  publicationYear: number
  coverAssetId: number | null
  documentAssetId: number | null
  externalUrl: string
  isActive: boolean
  displayOrder: number
}>({
  title: '',
  description: '',
  publicationYear: new Date().getFullYear(),
  coverAssetId: null,
  documentAssetId: null,
  externalUrl: '',
  isActive: true,
  displayOrder: 0
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

const activeDescription = computed(() =>
  state.isActive
    ? 'La publicación se muestra en la página del Observatorio.'
    : 'La publicación queda oculta en la página pública.'
)

function hydrate() {
  const values = props.initialValues
  state.title = values?.title ?? ''
  state.description = values?.description ?? ''
  state.publicationYear = values?.publicationYear ?? new Date().getFullYear()
  state.coverAssetId = values?.coverAssetId ?? null
  state.documentAssetId = values?.documentAssetId ?? null
  state.externalUrl = values?.externalUrl ?? ''
  state.isActive = values?.isActive ?? true
  state.displayOrder = values?.displayOrder ?? 0
  sourceType.value = values?.externalUrl ? 'url' : 'pdf'
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

// El PDF y la URL son excluyentes: al cambiar de fuente se limpia la otra.
watch(sourceType, (type) => {
  if (type === 'pdf') {
    state.externalUrl = ''
  } else {
    state.documentAssetId = null
  }
})

async function onSubmit(event: FormSubmitEvent<CreateObservatoryPublicationInput>) {
  saving.value = true
  const data = event.data

  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`/api/observatory-publications/${props.initialValues.id}`, {
        method: 'PATCH',
        body: data
      })
    } else {
      await $fetch('/api/observatory-publications', {
        method: 'POST',
        body: data
      })
    }

    toast.add({
      title: isEdit.value ? 'Publicación actualizada' : 'Publicación creada',
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
    :title="isEdit ? 'Editar publicación' : 'Nueva publicación'"
    description="Publicaciones del Observatorio de Obras y Servicios Públicos."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateObservatoryPublicationSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Título"
          name="title"
          required
        >
          <UInput
            v-model="state.title"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Descripción"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Año de publicación"
          name="publicationYear"
          required
        >
          <UInput
            v-model.number="state.publicationYear"
            type="number"
            :min="1900"
            :max="2100"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Portada"
          name="coverAssetId"
          help="Obligatoria. JPG, PNG, WebP o GIF."
          required
        >
          <AdminAssetUploader
            v-model="state.coverAssetId"
            media-type="image"
            accept="image/*"
            label="Subir portada"
          />
        </UFormField>

        <UFormField
          label="Archivo de descarga"
          name="documentAssetId"
          help="Subí un PDF o ingresá una URL de descarga."
        >
          <URadioGroup
            v-model="sourceType"
            :items="sourceItems"
            orientation="horizontal"
            class="mb-3"
          />
          <AdminAssetUploader
            v-if="sourceType === 'pdf'"
            v-model="state.documentAssetId"
            media-type="document"
            accept="application/pdf"
            label="Subir PDF"
          />
        </UFormField>

        <UFormField
          v-if="sourceType === 'url'"
          label="URL de descarga"
          name="externalUrl"
          required
        >
          <UInput
            v-model="state.externalUrl"
            type="url"
            inputmode="url"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Orden"
          name="displayOrder"
          help="Desempata publicaciones del mismo año; menor número aparece primero."
        >
          <UInput
            v-model.number="state.displayOrder"
            type="number"
            :min="0"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="state.isActive"
          label="Visible en la página pública"
          :description="activeDescription"
        />
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
          :label="isEdit ? 'Guardar cambios' : 'Crear publicación'"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
