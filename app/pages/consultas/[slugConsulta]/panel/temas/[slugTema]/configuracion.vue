<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type { Visibility } from '~/types/consulta'

definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Configuración del tema')

const { consultationSlug, topicSlug, data: topic, status, error, refresh } = useTopicAdmin()
const toast = useToast()
const saving = ref(false)

const visibilityOptions = [
  { label: 'Oculto', value: 'hidden', description: 'Solo lo ve el equipo administrador mientras preparás el tema.' },
  { label: 'Visible', value: 'visible', description: 'Publicado para la ciudadanía. Requiere que el método de participación esté configurado; al publicar, su configuración queda fija.' },
  { label: 'Archivado', value: 'archived', description: 'Finaliza y archiva el tema como antecedente histórico. Es un cambio terminal: no se puede revertir.' }
] satisfies (RadioGroupItem & { value: Visibility })[]

const visibility = ref<Visibility>('hidden')

watch(topic, (value) => {
  if (value) {
    visibility.value = value.visibility
  }
}, { immediate: true })

// Archivar es terminal: un tema archivado no admite más cambios de visibilidad.
const isArchived = computed(() => topic.value?.visibility === 'archived')

const hasChanges = computed(() =>
  Boolean(topic.value) && visibility.value !== topic.value?.visibility
)

// Publicar (visible) requiere que el método esté configurado. Avisamos si el
// tema no tiene método seleccionado (el backend valida el detalle, ej. encuestas).
const publishingWithoutMechanism = computed(() =>
  visibility.value === 'visible' && !topic.value?.mechanismType
)

const participationStateLabel = computed(() => {
  const state = topic.value?.participationState
  if (state === 'scheduled') return 'Programado'
  if (state === 'open') return 'Abierto'
  if (state === 'closed') return 'Cerrado'
  return null
})

async function saveVisibility() {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/visibility`, {
      method: 'POST',
      body: { visibility: visibility.value }
    })
    toast.add({
      title: 'Visibilidad actualizada',
      color: 'success'
    })
    await refresh()
  } catch (err) {
    const e = err as { data?: { message?: string, data?: { message?: string }[] }, message?: string }
    const fieldMessage = Array.isArray(e.data?.data) ? e.data?.data?.[0]?.message : undefined
    toast.add({
      title: 'No se pudo actualizar la visibilidad',
      description: fieldMessage || e.data?.message || e.message || 'Ocurrió un error inesperado.',
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
      title="Configuración"
      description="Controlá la visibilidad y publicación del tema."
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

      <UCard
        v-else
        variant="outline"
        title="Visibilidad del tema"
        description="Controla si el tema es público. El estado de participación (programado, abierto o cerrado) se calcula automáticamente según las fechas."
      >
        <div class="space-y-6">
          <UFormField
            label="Visibilidad"
            description="Oculto: solo el equipo. Visible: público (requiere método configurado). Archivado: finalizado y archivado."
          >
            <URadioGroup
              v-model="visibility"
              color="primary"
              variant="table"
              :items="visibilityOptions"
              value-key="value"
              :disabled="isArchived"
            />
          </UFormField>

          <UAlert
            v-if="isArchived"
            icon="i-lucide-archive"
            color="neutral"
            variant="subtle"
            title="Tema archivado"
            description="El tema está archivado y no admite más cambios de visibilidad."
          />
          <UAlert
            v-else-if="participationStateLabel && topic.visibility === 'visible'"
            icon="i-lucide-activity"
            color="neutral"
            variant="subtle"
            title="Estado de participación actual"
            :description="`Según las fechas configuradas, el tema está ${participationStateLabel}.`"
          />
          <UAlert
            v-if="publishingWithoutMechanism"
            icon="i-lucide-triangle-alert"
            color="warning"
            variant="subtle"
            title="Sin método de participación"
            description="Este tema no tiene método configurado: al publicarlo será un tema informativo (solo lectura y comentarios). Definilo en la solapa Método de participación si querés habilitar la participación."
          />
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              label="Guardar visibilidad"
              icon="i-lucide-save"
              :loading="saving"
              :disabled="!hasChanges || isArchived"
              @click="saveVisibility"
            />
          </div>
        </template>
      </UCard>
    </UPageBody>
  </UPage>
</template>
