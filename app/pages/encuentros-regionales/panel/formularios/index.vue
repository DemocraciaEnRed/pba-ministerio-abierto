<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { AdminRegionalMeetingSubmissionDTO } from '~~/server/utils/serializers/regionalMeetingSubmission'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Formularios - Encuentros Regionales')

interface SubmissionsResponse {
  items: AdminRegionalMeetingSubmissionDTO[]
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

const requestFetch = useRequestFetch()
const { data, status, refresh } = await useAsyncData(
  'admin-regional-submissions',
  () => requestFetch<SubmissionsResponse>('/api/regional-meetings/submissions', { query: queryParams.value }),
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
const selected = ref<AdminRegionalMeetingSubmissionDTO | null>(null)

function openDetail(submission: AdminRegionalMeetingSubmissionDTO) {
  selected.value = submission
  detailOpen.value = true
}

const headerButtons = computed<ButtonProps[]>(() => [
  {
    label: 'Descargar CSV',
    icon: 'lucide:file-text',
    color: 'neutral',
    variant: 'subtle',
    to: '/api/regional-meetings/submissions/export',
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
      title="Formularios"
      description="Listado de los aportes enviados por la ciudadanía para los Encuentros Regionales."
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
            <th>Ubicación</th>
            <th>Eje temático</th>
            <th class="text-center">
              Adjuntos
            </th>
            <th>Recibido</th>
            <th>Acciones</th>
          </tr>
        </template>

        <template #tbody>
          <tr
            v-for="submission in data?.items || []"
            :key="submission.id"
          >
            <td class="font-medium">
              {{ submission.firstName }} {{ submission.lastName }}
            </td>
            <td>{{ submission.municipio ? `${submission.municipio}, ` : '' }}{{ submission.provincia }}</td>
            <td>{{ submission.subejeTematico || submission.ejeTematico }}</td>
            <td class="text-center">
              <div class="flex items-center justify-center gap-3 text-muted">
                <span
                  v-if="submission.links.length"
                  class="inline-flex items-center gap-1"
                  :title="`${submission.links.length} enlace(s)`"
                >
                  <UIcon
                    name="lucide:link"
                    class="size-4"
                  />
                  {{ submission.links.length }}
                </span>
                <UIcon
                  v-if="submission.attachment"
                  name="lucide:paperclip"
                  class="size-4"
                  title="Tiene archivo adjunto"
                />
                <span v-if="!submission.links.length && !submission.attachment">—</span>
              </div>
            </td>
            <td>{{ formatDate(submission.createdAt) }}</td>
            <td>
              <UButton
                label="Ver"
                icon="lucide:eye"
                color="neutral"
                variant="subtle"
                size="xs"
                @click="openDetail(submission)"
              />
            </td>
          </tr>
        </template>

        <template #empty>
          <UEmpty
            icon="lucide:inbox"
            title="Todavía no hay aportes"
            description="Cuando la ciudadanía envíe el formulario, los aportes aparecerán acá."
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

    <EncuentrosRegionalesSubmissionSlideover
      v-model:open="detailOpen"
      :submission="selected"
    />
  </div>
</template>
