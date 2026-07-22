<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui'
import { CreateConsultationLinkSchema, type CreateConsultationLinkInput } from '#shared/schemas/consultationLink'

export interface AdminLink {
  id: number
  label: string
  url: string
  displayOrder: number
}

const props = withDefaults(defineProps<{
  open: boolean
  /** Endpoint base de enlaces de la entidad, ej. `/api/consultations/mi-slug/links`. */
  basePath: string
  initialValues?: AdminLink | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<CreateConsultationLinkInput>>()

const saving = ref(false)

interface LinkFormState {
  label: string
  url: string
  displayOrder: number
}

const state = reactive<LinkFormState>({
  label: '',
  url: '',
  displayOrder: 0
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const isEdit = computed(() => props.initialValues != null)

function hydrate() {
  const values = props.initialValues
  state.label = values?.label ?? ''
  state.url = values?.url ?? ''
  state.displayOrder = values?.displayOrder ?? 0
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit(event: FormSubmitEvent<CreateConsultationLinkInput>) {
  saving.value = true
  const data = event.data
  try {
    if (isEdit.value && props.initialValues) {
      await $fetch(`${props.basePath}/${props.initialValues.id}`, {
        method: 'PUT',
        body: {
          label: data.label,
          url: data.url,
          displayOrder: data.displayOrder
        }
      })
    } else {
      await $fetch(props.basePath, {
        method: 'POST',
        body: {
          label: data.label,
          url: data.url,
          displayOrder: data.displayOrder
        }
      })
    }

    toast.add({
      title: isEdit.value ? 'Enlace actualizado' : 'Enlace creado',
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
    :title="isEdit ? 'Editar enlace' : 'Nuevo enlace'"
    description="Gestioná los enlaces relacionados que ve la ciudadanía."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="CreateConsultationLinkSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Texto del enlace"
          name="label"
          help="Nombre visible del enlace (por ejemplo, «Documento de la propuesta»)."
          required
        >
          <UInput
            v-model="state.label"
            :maxlength="120"
            placeholder="Ej.: Documento de la propuesta"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="URL"
          name="url"
          help="Dirección completa, incluyendo http:// o https://."
          required
        >
          <UInput
            v-model="state.url"
            type="url"
            placeholder="https://ejemplo.gob.ar/documento.pdf"
            class="w-full"
          />
        </UFormField>

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
          :label="isEdit ? 'Guardar cambios' : 'Crear enlace'"
          icon="i-lucide-save"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
