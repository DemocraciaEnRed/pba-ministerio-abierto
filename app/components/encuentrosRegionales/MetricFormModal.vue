<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { UpdateMetricInput } from '#shared/schemas/regional-meetings'

export interface AdminMetric {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
}

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminMetric | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<UpdateMetricInput>>()

const saving = ref(false)

const state = reactive<UpdateMetricInput>({
  label: '',
  value: ''
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

function hydrate() {
  const values = props.initialValues
  state.label = values?.label ?? ''
  state.value = values?.value ?? ''
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit() {
  if (!props.initialValues) return

  saving.value = true

  try {
    await $fetch(`/api/regional-meetings/metrics/${props.initialValues.id}`, {
      method: 'PATCH',
      body: {
        label: state.label,
        value: state.value
      }
    })

    toast.add({
      title: 'Métrica actualizada',
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
    title="Editar métrica"
    description="Las métricas son un conjunto fijo: podés editar el número y su etiqueta."
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Identificador">
          <UInput
            :model-value="initialValues?.key ?? ''"
            disabled
            class="w-full font-mono"
          />
        </UFormField>

        <UFormField
          label="Valor"
          name="value"
          help="Texto libre para admitir formatos como «1.050» o «+40»."
          required
        >
          <UInput
            v-model="state.value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Etiqueta"
          name="label"
          required
        >
          <UInput
            v-model="state.label"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        />
        <UButton
          label="Guardar"
          color="primary"
          type="submit"
          :form="formId"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
