<script setup lang="ts">
import type { Form } from '@nuxt/ui'
import type { UpdateAgendaItemInput } from '#shared/schemas/regional-meetings'
import type { AgendaItemState } from '~/utils/estados'

export interface AdminAgendaItem {
  id: number
  location: string
  heldAt: string
  year: number | null
  state: AgendaItemState
  highlighted: boolean
  registrationUrl: string | null
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
  state: AgendaItemState
  highlighted: boolean
  registrationUrl: string
}

const state = reactive<AgendaFormState>({
  location: '',
  heldAt: null,
  year: null,
  state: 'scheduled',
  highlighted: false,
  registrationUrl: ''
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
  state.state = values?.state ?? 'scheduled'
  state.highlighted = values?.highlighted ?? false
  state.registrationUrl = values?.registrationUrl ?? ''
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
        state: state.state,
        highlighted: state.highlighted,
        registrationUrl: state.registrationUrl.trim() || null
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
    description="La región es fija. Podés editar el lugar, la fecha, el año, el estado y cómo se destaca en la timeline."
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
          label="Estado"
          name="state"
          help="Programado: aún no comenzó. Abierto: en curso o con inscripción abierta. Realizado: ya se celebró."
        >
          <USelect
            v-model="state.state"
            :items="agendaItemStateOptions"
            :icon="agendaItemStateBadge(state.state).icon"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Destacar en la agenda"
          name="highlighted"
          help="Resalta el ítem con un borde de color en la timeline pública."
        >
          <USwitch v-model="state.highlighted" />
        </UFormField>

        <UFormField
          label="URL de inscripción"
          name="registrationUrl"
          help="Opcional. Si está vacía, el botón «Inscribite» no se muestra."
        >
          <UInput
            v-model="state.registrationUrl"
            type="url"
            placeholder="https://…"
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
