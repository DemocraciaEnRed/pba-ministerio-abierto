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
  initialWorkGroupIds: number[]
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

const selectedWorkGroupIds = ref<number[]>([])

function hydrate() {
  selectedWorkGroupIds.value = [...props.initialWorkGroupIds]
}

watch(() => props.initialWorkGroupIds, hydrate, { immediate: true, deep: true })

const workGroupItems = computed(() =>
  (workGroups.value ?? []).map(group => ({ label: group.name, value: group.id }))
)

const selectedWorkGroups = computed(() =>
  (workGroups.value ?? []).filter(group => selectedWorkGroupIds.value.includes(group.id))
)

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/consultations/${props.consultationId}/observatory-work-groups`, {
      method: 'PUT',
      body: { observatoryWorkGroupIds: selectedWorkGroupIds.value }
    })

    toast.add({
      title: 'Grupos de trabajo actualizados',
      color: 'success'
    })
    emit('saved')
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudieron guardar los grupos de trabajo',
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
    title="Grupos de trabajo"
    description="Para que esta consulta forme parte del Observatorio de Obras y Servicios Públicos, es importante que tenga uno o varios grupos de trabajo asociados."
  >
    <UFormField
      orientation="vertical"
      label="Grupos de trabajo"
      description="Grupos de trabajo del Observatorio a los que se asocia la consulta (podés elegir varios)."
    >
      <USelectMenu
        v-model="selectedWorkGroupIds"
        :items="workGroupItems"
        value-key="value"
        multiple
        :loading="workGroupsStatus === 'pending'"
        placeholder="Elegí grupos de trabajo"
        class="w-full"
      />
    </UFormField>

    <div
      v-if="selectedWorkGroups.length"
      class="mt-4 space-y-2"
    >
      <div
        v-for="group in selectedWorkGroups"
        :key="group.id"
        class="flex gap-3 rounded-lg p-3"
        :style="{ backgroundColor: group.color }"
      >
        <UIcon
          :name="group.icon"
          class="size-6 shrink-0"
          :style="{ color: group.iconColor }"
        />
        <div :style="{ color: group.iconColor }">
          <p class="text-sm font-medium">
            {{ group.name }}
          </p>
          <p
            v-if="group.description"
            class="text-sm"
          >
            {{ group.description }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          label="Guardar grupos de trabajo"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>
  </UCard>
</template>
