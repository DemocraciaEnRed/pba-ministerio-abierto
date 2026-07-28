<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { UpdateAgendaItemInput } from '#shared/schemas/regional-meetings'

export interface AdminAgendaItem {
  id: number
  location: string
  heldAt: string
  year: number | null
  held: boolean
  region: {
    id: number
    slug: string
    name: string
  }
}

const props = withDefaults(defineProps<{
  open: boolean
  initialValues?: AdminAgendaItem | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<UpdateAgendaItemInput>>()

const saving = ref(false)

interface AgendaFormState {
  location: string
  heldAt: string | null
  year: number | null
  held: boolean
}

const state = reactive<AgendaFormState>({
  location: '',
  heldAt: null,
  year: null,
  held: false
})

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const yearInput = computed<number | undefined>({
  get: () => state.year ?? undefined,
  set: (value) => {
    state.year = value === undefined || value === null || Number.isNaN(value) ? null : value
  }
})

function hydrate() {
  const values = props.initialValues
  state.location = values?.location ?? ''
  state.heldAt = values?.heldAt ?? null
  state.year = values?.year ?? null
  state.held = values?.held ?? false
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit() {
  if (!props.initialValues) return

  saving.value = true

  try {
    await $fetch(`/api/regional-meetings/agenda/${props.initialValues.id}`, {
      method: 'PATCH',
      body: {
        location: state.location,
        heldAt: state.heldAt,
        year: state.year,
        held: state.held
      }
    })

    toast.add({
      title: 'Ítem de agenda actualizado',
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
    title="Editar ítem de agenda"
    description="La región es fija. Podés editar el lugar, la fecha, el año y si ya se celebró."
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
        <UFormField label="Región">
          <UInput
            :model-value="initialValues?.region.name ?? ''"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Lugar"
          name="location"
          help="Texto libre (por ejemplo, la ciudad donde se realiza el encuentro)."
          required
        >
          <UInput
            v-model="state.location"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Fecha"
          name="heldAt"
          required
        >
          <DateTimeField v-model="state.heldAt" />
        </UFormField>

        <UFormField
          label="Año"
          name="year"
          help="Marca de año al inicio del segmento en la timeline. Opcional."
        >
          <UInput
            v-model.number="yearInput"
            type="number"
            :min="2000"
            :max="2100"
            placeholder="Sin marca de año"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="¿Ya se celebró?"
          name="held"
        >
          <USwitch v-model="state.held" />
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
