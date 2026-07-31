<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminMetric } from '~/components/encuentrosRegionales/MetricFormModal.vue'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Métricas - Encuentros Regionales')

const requestFetch = useRequestFetch()
const { data: metrics, status, refresh } = await useAsyncData('admin-metrics', () =>
  requestFetch<AdminMetric[]>('/api/regional-meetings/metrics')
)

const formOpen = ref(false)
const editingMetric = ref<AdminMetric | null>(null)

function openEdit(metric: AdminMetric) {
  editingMetric.value = metric
  formOpen.value = true
}

const headerButtons = computed<ButtonProps[]>(() => [
  {
    label: 'Actualizar',
    icon: 'lucide:refresh-cw',
    color: 'neutral',
    variant: 'subtle',
    loading: status.value === 'pending',
    onClick: () => refresh()
  }
])
</script>

<template>
  <div>
    <UPageHeader
      title="Métricas"
      description="Editá los números de alcance que se muestran en la página de Encuentros Regionales. Son un conjunto fijo: no se pueden crear ni eliminar."
      :links="headerButtons"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando métricas...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!metrics || metrics.length === 0"
      >
        <template #thead>
          <tr>
            <th class="text-center">
              Orden
            </th>
            <th class="text-center">
              Valor
            </th>
            <th>Etiqueta</th>
            <th class="text-center">
              Identificador
            </th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="metric in metrics || []"
            :key="metric.id"
          >
            <td class="text-center">
              {{ metric.displayOrder }}
            </td>
            <td class="text-center font-bold">
              {{ metric.value }}
            </td>
            <td>{{ metric.label }}</td>
            <td class="text-center font-mono text-xs">
              {{ metric.key }}
            </td>
            <td>
              <UButton
                label="Editar"
                icon="lucide:pencil"
                color="neutral"
                variant="subtle"
                size="xs"
                @click="openEdit(metric)"
              />
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:chart-no-axes-column"
            title="No hay métricas"
            description="Ejecutá el seed de métricas para poblar los números de alcance."
          />
        </template>
      </AppTable>
    </UPageBody>

    <EncuentrosRegionalesMetricFormModal
      v-model:open="formOpen"
      :initial-values="editingMetric"
      @saved="refresh"
    />
  </div>
</template>
