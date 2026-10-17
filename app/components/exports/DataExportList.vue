<script setup lang="ts">
import type { DataExport } from '~/types/exports'

const props = withDefaults(defineProps<{
  items: DataExport[]
  /** Muestra quién pidió cada exportación (vista de administración). */
  showRequester?: boolean
  /** Muestra el tipo de exportación (en listados que mezclan tipos). */
  showKind?: boolean
  emptyDescription?: string
}>(), {
  showRequester: false,
  showKind: true,
  emptyDescription: 'Todavía no pediste ninguna exportación.'
})

const emit = defineEmits<{
  deleted: [id: number]
}>()

const toast = useToast()
const deleteTarget = ref<DataExport | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: DataExport): void {
  deleteTarget.value = item
  deleteOpen.value = true
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  try {
    await $fetch(`/api/exports/${target.id}`, { method: 'DELETE' })
    toast.add({ title: 'Exportación eliminada', color: 'success' })
    deleteOpen.value = false
    emit('deleted', target.id)
  } catch (error) {
    toast.add({ title: 'No se pudo eliminar la exportación', description: getErrorMessage(error), color: 'error' })
  } finally {
    deleting.value = false
  }
}

function isActive(item: DataExport): boolean {
  return item.status === 'pending' || item.status === 'processing'
}

function rowsLabel(count: number): string {
  return `${count.toLocaleString('es-AR')} ${count === 1 ? 'fila' : 'filas'}`
}

const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <div>
    <UEmpty
      v-if="!hasItems"
      icon="i-lucide-file-down"
      title="Sin exportaciones"
      :description="emptyDescription"
      class="py-8"
    />

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex gap-3 px-4 py-4 sm:px-5"
      >
        <UIcon
          name="i-lucide-file-spreadsheet"
          class="mt-0.5 size-5 shrink-0 text-muted"
        />

        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="font-medium text-highlighted">{{ item.title }}</span>
            <UBadge
              :label="DATA_EXPORT_STATUS_BADGES[item.status].label"
              :color="DATA_EXPORT_STATUS_BADGES[item.status].color"
              :icon="DATA_EXPORT_STATUS_BADGES[item.status].icon"
              :ui="{ leadingIcon: isActive(item) ? 'animate-spin' : '' }"
              variant="subtle"
              size="sm"
            />
          </div>

          <p class="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <template v-if="showKind">
              <span>{{ DATA_EXPORT_KIND_LABELS[item.kind] }}</span>
              <span>·</span>
            </template>
            <UTooltip :text="formatDate(item.createdAt)">
              <span>Pedida {{ fromNow(item.createdAt) }}</span>
            </UTooltip>
            <template v-if="item.totalRows !== null">
              <span>·</span>
              <span>{{ rowsLabel(item.totalRows) }}</span>
            </template>
            <template v-if="showRequester && item.requestedBy">
              <span>·</span>
              <UTooltip :text="item.requestedBy.email">
                <span>por {{ item.requestedBy.label }}</span>
              </UTooltip>
            </template>
          </p>

          <div
            v-if="dataExportFiltersSummary(item.filters).length > 0"
            class="flex flex-wrap gap-1"
          >
            <UBadge
              v-for="filter in dataExportFiltersSummary(item.filters)"
              :key="filter"
              :label="filter"
              icon="i-lucide-filter"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>

          <p
            v-if="item.status === 'failed' && item.errorMessage"
            class="text-sm text-error"
          >
            {{ item.errorMessage }}
          </p>

          <div
            v-if="item.status === 'ready' && item.files.length > 0"
            class="flex flex-wrap gap-2"
          >
            <UButton
              v-for="file in item.files"
              :key="file.id"
              :to="file.downloadUrl"
              external
              download
              :label="item.files.length === 1 ? 'Descargar CSV' : `Parte ${file.partNumber}`"
              icon="i-lucide-download"
              color="neutral"
              variant="outline"
              size="xs"
            >
              <template #trailing>
                <span class="text-xs text-muted">
                  {{ item.files.length > 1 ? `${rowsLabel(file.rowCount)} · ` : '' }}{{ formatExportSize(file.sizeBytes) }}
                </span>
              </template>
            </UButton>
          </div>
        </div>

        <UTooltip
          :text="isActive(item) ? 'Se puede eliminar cuando termine' : 'Eliminar exportación'"
          arrow
        >
          <UButton
            icon="i-lucide-trash-2"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="isActive(item)"
            aria-label="Eliminar exportación"
            class="h-fit"
            @click="askDelete(item)"
          />
        </UTooltip>
      </li>
    </ul>

    <ConfirmModal
      v-model:open="deleteOpen"
      title="Eliminar exportación"
      description="Se borrarán los archivos generados. Si los necesitás de nuevo, podés volver a pedir la exportación."
      confirm-label="Eliminar"
      confirm-color="error"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
