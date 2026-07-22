<script setup lang="ts">
import type { ConsultationFormInitialValues, ConsultationFormPayload, ConsultationFormTopic } from '~/components/admin/ConsultationForm.vue'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Editar consulta')

const toast = useToast()
const saving = ref(false)

const { slug, data: consultation, status, error } = useConsultationAdmin()
const listLink = useConsultationsListLink()

interface AdminTopicWindow {
  id: number
  title: string
  participationStartsAt: string | null
  participationEndsAt: string | null
}

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: topics, refresh: refreshTopics } = await useAsyncData(
  () => `admin-consultation-topics-${slug.value}`,
  () => requestFetch<AdminTopicWindow[]>(`/api/consultations/${slug.value}/topics`),
  { watch: [slug] }
)

const formTopics = computed<ConsultationFormTopic[]>(() =>
  (topics.value ?? []).map(topic => ({
    id: topic.id,
    title: topic.title,
    participationStartsAt: topic.participationStartsAt,
    participationEndsAt: topic.participationEndsAt
  }))
)

const initialValues = computed<ConsultationFormInitialValues | null>(() => {
  if (!consultation.value) return null
  return {
    slug: consultation.value.slug,
    title: consultation.value.title,
    summary: consultation.value.summary,
    body: consultation.value.body,
    consultationFormat: consultation.value.consultationFormat,
    startsAt: consultation.value.startsAt,
    endsAt: consultation.value.endsAt,
    closedMessage: consultation.value.closedMessage,
    resultsVisibility: consultation.value.resultsVisibility
  }
})

async function updateConsultation(payload: ConsultationFormPayload) {
  if (!consultation.value) return
  saving.value = true
  try {
    await $fetch(`/api/consultations/${consultation.value.id}`, {
      method: 'PUT',
      body: payload
    })
    if (payload.adjustTopics) {
      await refreshTopics()
    }
    toast.add({
      title: 'Consulta actualizada',
      color: 'success'
    })
    await navigateTo(`/consultas/${payload.slug}/panel`)
  } catch (err) {
    const e = err as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo guardar la consulta',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
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
      :title="consultation?.title || 'Editar consulta'"
      description="Editá la información de la consulta ciudadana."
    />

    <UPageBody>
      <p
        v-if="status === 'pending'"
        class="text-sm text-muted"
      >
        Cargando consulta...
      </p>

      <UPageCard
        v-else-if="error || !consultation"
        class="space-y-2"
      >
        <p class="font-medium">
          No encontramos la consulta.
        </p>
        <UButton
          :to="listLink"
          label="Volver al listado"
          color="neutral"
          variant="ghost"
        />
      </UPageCard>

      <AdminConsultationForm
        v-else
        mode="edit"
        :initial-values="initialValues"
        :topics="formTopics"
        :loading="saving"
        @submit="updateConsultation"
        @cancel="navigateTo(`/consultas/${slug}/panel`)"
      />
    </UPageBody>
  </UPage>
</template>
