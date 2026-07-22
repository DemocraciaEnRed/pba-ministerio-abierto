<script setup lang="ts">
import type { TopicFormInitialValues, TopicFormPayload } from '~/components/admin/TopicForm.vue'

definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Editar tema')

const toast = useToast()
const saving = ref(false)

const { consultationSlug, topicSlug, data: topic, status, error, refresh } = useTopicAdmin()
const { data: consultation } = useConsultationAdmin()

const consultationDates = computed(() =>
  consultation.value
    ? { startsAt: consultation.value.startsAt, endsAt: consultation.value.endsAt }
    : null
)

const formRef = ref<{ applyServerErrors: (errors: { field: string, message: string }[]) => void } | null>(null)

const initialValues = computed<TopicFormInitialValues | null>(() => {
  if (!topic.value) return null
  return {
    slug: topic.value.slug,
    title: topic.value.title,
    summary: topic.value.summary,
    body: topic.value.body,
    mechanismType: topic.value.mechanismType,
    participationStartsAt: topic.value.participationStartsAt,
    participationEndsAt: topic.value.participationEndsAt,
    publishResultsWhenParticipationEnds: topic.value.publishResultsWhenParticipationEnds,
    displayOrder: topic.value.displayOrder
  }
})

async function updateTopic(payload: TopicFormPayload) {
  if (!topic.value) return
  saving.value = true
  try {
    await $fetch(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}`, {
      method: 'PUT',
      body: payload
    })
    toast.add({
      title: 'Tema actualizado',
      color: 'success'
    })
    await refresh()
    await navigateTo(`/consultas/${consultationSlug.value}/panel/temas/${payload.slug}`)
  } catch (err) {
    const e = err as { data?: { message?: string, data?: { field: string, message: string }[] }, message?: string }
    const fieldErrors = e.data?.data
    if (Array.isArray(fieldErrors) && fieldErrors.length) {
      formRef.value?.applyServerErrors(fieldErrors)
    }
    toast.add({
      title: 'No se pudo guardar el tema',
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
      :title="topic?.title || 'Editar tema'"
      description="Editá la información del tema de participación."
    />

    <UPageBody>
      <p
        v-if="status === 'pending'"
        class="text-sm text-muted"
      >
        Cargando tema...
      </p>

      <UPageCard
        v-else-if="error || !topic"
        class="space-y-2"
      >
        <p class="font-medium">
          No encontramos el tema.
        </p>
        <UButton
          :to="`/consultas/${consultationSlug}/panel/temas`"
          label="Volver a temas"
          color="neutral"
          variant="ghost"
        />
      </UPageCard>

      <AdminTopicForm
        v-else
        ref="formRef"
        mode="edit"
        :initial-values="initialValues"
        :consultation="consultationDates"
        :loading="saving"
        @submit="updateTopic"
        @cancel="navigateTo(`/consultas/${consultationSlug}/panel/temas/${topicSlug}`)"
      />
    </UPageBody>
  </UPage>
</template>
