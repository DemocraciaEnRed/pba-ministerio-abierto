<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminObservatoryContributionDTO } from '~~/server/utils/serializers/observatoryContribution'

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Aportes - Observatorio')

interface ContributionsResponse {
  items: AdminObservatoryContributionDTO[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const filters = reactive({
  page: 1,
  perPage: 20
})

const queryParams = computed(() => ({
  page: filters.page,
  perPage: filters.perPage
}))

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  'admin-observatory-contributions',
  () => requestFetch<ContributionsResponse>('/api/observatory-contributions', { query: queryParams.value }),
  { watch: [queryParams] }
)

function nextPage() {
  if (!data.value) return
  if (filters.page < data.value.pagination.totalPages) filters.page += 1
}

function prevPage() {
  if (filters.page > 1) filters.page -= 1
}

const detailOpen = ref(false)
const selected = ref<AdminObservatoryContributionDTO | null>(null)

function openDetail(contribution: AdminObservatoryContributionDTO) {
  selected.value = contribution
  detailOpen.value = true
}

const headerButtons = computed<ButtonProps[]>(() => [
  {
    label: 'Descargar CSV',
    icon: 'lucide:file-text',
    color: 'neutral',
    variant: 'subtle',
    to: '/api/observatory-contributions/export',
    external: true
  },
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
      title="Aportes"
      description="Listado de los aportes enviados por las instituciones del Observatorio."
      :links="headerButtons"
    />
    <UPageBody>
      <UPageCard v-if="status === 'pending'">
        Cargando aportes...
      </UPageCard>

      <AppTable
        v-else
        zebra
        align-last-right
        :empty="!data || data.items.length === 0"
      >
        <template #thead>
          <tr>
            <th>Persona</th>
            <th>Institución</th>
            <th>Eje de trabajo</th>
            <th class="text-center">
              Adjuntos
            </th>
            <th>Recibido</th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="contribution in data?.items || []"
            :key="contribution.id"
          >
            <td class="font-medium">
              {{ contribution.firstName }} {{ contribution.lastName }}
            </td>
            <td>
              {{ contribution.institutionName }}
              <span class="block text-xs text-muted">{{ contribution.institutionCategoryName }}</span>
            </td>
            <td>{{ contribution.workGroupName }}</td>
            <td class="text-center">
              <div class="flex items-center justify-center gap-3 text-muted">
                <span
                  v-if="contribution.links.length"
                  class="inline-flex items-center gap-1"
                  :title="`${contribution.links.length} enlace(s)`"
                >
                  <UIcon
                    name="lucide:link"
                    class="size-4"
                  />
                  {{ contribution.links.length }}
                </span>
                <UIcon
                  v-if="contribution.attachment"
                  name="lucide:paperclip"
                  class="size-4"
                  title="Tiene archivo adjunto"
                />
                <span v-if="!contribution.links.length && !contribution.attachment">—</span>
              </div>
            </td>
            <td>{{ formatDate(contribution.createdAt) }}</td>
            <td>
              <UButton
                label="Ver"
                icon="lucide:eye"
                color="neutral"
                variant="subtle"
                size="xs"
                @click="openDetail(contribution)"
              />
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:inbox"
            title="Todavía no hay aportes"
            description="Cuando las instituciones envíen el formulario, los aportes aparecerán acá."
          />
        </template>
      </AppTable>

      <div
        v-if="data && data.pagination.total > 0"
        class="flex items-center justify-between mt-4"
      >
        <p class="text-sm text-toned">
          {{ data.pagination.total }} aporte(s)
        </p>

        <div class="flex gap-2">
          <UButton
            label="Anterior"
            color="neutral"
            variant="ghost"
            :disabled="data.pagination.page <= 1"
            @click="prevPage"
          />
          <UButton
            label="Siguiente"
            color="neutral"
            variant="ghost"
            :disabled="data.pagination.page >= data.pagination.totalPages"
            @click="nextPage"
          />
        </div>
      </div>
    </UPageBody>

    <ObservatorioContributionSlideover
      v-model:open="detailOpen"
      :contribution="selected"
    />
  </div>
</template>
