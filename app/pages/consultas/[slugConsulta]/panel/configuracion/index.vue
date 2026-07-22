<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'

definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Configuración de la consulta')

type Visibility = 'hidden' | 'visible' | 'archived'

const { slug, data: consultation, refresh } = useConsultationAdmin()
const toast = useToast()
const listLink = useConsultationsListLink()
const saving = ref(false)
const featured = ref(false)
const featuredSaving = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const visibilityOptions = [
  { label: 'Oculta', value: 'hidden', description: 'Solo la ve el equipo administrador mientras preparás la consulta.' },
  { label: 'Visible', value: 'visible', description: 'Publicada para la ciudadanía. Requiere fecha de inicio: el estado (programada/abierta/cerrada) se calcula según las fechas.' },
  { label: 'Archivada', value: 'archived', description: 'Finaliza y archiva la consulta. La participación queda cerrada.' }
] satisfies (RadioGroupItem & { value: Visibility })[]

const visibility = ref<Visibility>('hidden')

watch(consultation, (value) => {
  if (value) {
    visibility.value = value.visibility
    featured.value = value.featured
  }
}, { immediate: true })

const hasChanges = computed(() =>
  Boolean(consultation.value) && visibility.value !== consultation.value?.visibility
)

// La fecha de inicio es obligatoria para publicar (hacer visible).
const missingStartDate = computed(() =>
  visibility.value === 'visible' && !consultation.value?.startsAt
)

const participationStateLabel = computed(() => {
  const state = consultation.value?.participationState
  if (state === 'scheduled') return 'Programada'
  if (state === 'open') return 'Abierta'
  if (state === 'closed') return 'Cerrada'
  return null
})

async function saveVisibility() {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/visibility`, {
      method: 'POST',
      body: { visibility: visibility.value }
    })
    toast.add({
      title: 'Visibilidad actualizada',
      color: 'success'
    })
    await refresh()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo actualizar la visibilidad',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function toggleFeatured(value: boolean) {
  featuredSaving.value = true
  try {
    await $fetch(`/api/consultations/${slug.value}/featured`, {
      method: 'POST',
      body: { featured: value }
    })
    toast.add({
      title: value ? 'Consulta destacada' : 'Consulta quitada de destacadas',
      color: 'success'
    })
    await refresh()
  } catch (error) {
    featured.value = !value
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo actualizar el destacado',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    featuredSaving.value = false
  }
}

async function removeConsultation() {
  if (!consultation.value) return
  deleting.value = true
  try {
    await $fetch(`/api/consultations/${consultation.value.id}`, { method: 'DELETE' })
    toast.add({
      title: 'Consulta eliminada',
      color: 'success'
    })
    deleteOpen.value = false
    await navigateTo(listLink.value)
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo eliminar la consulta',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Configuración"
      description="Ajustes generales de la consulta."
    />

    <UPageBody>
      <UCard
        variant="outline"
        title="Visibilidad de la consulta"
        description="Controla si la consulta es pública. El estado de participación (programada, abierta o cerrada) se calcula automáticamente según las fechas."
      >
        <div class="space-y-6">
          <UFormField
            label="Visibilidad"
            description="Oculta: solo el equipo. Visible: pública (requiere fecha de inicio). Archivada: finalizada y archivada."
          >
            <URadioGroup
              v-model="visibility"
              color="primary"
              variant="table"
              :items="visibilityOptions"
              value-key="value"
            />
          </UFormField>
          <UAlert
            v-if="participationStateLabel && consultation?.visibility === 'visible'"
            icon="i-lucide-activity"
            color="neutral"
            variant="subtle"
            title="Estado de participación actual"
            :description="`Según las fechas configuradas, la consulta está ${participationStateLabel}.`"
          />
          <UAlert
            v-if="missingStartDate"
            icon="i-lucide-triangle-alert"
            color="warning"
            variant="subtle"
            title="Falta la fecha de inicio"
            description="Definí la fecha de inicio en la solapa Editar antes de publicar la consulta."
          />
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              label="Guardar visibilidad"
              icon="i-lucide-save"
              :loading="saving"
              :disabled="!hasChanges || missingStartDate"
              @click="saveVisibility"
            />
          </div>
        </template>
      </UCard>

      <UCard
        title="Destacar consulta"
        description="Las consultas destacadas aparecen resaltadas en el listado público."
      >
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm text-muted">
            {{ featured ? 'Esta consulta está destacada.' : 'Esta consulta no está destacada.' }}
          </p>

          <USwitch
            v-model="featured"
            :loading="featuredSaving"
            @update:model-value="toggleFeatured"
          />
        </div>
      </UCard>

      <UPageCard
        title="Zona de peligro"
        highlight
        highlight-color="error"
        spotlight
        spotlight-color="error"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <p class="text-sm font-medium">
              Eliminar consulta
            </p>
            <p class="text-sm text-muted">
              Esta acción elimina la consulta y todos sus temas de forma permanente. No se puede deshacer.
            </p>
          </div>
          <UButton
            label="Eliminar consulta"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            @click="deleteOpen = true"
          />
        </div>
      </UPageCard>
    </UPageBody>

    <ConfirmModal
      v-model:open="deleteOpen"
      title="Eliminar consulta"
      :description="`¿Seguro que querés eliminar «${consultation?.title}»? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="removeConsultation"
    />
  </UPage>
</template>
