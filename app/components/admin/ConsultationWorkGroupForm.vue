<script setup lang="ts">
interface WorkGroupOption {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
}

const props = defineProps<{
  consultationId: number
  initialWorkGroupId: number | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const saving = ref(false)

const { data: workGroups, status: workGroupsStatus } = await useAsyncData(
  'admin-observatory-work-groups',
  () => $fetch<WorkGroupOption[]>('/api/observatory-work-groups')
)

const selectedWorkGroupId = ref<number>(0)

function hydrate() {
  selectedWorkGroupId.value = props.initialWorkGroupId ?? 0
}

watch(() => props.initialWorkGroupId, hydrate, { immediate: true })

const workGroupItems = computed(() => [
  { label: 'Sin grupo de trabajo', value: 0 },
  ...(workGroups.value ?? []).map(group => ({ label: group.name, value: group.id }))
])

const selectedWorkGroup = computed(() =>
  (workGroups.value ?? []).find(group => group.id === selectedWorkGroupId.value) ?? null
)

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${props.consultationId}/observatory-work-group`, {
      method: 'PUT',
      body: { observatoryWorkGroupId: selectedWorkGroupId.value === 0 ? null : selectedWorkGroupId.value }
    })

    toast.add({
      title: 'Grupo de trabajo actualizado',
      color: 'success'
    })
    emit('saved')
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo guardar el grupo de trabajo',
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
    title="Grupo de trabajo"
    description="Para que esta consulta forme parte del Observatorio de Obras y Servicios Públicos, es importante que tenga un grupo de trabajo asociado."
  >
    <UFormField
      orientation="vertical"
      label="Grupo de trabajo"
      description="Grupo de trabajo del Observatorio al que se asocia la consulta (opcional)."
    >
      <USelect
        v-model="selectedWorkGroupId"
        :items="workGroupItems"
        value-key="value"
        :loading="workGroupsStatus === 'pending'"
        class="w-full"
      />
    </UFormField>

    <div
      v-if="selectedWorkGroup"
      class="mt-4 flex gap-3 rounded-lg p-3"
      :style="{ backgroundColor: selectedWorkGroup.color }"
    >
      <UIcon
        :name="selectedWorkGroup.icon"
        class="size-6 shrink-0"
        :style="{ color: selectedWorkGroup.iconColor }"
      />
      <p
        class="text-sm"
        :style="{ color: selectedWorkGroup.iconColor }"
      >
        {{ selectedWorkGroup.description }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Guardar grupo de trabajo"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </UCard>
</template>
