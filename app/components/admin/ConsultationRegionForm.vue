<script setup lang="ts">
interface RegionOption {
  id: number
  slug: string
  name: string
}

const props = defineProps<{
  consultationId: number
  initialRegionId: number | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)

const { data: regions, status: regionsStatus } = await useAsyncData(
  'admin-regions',
  () => $fetch<RegionOption[]>('/api/regions')
)

const selectedRegionId = ref<number>(0)

function hydrate() {
  selectedRegionId.value = props.initialRegionId ?? 0
}

watch(() => props.initialRegionId, hydrate, { immediate: true })

const regionItems = computed(() => [
  { label: 'Sin región', value: 0 },
  ...(regions.value ?? []).map(region => ({ label: region.name, value: region.id }))
])

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${props.consultationId}/region`, {
      method: 'PUT',
      body: { regionId: selectedRegionId.value === 0 ? null : selectedRegionId.value }
    })

    toast.add({
      title: 'Región actualizada',
      color: 'success'
    })
    emit('saved')
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo guardar la región',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UCard
    title="Región"
    description="Para que esta consulta forme parte de los Encuentros Regionales, es importante que tenga una región asociada."
  >
    <UFormField
      orientation="vertical"
      label="Región"
      description="Región de la Provincia de Buenos Aires a la que se asocia la consulta (opcional)."
    >
      <USelect
        v-model="selectedRegionId"
        :items="regionItems"
        value-key="value"
        :loading="regionsStatus === 'pending'"
        class="w-full"
      />
    </UFormField>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Guardar región"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </UCard>
</template>
