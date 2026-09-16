<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import {
  CreateObservatoryVideoSchema,
  type CreateObservatoryVideoInput
} from '#shared/schemas/observatory'
import { extractYoutubeId, youtubeThumbnailUrl } from '#shared/utils/youtube'
import type { AdminObservatoryVideoDTO } from '~~/server/utils/serializers/observatoryVideo'

defineOptions({ name: 'ObservatorioVideoFormModal' })

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminObservatoryVideoDTO | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateObservatoryVideoInput>>()

const saving = ref(false)

const state = reactive<{
  title: string
  youtubeUrl: string
  videoDate: string
  isActive: boolean
  displayOrder: number
}>({
  title: '',
  youtubeUrl: '',
  videoDate: '',
  isActive: true,
  displayOrder: 0
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

// El thumbnail se deriva del ID; sirve de vista previa mientras se pega el link.
const thumbnailPreview = computed(() => {
  const videoId = extractYoutubeId(state.youtubeUrl)
  return videoId ? youtubeThumbnailUrl(videoId) : null
})

const activeDescription = computed(() =>
  state.isActive
    ? 'El video se muestra en el carrusel de la página del Observatorio.'
    : 'El video queda oculto en la página pública.'
)

function hydrate() {
  const values = props.initialValues
  state.title = values?.title ?? ''
  state.youtubeUrl = values?.youtubeUrl ?? ''
  state.videoDate = values?.videoDate ?? ''
  state.isActive = values?.isActive ?? true
  state.displayOrder = values?.displayOrder ?? 0
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit(event: FormSubmitEvent<CreateObservatoryVideoInput>) {
  saving.value = true
  const data = event.data

  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`/api/observatory-videos/${props.initialValues.id}`, {
        method: 'PATCH',
        body: data
      })
    } else {
      await $fetch('/api/observatory-videos', {
        method: 'POST',
        body: data
      })
    }

    toast.add({
      title: isEdit.value ? 'Video actualizado' : 'Video agregado',
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
    :title="isEdit ? 'Editar video' : 'Nuevo video'"
    description="Registro audiovisual del Observatorio de Obras y Servicios Públicos."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateObservatoryVideoSchema"
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
          label="Enlace de YouTube"
          name="youtubeUrl"
          help="La portada se toma automáticamente del video."
          required
        >
          <UInput
            v-model="state.youtubeUrl"
            type="url"
            inputmode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full"
          />
        </UFormField>

        <div
          v-if="thumbnailPreview"
          class="overflow-hidden rounded-lg border border-default"
        >
          <img
            :src="thumbnailPreview"
            :alt="state.title || 'Vista previa del video'"
            class="aspect-video w-full object-cover"
          >
        </div>

        <UFormField
          label="Fecha del video"
          name="videoDate"
          help="Opcional."
        >
          <UInput
            v-model="state.videoDate"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Orden"
          name="displayOrder"
          help="Menor número aparece primero en el carrusel."
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
          :label="isEdit ? 'Guardar cambios' : 'Agregar video'"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
