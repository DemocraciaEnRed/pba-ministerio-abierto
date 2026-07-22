<script setup lang="ts">
import { ref, watch } from 'vue'

type ConfirmColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmColor?: ConfirmColor
    loading?: boolean
    ui?: Record<string, string>
  }>(),
  {
    description: undefined,
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    confirmColor: 'primary',
    loading: false,
    ui: undefined
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const dialogOpen = ref(props.open)

watch(
  () => props.open,
  (value) => {
    dialogOpen.value = value
  }
)

watch(dialogOpen, (value) => {
  emit('update:open', value)
})

const onConfirm = (): void => {
  emit('confirm')
}

const onCancel = (): void => {
  emit('cancel')
  dialogOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="dialogOpen"
    :title="title"
    :description="description"
    :dismissible="!loading"
    :ui="ui"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          :color="confirmColor"
          :loading="loading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
