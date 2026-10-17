<script setup lang="ts">
import type { DataExportKind, DataExportsResponse } from '~/types/exports'

const props = defineProps<{
  /** `mine`: solo las propias. `all`: todas (auditoría, solo platform-admin). */
  scope: 'mine' | 'all'
}>()

type KindFilter = 'all' | DataExportKind

const filters = reactive({
  kind: 'all' as KindFilter,
  page: 1,
  perPage: 20
})

const kindOptions = [
  { label: 'Todos los tipos', value: 'all' },
  ...Object.entries(DATA_EXPORT_KIND_LABELS).map(([value, label]) => ({ label, value }))
] as { label: string, value: KindFilter }[]

const queryParams = computed(() => ({
  scope: props.scope,
  kind: filters.kind === 'all' ? undefined : filters.kind,
  page: filters.page,
  perPage: filters.perPage
}))

watch(() => filters.kind, () => {
  filters.page = 1
})

const version = useDataExportsVersion()
const requestFetch = useRequestFetch()
// Se expone antes del `await` (requisito de Vue) con getters que leen el estado ya inicializado.
defineExpose({
  refresh: () => refresh(),
  get status() { return status.value }
})

const { data, status, refresh } = await useAsyncData(
  `data-exports-${props.scope}`,
  () => requestFetch<DataExportsResponse>('/api/exports', { query: queryParams.value }),
  { watch: [queryParams, version] }
)

const items = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

useDataExportsPolling(items, refresh)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <USelect
        v-model="filters.kind"
        :items="kindOptions"
        value-key="value"
        aria-label="Tipo de exportación"
        class="w-full sm:w-64"
      />
      <p
        v-if="pagination"
        class="text-sm text-muted"
      >
        {{ pagination.total }} {{ pagination.total === 1 ? 'exportación' : 'exportaciones' }}
      </p>
    </div>

    <UPageCard :ui="{ container: 'p-0 sm:p-0' }">
      <div
        v-if="status === 'pending' && items.length === 0"
        class="space-y-3 p-4"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-16 w-full"
        />
      </div>
      <ExportsDataExportList
        v-else
        :items="items"
        :show-requester="scope === 'all'"
        :empty-description="scope === 'all'
          ? 'No hay exportaciones con estos filtros.'
          : 'Todavía no pediste ninguna exportación. Podés hacerlo con Exportar CSV desde los paneles de comentarios, inscripciones y aportes.'"
        @deleted="refresh()"
      />
    </UPageCard>

    <div
      v-if="pagination && pagination.totalPages > 1"
      class="flex justify-end"
    >
      <UPagination
        v-model:page="filters.page"
        :items-per-page="pagination.perPage"
        :total="pagination.total"
      />
    </div>
  </div>
</template>
