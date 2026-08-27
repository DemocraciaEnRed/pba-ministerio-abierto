<script setup lang="ts">
import type { RegistrationFormPayload } from '~/components/consultas/RegistrationForm.vue'
import type { AdminConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { registrationEventNoun } from '#shared/data/consultation-registrations'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Editar formulario de inscripción')

const { slug, data: consultation } = useConsultationAdmin()
const requestFetch = useRequestFetch()
const toast = useToast()
const saving = ref(false)

const kind = computed(() => consultationTypeRegistrationKind(consultation.value?.section?.slug))
const eventNoun = computed(() => (kind.value ? registrationEventNoun(kind.value) : 'instancia'))

const backLink = computed(() => `/consultas/${slug.value}/panel/inscripciones`)

const { data: form, status, error } = await useAsyncData(
  () => `admin-consultation-registration-form-edit-${slug.value}`,
  async () => {
    try {
      return await requestFetch<AdminConsultationRegistrationFormDTO>(
        `/api/consultations/${slug.value}/registration-form`
      )
    } catch {
      return null
    }
  },
  { watch: [slug] }
)

async function updateForm(payload: RegistrationFormPayload) {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/registration-form`, {
      method: 'PATCH',
      body: payload
    })
    toast.add({ title: 'Formulario actualizado', color: 'success' })
    await navigateTo(backLink.value)
  } catch (err) {
    toast.add({
      title: 'No se pudo guardar el formulario',
      description: getErrorMessage(err),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Editar formulario de inscripción"
      :description="`Editá el contenido, la fecha de la ${eventNoun}, la ventana de inscripción y el lugar.`"
    >
      <template #links>
        <UButton
          label="Volver"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :to="backLink"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <p
        v-if="status === 'pending'"
        class="text-sm text-muted"
      >
        Cargando formulario...
      </p>

      <UPageCard
        v-else-if="error || !form"
        class="space-y-2"
      >
        <p class="font-medium">
          Esta consulta todavía no tiene formulario de inscripción.
        </p>
        <UButton
          :to="backLink"
          label="Volver"
          color="neutral"
          variant="ghost"
        />
      </UPageCard>

      <ConsultasRegistrationForm
        v-else
        mode="edit"
        :event-noun="eventNoun"
        :initial-values="form"
        :loading="saving"
        @submit="updateForm"
        @cancel="navigateTo(backLink)"
      />
    </UPageBody>
  </UPage>
</template>
