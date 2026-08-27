<script setup lang="ts">
import { ConsultationRegistrationFormSchema } from '#shared/schemas/consultation-registrations'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { PROVINCES, type Province } from '#shared/data/argentina'

export interface RegistrationFormPayload {
  title: string
  body: string | null
  eventAt: string | null
  opensAt: string | null
  closesAt: string | null
  venueName: string
  venueAddress: string
  venueCity: string
  venueProvince: string
}

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  eventNoun: string
  initialValues?: AdminConsultationRegistrationFormDTO | null
  loading?: boolean
}>(), {
  initialValues: null,
  loading: false
})

const emit = defineEmits<{
  submit: [payload: RegistrationFormPayload]
  cancel: []
}>()

const form = reactive({
  title: '',
  body: '' as string | null,
  eventAt: null as string | null,
  opensAt: null as string | null,
  closesAt: null as string | null,
  venueName: '',
  venueAddress: '',
  venueCity: '',
  venueProvince: 'Buenos Aires' as Province
})

type FieldName = keyof RegistrationFormPayload
const errors = reactive<Partial<Record<FieldName, string>>>({})

function hydrate(values: AdminConsultationRegistrationFormDTO | null) {
  form.title = values?.title ?? ''
  form.body = values?.body ?? ''
  form.eventAt = values?.eventAt ?? null
  form.opensAt = values?.opensAt ?? null
  form.closesAt = values?.closesAt ?? null
  form.venueName = values?.venueName ?? ''
  form.venueAddress = values?.venueAddress ?? ''
  form.venueCity = values?.venueCity ?? ''
  form.venueProvince = (values?.venueProvince as Province | undefined) ?? 'Buenos Aires'
}

watch(() => props.initialValues, hydrate, { immediate: true })

function buildPayload(): RegistrationFormPayload {
  return {
    title: form.title.trim(),
    body: (form.body ?? '').trim() || null,
    eventAt: form.eventAt,
    opensAt: form.opensAt,
    closesAt: form.closesAt,
    venueName: form.venueName.trim(),
    venueAddress: form.venueAddress.trim(),
    venueCity: form.venueCity.trim(),
    venueProvince: form.venueProvince
  }
}

function clearErrors() {
  for (const key of Object.keys(errors) as FieldName[]) {
    errors[key] = undefined
  }
}

function validate(payload: RegistrationFormPayload): boolean {
  clearErrors()
  const result = ConsultationRegistrationFormSchema.safeParse(payload)
  if (result.success) return true

  for (const issue of result.error.issues) {
    const field = issue.path[0] as FieldName | undefined
    if (field && !errors[field]) {
      errors[field] = issue.message
    }
  }
  return false
}

function onSubmit() {
  const payload = buildPayload()
  if (!validate(payload)) return
  emit('submit', payload)
}

const titleMax = 200
</script>

<template>
  <form
    class="space-y-6"
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="Título"
      :description="`Cómo se identifica la ${eventNoun} en el formulario y en el correo de confirmación.`"
      required
      :error="errors.title"
      size="xl"
    >
      <template #hint>
        <span class="text-xs text-muted">{{ form.title.length }}/{{ titleMax }}</span>
      </template>
      <UInput
        v-model="form.title"
        :maxlength="titleMax"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Contenido"
      description="Cuerpo con formato que se muestra en la página de inscripción: presentación, requisitos y detalles. Admite formato enriquecido (Markdown)."
      :error="errors.body"
    >
      <template #hint>
        <UTooltip text="Podés usar títulos, listas, negritas y enlaces.">
          <UIcon
            name="i-lucide-info"
            class="text-muted"
          />
        </UTooltip>
      </template>
      <RichTextEditor
        v-model="form.body"
        placeholder="Escribí el contenido de la inscripción…"
      />
    </UFormField>

    <div class="grid gap-4 md:grid-cols-3">
      <UFormField
        :label="`Fecha de la ${eventNoun}`"
        name="eventAt"
        required
        :error="errors.eventAt"
      >
        <DateTimeField v-model="form.eventAt" />
      </UFormField>

      <UFormField
        label="Apertura de inscripciones"
        required
        :error="errors.opensAt"
      >
        <DateTimeField v-model="form.opensAt" />
      </UFormField>

      <UFormField
        label="Cierre de inscripciones"
        required
        :error="errors.closesAt"
      >
        <DateTimeField v-model="form.closesAt" />
      </UFormField>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <UFormField
        label="Lugar"
        description="Nombre del espacio físico (por ejemplo, Teatro Municipal)."
        required
        :error="errors.venueName"
      >
        <UInput
          v-model="form.venueName"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Dirección"
        required
        :error="errors.venueAddress"
      >
        <UInput
          v-model="form.venueAddress"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Ciudad"
        required
        :error="errors.venueCity"
      >
        <UInput
          v-model="form.venueCity"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Provincia"
        required
        :error="errors.venueProvince"
      >
        <USelectMenu
          v-model="form.venueProvince"
          :items="[...PROVINCES]"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="flex justify-end gap-2">
      <UButton
        label="Cancelar"
        color="neutral"
        variant="ghost"
        :disabled="loading"
        @click="emit('cancel')"
      />
      <UButton
        :label="mode === 'create' ? 'Crear formulario' : 'Guardar cambios'"
        type="submit"
        :loading="loading"
      />
    </div>
  </form>
</template>
