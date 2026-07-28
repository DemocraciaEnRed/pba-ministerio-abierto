<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import {
  RegionalMeetingSubmissionLinkSchema,
  type RegionalMeetingSubmissionLinkInput
} from '#shared/schemas/regional-meetings'

defineOptions({ name: 'EncuentrosRegionalesSubmissionLinkModal' })

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add': [link: RegionalMeetingSubmissionLinkInput]
}>()

type Schema = RegionalMeetingSubmissionLinkInput

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const formRef = ref<Form<Schema>>()

const state = reactive<{ url?: string, title?: string }>({
  url: undefined,
  title: undefined
})

function resetState() {
  state.url = undefined
  state.title = undefined
}

// Al abrir/cerrar el modal limpiamos el formulario.
watch(isOpen, (open) => {
  if (!open) resetState()
})

function handleSubmit(event: FormSubmitEvent<Schema>) {
  emit('add', event.data)
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Agregar un enlace"
    description="Pegá la URL del archivo en la nube. Asegurate de que sea públicamente accesible."
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="RegionalMeetingSubmissionLinkSchema"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="URL"
          name="url"
          required
        >
          <UInput
            v-model="state.url"
            type="url"
            inputmode="url"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Título o descripción del enlace"
          name="title"
          hint="Opcional"
        >
          <UInput
            v-model="state.title"
            placeholder="Ej: Proyecto de obra hídrica (PDF)"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            type="submit"
            label="Agregar enlace"
            icon="lucide:plus"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
