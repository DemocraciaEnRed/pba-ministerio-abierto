<script setup lang="ts">
import type { TopicFormPayload } from '~/components/admin/TopicForm.vue'
import type { AdminTopicSummary } from '~/composables/useTopicAdmin'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Nuevo tema')

const route = useRoute()
const toast = useToast()
const saving = ref(false)

const consultationSlug = computed(() => String(route.params.slugConsulta))
const { data: consultation } = useConsultationAdmin()
const consultationDates = computed(() =>
  consultation.value
    ? { startsAt: consultation.value.startsAt, endsAt: consultation.value.endsAt }
    : null
)
const formRef = ref<{ applyServerErrors: (errors: { field: string, message: string }[]) => void } | null>(null)

async function createTopic(payload: TopicFormPayload) {
  saving.value = true
  try {
    const topic = await $fetch<AdminTopicSummary>(`/api/consultations/${consultationSlug.value}/topics`, {
      method: 'POST',
      body: payload
    })
    toast.add({
      title: 'Tema creado',
      color: 'success'
    })
    await navigateTo(`/consultas/${consultationSlug.value}/panel/temas/${topic.slug}`)
  } catch (err) {
    const e = err as { data?: { message?: string, data?: { field: string, message: string }[] }, message?: string }
    const fieldErrors = e.data?.data
    if (Array.isArray(fieldErrors) && fieldErrors.length) {
      formRef.value?.applyServerErrors(fieldErrors)
    }
    toast.add({
      title: 'No se pudo crear el tema',
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
      title="Nuevo tema"
      description="Creá un tema de participación dentro de la consulta."
    >
      <template #links>
        <UButton
          label="Volver"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :to="`/consultas/${consultationSlug}/panel/temas`"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <AdminTopicForm
        ref="formRef"
        mode="create"
        :consultation="consultationDates"
        :loading="saving"
        @submit="createTopic"
        @cancel="navigateTo(`/consultas/${consultationSlug}/panel/temas`)"
      />
    </UPageBody>
  </UPage>
</template>
