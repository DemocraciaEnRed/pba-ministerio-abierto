<script setup lang="ts">
import { isKnownConsultationTypeSlug } from '#shared/data/consultation-types'
import type { AdminConsultationListItem, ParticipationState, Visibility } from '~/types/consulta'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Consultas')

type ConsultationFilter = 'all' | Visibility | ParticipationState

interface ConsultationsResponse {
  items: AdminConsultationListItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface SectionOption {
  id: number
  slug: string
  name: string
}

const filters = reactive({
  q: '',
  filter: 'all' as ConsultationFilter,
  sectionSlug: 'all',
  page: 1,
  perPage: 10
})

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Oculta', value: 'hidden' },
  { label: 'Visible', value: 'visible' },
  { label: 'Archivada', value: 'archived' },
  { label: 'Participación programada', value: 'scheduled' },
  { label: 'Participación abierta', value: 'open' },
  { label: 'Instancia participativa finalizada', value: 'closed' }
] satisfies { label: string, value: ConsultationFilter }[]

const perPageOptions = [
  { label: '10 por página', value: 10 },
  { label: '20 por página', value: 20 },
  { label: '50 por página', value: 50 }
] satisfies { label: string, value: number }[]

// Traduce el filtro combinado a los parámetros de query del backend
// (`visibility` para la visibilidad manual, `state` para el estado temporal).
function filterQuery(filter: ConsultationFilter): { visibility?: Visibility, state?: ParticipationState } {
  if (filter === 'all') return {}
  if (filter === 'hidden' || filter === 'visible' || filter === 'archived') {
    return { visibility: filter }
  }
  return { state: filter }
}

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()

const { data: sections, status: sectionsStatus } = await useAsyncData(
  'admin-consultas-sections',
  () => requestFetch<SectionOption[]>('/api/sections'),
  { default: () => [] }
)

const sectionOptions = computed(() => [
  { label: 'Todas las secciones', value: 'all' },
  ...sections.value
    .filter(section => isKnownConsultationTypeSlug(section.slug))
    .map(section => ({ label: section.name, value: section.slug }))
])

const { data, status, refresh } = await useAsyncData(
  'admin-consultations',
  () => requestFetch<ConsultationsResponse>('/api/admin/consultations', {
    query: {
      page: filters.page,
      perPage: filters.perPage,
      q: filters.q || undefined,
      sectionSlug: filters.sectionSlug === 'all' ? undefined : filters.sectionSlug,
      ...filterQuery(filters.filter)
    }
  }),
  {
    watch: [
      () => filters.q,
      () => filters.filter,
      () => filters.sectionSlug,
      () => filters.page,
      () => filters.perPage
    ]
  }
)

const consultations = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination)

// Al cambiar búsqueda, filtros o tamaño de página volvemos a la primera página.
watch([() => filters.q, () => filters.filter, () => filters.sectionSlug, () => filters.perPage], () => {
  filters.page = 1
})
</script>

<template>
  <UPage>
    <UPageHeader
      title="Consultas"
      description="Creá y administrá consultas ciudadanas."
    >
      <template #links>
        <UButton
          label="Actualizar"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          :loading="status === 'pending'"
          @click="refresh()"
        />
        <UButton
          label="Nueva consulta"
          icon="i-lucide-plus"
          color="primary"
          to="/admin/consultas/nuevo"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="grid gap-3 md:grid-cols-5">
        <UInput
          v-model="filters.q"
          placeholder="Buscar por título o contenido"
          icon="i-lucide-search"
          class="md:col-span-2"
        />
        <USelect
          v-model="filters.sectionSlug"
          :items="sectionOptions"
          :loading="sectionsStatus === 'pending'"
          value-key="value"
          class="w-full"
        />
        <USelect
          v-model="filters.filter"
          :items="filterOptions"
          value-key="value"
          class="w-full"
        />
        <USelect
          v-model="filters.perPage"
          :items="perPageOptions"
          value-key="value"
          class="w-full"
        />
      </div>

      <div
        v-if="consultations.length"
        class="space-y-3"
      >
        <AdminConsultationCard
          v-for="consultation in consultations"
          :key="consultation.id"
          :consultation="consultation"
        />
      </div>

      <div
        v-else-if="status !== 'pending'"
        class="py-10 text-center text-sm text-muted"
      >
        No hay consultas para los filtros seleccionados.
      </div>

      <USeparator />

      <div
        v-if="pagination && pagination.total > 0"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <p class="text-xs text-muted">
          {{ pagination.total }} {{ pagination.total === 1 ? 'consulta' : 'consultas' }}
        </p>
        <UPagination
          v-model:page="filters.page"
          :items-per-page="pagination.perPage"
          :total="pagination.total"
        />
      </div>
    </UPageBody>
  </UPage>
</template>
