<script setup lang="ts">
import type { ConsultationFormPayload } from '~/components/admin/ConsultationForm.vue'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Nueva consulta')

const toast = useToast()
const saving = ref(false)

async function createConsultation(payload: ConsultationFormPayload) {
  saving.value = true
  try {
    const created = await $fetch('/api/consultations', {
      method: 'POST',
      body: payload
    })
    toast.add({
      title: 'Consulta creada',
      color: 'success'
    })
    await navigateTo(`/consultas/${created.slug}/panel`)
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo crear la consulta',
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
      title="Nueva consulta"
      description="Creá una consulta ciudadana."
    >
      <template #links>
        <UButton
          label="Volver"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/admin/consultas"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <AdminConsultationForm
        mode="create"
        :loading="saving"
        @submit="createConsultation"
        @cancel="navigateTo('/admin/consultas')"
      />
    </UPageBody>
  </UPage>
</template>
