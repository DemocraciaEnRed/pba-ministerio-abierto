<script setup lang="ts">
import type { z } from 'zod'
import type { Form } from '@nuxt/ui'
import type { ConsultationRegistrationFormInput } from '#shared/schemas/consultation-registrations'
import { ConsultationRegistrationFormSchema } from '#shared/schemas/consultation-registrations'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { PROVINCES, type Province } from '#shared/data/argentina'

const props = withDefaults(defineProps<{
  open: boolean
  consultationSlug: string
  eventNoun: string
  initialValues?: AdminConsultationRegistrationFormDTO | null
}>(), {
  initialValues: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const toast = useToast()
const formId = useId()
const formRef = ref<Form<ConsultationRegistrationFormInput>>()

const saving = ref(false)

interface RegistrationFormState {
  title: string
  eventAt: string | null
  opensAt: string | null
  closesAt: string | null
  venueName: string
  venueAddress: string
  venueCity: string
  venueProvince: Province
}

const state = reactive<RegistrationFormState>({
  title: '',
  eventAt: null,
  opensAt: null,
  closesAt: null,
  venueName: '',
  venueAddress: '',
  venueCity: '',
  venueProvince: 'Buenos Aires'
})

// `DateTimeField` usa `null` para "sin valor"; el esquema espera `string`.
// El puente es seguro porque la validación del `UForm` rechaza los nulos.
const formState = computed(
  () => state as unknown as Partial<z.input<typeof ConsultationRegistrationFormSchema>>
)

const isEdit = computed(() => Boolean(props.initialValues))

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

function hydrate() {
  const values = props.initialValues
  state.title = values?.title ?? ''
  state.eventAt = values?.eventAt ?? null
  state.opensAt = values?.opensAt ?? null
  state.closesAt = values?.closesAt ?? null
  state.venueName = values?.venueName ?? ''
  state.venueAddress = values?.venueAddress ?? ''
  state.venueCity = values?.venueCity ?? ''
  state.venueProvince = (values?.venueProvince as Province | undefined) ?? 'Buenos Aires'
  formRef.value?.clear()
}

watch(() => props.open, (open) => {
  if (open) hydrate()
})

async function onSubmit() {
  saving.value = true

  try {
    await $fetch(`/api/consultations/${props.consultationSlug}/registration-form`, {
      method: isEdit.value ? 'PATCH' : 'POST',
      body: {
        title: state.title,
        eventAt: state.eventAt,
        opensAt: state.opensAt,
        closesAt: state.closesAt,
        venueName: state.venueName,
        venueAddress: state.venueAddress,
        venueCity: state.venueCity,
        venueProvince: state.venueProvince
      }
    })

    toast.add({
      title: isEdit.value ? 'Formulario actualizado' : 'Formulario creado',
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
    :title="isEdit ? 'Editar formulario de inscripción' : 'Crear formulario de inscripción'"
    :description="`Definí la fecha de la ${eventNoun}, la ventana de inscripción y el lugar donde se realiza.`"
    :dismissible="!saving"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        :id="formId"
        ref="formRef"
        :schema="ConsultationRegistrationFormSchema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Título"
          name="title"
          :help="`Cómo se identifica la ${eventNoun} en el formulario y en el correo de confirmación.`"
          required
        >
          <UInput
            v-model="state.title"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="`Fecha de la ${eventNoun}`"
          name="eventAt"
          required
        >
          <DateTimeField v-model="state.eventAt" />
        </UFormField>

        <UFormField
          label="Apertura de inscripciones"
          name="opensAt"
          required
        >
          <DateTimeField v-model="state.opensAt" />
        </UFormField>

        <UFormField
          label="Cierre de inscripciones"
          name="closesAt"
          required
        >
          <DateTimeField v-model="state.closesAt" />
        </UFormField>

        <UFormField
          label="Lugar"
          name="venueName"
          help="Nombre del espacio físico (por ejemplo, Teatro Municipal)."
          required
        >
          <UInput
            v-model="state.venueName"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Dirección"
          name="venueAddress"
          required
        >
          <UInput
            v-model="state.venueAddress"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Ciudad"
          name="venueCity"
          required
        >
          <UInput
            v-model="state.venueCity"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Provincia"
          name="venueProvince"
          required
        >
          <USelectMenu
            v-model="state.venueProvince"
            :items="[...PROVINCES]"
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
          :label="isEdit ? 'Guardar cambios' : 'Crear formulario'"
          type="submit"
          :form="formId"
          :loading="saving"
        />
      </div>
    </template>
  </USlideover>
</template>
