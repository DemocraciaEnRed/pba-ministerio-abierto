<script setup lang="ts">
import type { SelectMenuItem, TabsItem } from '@nuxt/ui'
import type { ConsultationTypeSlug } from '#shared/data/consultation-types'
import { getConsultationType } from '#shared/data/consultation-types'
import type { PublicConsultationListItem } from '~/types/consulta'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface PublicSection {
  id: number
  slug: ConsultationTypeSlug
  name: string
  description: string | null
}

interface PublicCategory {
  id: number
  slug: string
  name: string
  description: string | null
  sectionId: number
}

const perPage = 8

// `reactive` desenvuelve el ref: `filters.state` lee/escribe el estado compartido.
const sharedState = useHomeExplorerState()
const sharedRegistrationOpen = useHomeExplorerRegistrationOpen()

const filters = reactive({
  q: '',
  state: sharedState,
  registrationOpen: sharedRegistrationOpen,
  sectionSlug: 'all' as 'all' | ConsultationTypeSlug,
  categoryIds: [] as number[]
})

const searchInput = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.q = value.trim()
  }, 350)
})

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  sharedState.value = 'all'
  sharedRegistrationOpen.value = false
})

const horizontalTabs = useIsMdUp()

const { data: sectionsData, status: sectionsStatus } = await useAsyncData(
  'home-explorer-sections',
  () => $fetch<PublicSection[]>('/api/sections'),
  {
    server: false,
    lazy: true
  }
)

const { data: categoriesData, status: categoriesStatus } = await useAsyncData(
  'home-explorer-categories',
  () => filters.sectionSlug !== 'all'
    ? $fetch<PublicCategory[]>('/api/categories', {
        query: { sectionSlug: filters.sectionSlug }
      })
    : Promise.resolve([] as PublicCategory[]),
  {
    server: false,
    lazy: true,
    watch: [() => filters.sectionSlug]
  }
)

watch(() => filters.sectionSlug, () => {
  if (filters.categoryIds.length) {
    filters.categoryIds = []
  }
})

const sectionItems = computed<TabsItem[]>(() => [
  { label: 'Todas', value: 'all', icon: 'lucide:layers' },
  ...(sectionsData.value ?? []).map(section => ({
    label: section.name,
    value: section.slug,
    icon: getConsultationType(section.slug)?.icon ?? 'lucide:folder'
  }))
])

const selectedSectionName = computed(() =>
  sectionItems.value.find(item => item.value === filters.sectionSlug)?.label
)

const categoryItems = computed<SelectMenuItem[]>(() =>
  (categoriesData.value ?? []).map(category => ({
    label: category.name,
    value: category.id
  }))
)

const page = ref(1)

watch(
  () => [filters.q, filters.state, filters.registrationOpen, filters.sectionSlug, filters.categoryIds.join(',')],
  () => {
    page.value = 1
  }
)

const { data, status } = await useAsyncData(
  'home-explorer-consultations',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: page.value,
      perPage,
      q: filters.q || undefined,
      state: filters.state === 'all' ? undefined : filters.state,
      registrationOpen: filters.registrationOpen ? 'true' : undefined,
      sectionSlug: filters.sectionSlug === 'all' ? undefined : filters.sectionSlug,
      categoryIds: filters.categoryIds.length ? filters.categoryIds.join(',') : undefined
    }
  }),
  {
    server: false,
    lazy: true,
    watch: [
      () => page.value,
      () => filters.q,
      () => filters.state,
      () => filters.registrationOpen,
      () => filters.sectionSlug,
      () => filters.categoryIds.join(',')
    ]
  }
)

const consultations = computed(() => data.value?.items ?? [])
const hasActiveFilters = computed(() =>
  Boolean(searchInput.value || filters.state !== 'all' || filters.registrationOpen || filters.sectionSlug !== 'all' || filters.categoryIds.length)
)

const pagination = computed(() => data.value?.pagination ?? { page: 1, perPage, total: 0, totalPages: 0 })

