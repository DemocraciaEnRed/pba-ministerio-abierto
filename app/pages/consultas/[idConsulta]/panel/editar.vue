<script setup lang="ts">
import type { ConsultationFormInitialValues, ConsultationFormPayload } from '~/components/admin/ConsultationForm.vue'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Editar consulta')

const toast = useToast()
const saving = ref(false)

const { consultationId, data: consultation, status, error } = useConsultationAdmin()
const listLink = useConsultationsListLink()

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.

const initialValues = computed<ConsultationFormInitialValues | null>(() => {
  if (!consultation.value) return null
  return {
    id: consultation.value.id,
    slug: consultation.value.slug,
    title: consultation.value.title,
    sectionId: consultation.value.section?.id ?? null,
    sectionSlug: consultation.value.section?.slug ?? null,
    sectionName: consultation.value.section?.name ?? null,
    summary: consultation.value.summary,
    body: consultation.value.body,
    consultationFormat: consultation.value.consultationFormat,
    startsAt: consultation.value.startsAt,
    endsAt: consultation.value.endsAt,
    closedMessage: consultation.value.closedMessage,
    commentsEnabled: consultation.value.commentsEnabled,
    commentsGuidance: consultation.value.commentsGuidance,
    resultsVisibility: consultation.value.resultsVisibility,
    regionId: consultation.value.region?.id ?? null,
    regionalMeeting: consultation.value.regionalMeeting
      ? {
          location: consultation.value.regionalMeeting.location,
          heldAt: consultation.value.regionalMeeting.heldAt,
          registrationUrl: consultation.value.regionalMeeting.registrationUrl,
          registrationOpensAt: consultation.value.regionalMeeting.registrationOpensAt,
          registrationClosesAt: consultation.value.regionalMeeting.registrationClosesAt
        }
      : null
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
    toast.add({
      title: 'Consulta actualizada',
      color: 'success'
    })
    await navigateTo(consultationPanelPath(consultationId.value))
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
        :loading="saving"
        @submit="updateConsultation"
        @cancel="navigateTo(consultationPanelPath(consultationId))"
      />
    </UPageBody>
  </UPage>
</template>
