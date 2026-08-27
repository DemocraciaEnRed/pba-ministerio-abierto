<script setup lang="ts">
import type { RegistrationFormPayload } from '~/components/consultas/RegistrationForm.vue'
import { registrationEventNoun } from '#shared/data/consultation-registrations'
import { consultationTypeRegistrationKind } from '#shared/data/consultation-types'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Crear formulario de inscripción')

const { slug, data: consultation } = useConsultationAdmin()
const toast = useToast()
const saving = ref(false)

const kind = computed(() => consultationTypeRegistrationKind(consultation.value?.section?.slug))
const eventNoun = computed(() => (kind.value ? registrationEventNoun(kind.value) : 'instancia'))

const backLink = computed(() => `/consultas/${slug.value}/panel/inscripciones`)

async function createForm(payload: RegistrationFormPayload) {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/registration-form`, {
      method: 'POST',
      body: payload
    })
    toast.add({ title: 'Formulario creado', color: 'success' })
    await navigateTo(backLink.value)
  } catch (error) {
    toast.add({
      title: 'No se pudo crear el formulario',
      description: getErrorMessage(error),
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
      title="Crear formulario de inscripción"
      :description="`Definí el contenido, la fecha de la ${eventNoun}, la ventana de inscripción y el lugar donde se realiza.`"
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
      <ConsultasRegistrationForm
        mode="create"
        :event-noun="eventNoun"
        :loading="saving"
        @submit="createForm"
        @cancel="navigateTo(backLink)"
      />
    </UPageBody>
  </UPage>
</template>