function clearFilters() {
  searchInput.value = ''
  filters.q = ''
  filters.state = 'all'
  filters.registrationOpen = false
  filters.sectionSlug = 'all'
  filters.categoryIds = []
  page.value = 1
}
</script>

<template>
  <UPageSection
    id="explorador"
    class="scroll-mt-(--ui-header-height)"
    title="Explorador de consultas"
    description="Buscá por texto, estado, sección y categorías para encontrar instancias de participación."
  >
    <div class="min-w-0 max-w-full space-y-8">
      <div class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Buscar por título, resumen o contenido"
            size="lg"
            class="w-full"
          />
          <UButton
            :color="filters.registrationOpen ? 'primary' : 'neutral'"
            :variant="filters.registrationOpen ? 'solid' : 'outline'"
            :aria-pressed="filters.registrationOpen"
            label="Con inscripción abierta"
            icon="lucide:ticket"
            size="lg"
            class="shrink-0"
            @click="filters.registrationOpen = !filters.registrationOpen"
          />
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="ghost"
            label="Limpiar filtros"
            icon="lucide:x"
            class="shrink-0 self-end sm:self-auto"
            @click="clearFilters"
          />
        </div>

        <ConsultasEstadoTabs v-model="filters.state" />

        <div
          role="group"
          aria-label="Sección"
          class="min-w-0 space-y-3"
        >
          <USeparator
            label="Filtrar por sección"
            position="start"
          />
          <USkeleton
            v-if="sectionsStatus === 'idle' || sectionsStatus === 'pending'"
            class="h-12 w-full"
          />
          <UTabs
            v-else
            v-model="filters.sectionSlug"
            :items="sectionItems"
            :content="false"
            :orientation="horizontalTabs ? 'horizontal' : 'vertical'"
            color="neutral"
            :ui="{
              list: 'w-full',
              trigger: 'min-h-12 justify-start md:flex-1 md:basis-0 md:justify-center',
              leadingIcon: 'size-6 shrink-0 group-data-[state=inactive]:text-primary',
              label: 'whitespace-normal text-left md:text-center wrap-break-word'
            }"
            class="w-full"
          />
        </div>

        <div
          v-if="filters.sectionSlug !== 'all'"
          role="group"
          aria-label="Categorías"
          class="min-w-0 space-y-3"
        >
          <USeparator
            label="Filtrar por categorías"
            position="start"
          />
          <USelectMenu
            v-model="filters.categoryIds"
            :items="categoryItems"
            value-key="value"
            multiple
            :loading="categoriesStatus === 'pending'"
            :search-input="{ placeholder: 'Buscar categoría...' }"
            placeholder="Todas las categorías"
            icon="lucide:tags"
            class="w-full md:max-w-md"
          />
        </div>

        <p
          class="text-sm text-muted"
          aria-live="polite"
        >
          {{ pagination.total }} resultado{{ pagination.total === 1 ? '' : 's' }}
          <template v-if="filters.sectionSlug !== 'all'">
            en <span class="font-semibold text-highlighted">{{ selectedSectionName }}</span>
          </template>
        </p>
      </div>

      <UPageCard v-if="status === 'idle' || status === 'pending'">
        Cargando consultas...
      </UPageCard>

      <template v-else-if="consultations.length">
        <UBlogPosts
          orientation="vertical"
          :ui="{ base: 'sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4' }"
        >
          <ConsultasConsultaCard
            v-for="consultation in consultations"
            :key="consultation.id"
            :consultation="consultation"
            orientation="vertical"
          />
        </UBlogPosts>

        <div
          v-if="pagination.totalPages > 1"
          class="flex justify-center"
        >
          <UPagination
            v-model:page="page"
            :total="pagination.total"
            :items-per-page="pagination.perPage"
            show-edges
          />
        </div>
      </template>

      <UEmpty
        v-else
        title="No hay resultados"
        description="Probá ajustar la búsqueda o limpiar los filtros para encontrar más consultas."
        icon="lucide:search-x"
      />
    </div>
  </UPageSection>
</template>
