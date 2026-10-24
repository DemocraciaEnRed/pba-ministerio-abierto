<script setup lang="ts">
import type { DataExportKind, DataExportsResponse } from '~/types/exports'

const props = withDefaults(defineProps<{
  kind: DataExportKind
  consultationId?: number | string
  limit?: number
}>(), {
  consultationId: undefined,
  limit: 3
})

const version = useDataExportsVersion()

// `server: false`: es un bloque secundario que además se refresca por polling.
const { data, refresh } = await useAsyncData(
  () => `recent-exports-${props.kind}-${props.consultationId ?? 'all'}`,
  () => $fetch<DataExportsResponse>('/api/exports', {
    query: {
      kind: props.kind,
      consultationId: props.consultationId ?? undefined,
      perPage: props.limit
    }
  }),
  { server: false, watch: [version, () => props.kind, () => props.consultationId] }
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.pagination.total ?? 0)

useDataExportsPolling(items, refresh)
</script>

<template>
  <section
    v-if="items.length > 0"
    class="space-y-2"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-sm font-medium text-muted">
        Tus exportaciones recientes
      </h2>
      <UButton
        to="/mi-cuenta/exportaciones"
        :label="total > items.length ? `Ver todas (${total})` : 'Ver todas'"
        trailing-icon="i-lucide-arrow-right"
        color="neutral"
        variant="ghost"
        size="xs"
      />
    </div>
    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <ExportsDataExportList
        :items="items"
        :show-kind="false"
        @deleted="refresh()"
      />
    </UPageCard>
  </section>
</template>
