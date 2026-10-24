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

interface PublicTag {
  id: number
  name: string
}

const perPage = 4
const filtersOpen = ref(false)

// `reactive` desenvuelve el ref: `filters.state` lee/escribe el estado compartido.
const sharedState = useHomeExplorerState()
const sharedRegistrationOpen = useHomeExplorerRegistrationOpen()

const filters = reactive({
  q: '',
  state: sharedState,
  registrationOpen: sharedRegistrationOpen,
  sectionSlug: 'all' as 'all' | ConsultationTypeSlug,
  categoryIds: [] as number[],
  tagIds: [] as number[]
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
  requestController?.abort()
  sharedState.value = 'all'
  sharedRegistrationOpen.value = false
})

const horizontalTabs = useIsMdUp()

const { data: sectionsData, status: sectionsStatus, error: sectionsError, refresh: refreshSections } = await useAsyncData(
  'home-explorer-sections',
  () => $fetch<PublicSection[]>('/api/sections'),
  {
    server: false,
    lazy: true
  }
)

const { data: categoriesData, status: categoriesStatus, error: categoriesError, refresh: refreshCategories } = await useAsyncData(
  () => `home-explorer-categories-${filters.sectionSlug}`,
  () => filters.sectionSlug !== 'all'
    ? $fetch<PublicCategory[]>('/api/categories', {
        query: { sectionSlug: filters.sectionSlug }
      })
    : Promise.resolve([] as PublicCategory[]),
  {
    server: false,
    lazy: true
  }
)

const { data: tagsData, status: tagsStatus, error: tagsError, refresh: refreshTags } = await useAsyncData(
  () => `home-explorer-tags-${filters.sectionSlug}`,
  () => filters.sectionSlug !== 'all'
    ? $fetch<PublicTag[]>('/api/tags', { query: { sectionSlug: filters.sectionSlug } })
    : Promise.resolve([] as PublicTag[]),
  { server: false, lazy: true }
)

watch(() => filters.sectionSlug, () => {
  filters.categoryIds = []
  filters.tagIds = []
  if (filters.sectionSlug === 'all') filters.registrationOpen = false
}, { flush: 'sync' })

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
  (categoriesStatus.value === 'success' ? categoriesData.value ?? [] : []).map(category => ({
    label: category.name,
    value: category.id
  }))
)

const tagItems = computed<SelectMenuItem[]>(() =>
  (tagsStatus.value === 'success' ? tagsData.value ?? [] : []).map(tag => ({
    label: tag.name,
    value: tag.id
  }))
)

const consultations = ref<PublicConsultationListItem[]>([])
const pagination = ref<ConsultationsResponse['pagination']>({ page: 0, perPage, total: 0, totalPages: 0 })
const loading = ref(true)
const listError = ref(false)
let requestController: AbortController | undefined

const query = computed(() => ({
  q: filters.q || undefined,
  state: filters.state === 'all' ? undefined : filters.state,
  registrationOpen: filters.registrationOpen ? 'true' : undefined,
  sectionSlug: filters.sectionSlug === 'all' ? undefined : filters.sectionSlug,
  categoryIds: filters.categoryIds.length ? filters.categoryIds.join(',') : undefined,
  tagIds: filters.tagIds.length ? filters.tagIds.join(',') : undefined
}))

async function loadConsultations(reset = false) {
  if (!reset && loading.value) return
  requestController?.abort()
  const controller = new AbortController()
  requestController = controller
  if (reset) {
    consultations.value = []
    pagination.value = { page: 0, perPage, total: 0, totalPages: 0 }
  }
  loading.value = true
  listError.value = false
  try {
    const response = await $fetch<ConsultationsResponse>('/api/consultations', {
      query: { ...query.value, page: pagination.value.page + 1, perPage },
      signal: controller.signal
    })
    if (controller.signal.aborted) return
    const existingIds = new Set(consultations.value.map(item => item.id))
    consultations.value.push(...response.items.filter(item => !existingIds.has(item.id)))
    pagination.value = response.pagination
  } catch {
    if (!controller.signal.aborted) {
      listError.value = true
    }
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

onMounted(() => loadConsultations(true))
watch(query, () => loadConsultations(true))

const hasActiveFilters = computed(() =>
  Boolean(searchInput.value || filters.state !== 'all' || filters.registrationOpen || filters.sectionSlug !== 'all' || filters.categoryIds.length || filters.tagIds.length)
)

const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

function clearFilters() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchInput.value = ''
  filters.q = ''
  filters.state = 'all'
  filters.registrationOpen = false
  filters.sectionSlug = 'all'
  filters.categoryIds = []
  filters.tagIds = []
}
</script>

<template>
  <UPageSection
    id="explorador"
    class="scroll-mt-(--ui-header-height)"
    title="Instancias de participación"
  >
    <div class="min-w-0 max-w-full space-y-8">
      <div class="flex flex-col gap-2 sm:flex-row">
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          placeholder="Buscar por título, resumen o contenido"
          size="lg"
          class="w-full"
        />
        <UButton
          color="neutral"
          variant="outline"
          :label="filtersOpen ? 'Contraer filtros' : 'Expandir filtros'"
          :icon="filtersOpen ? 'lucide:chevron-up' : 'lucide:sliders-horizontal'"
          size="lg"
          class="shrink-0"
          :aria-expanded="filtersOpen"
          aria-controls="home-explorer-filters"
          @click="filtersOpen = !filtersOpen"
        />
        <UButton
          v-if="hasActiveFilters"
          color="neutral"
          variant="ghost"
          label="Limpiar filtros"
          icon="lucide:x"
          class="shrink-0 self-end sm:self-auto"
          @click.stop="clearFilters"
        />
      </div>

      <UCollapsible v-model:open="filtersOpen">
        <template #content>
          <div
            id="home-explorer-filters"
            class="space-y-4"
          >
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
              <UAlert
                v-else-if="sectionsError"
                color="error"
                title="No pudimos cargar las secciones."
                :actions="[{ label: 'Reintentar', onClick: () => refreshSections() }]"
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
              class="grid min-w-0 gap-4 md:grid-cols-3"
            >
              <div
                role="group"
                aria-label="Categorías"
                class="min-w-0 space-y-3"
              >
                <USeparator
                  label="Filtrar por categorías"
                  position="start"
                />
                <USelectMenu
                  v-if="!categoriesError"
                  v-model="filters.categoryIds"
                  :items="categoryItems"
                  value-key="value"
                  multiple
                  :loading="categoriesStatus === 'pending'"
                  :search-input="{ placeholder: 'Buscar categoría...' }"
                  placeholder="Todas las categorías"
                  icon="lucide:tags"
                  :disabled="categoriesStatus !== 'success'"
                  aria-label="Filtrar por categorías"
                  class="w-full"
                />
                <UAlert
                  v-else
                  color="error"
                  title="No pudimos cargar las categorías."
                  :actions="[{ label: 'Reintentar', onClick: () => refreshCategories() }]"
                />
              </div>
              <div
                role="group"
                aria-label="Etiquetas"
                class="min-w-0 space-y-3"
              >
                <USeparator
                  label="Filtrar por etiquetas"
                  position="start"
                />
                <USelectMenu
                  v-if="!tagsError"
                  v-model="filters.tagIds"
                  :items="tagItems"
                  value-key="value"
                  multiple
                  :loading="tagsStatus === 'pending'"
                  :disabled="tagsStatus !== 'success'"
                  :search-input="{ placeholder: 'Buscar etiqueta...' }"
                  placeholder="Todas las etiquetas"
                  aria-label="Filtrar por etiquetas"
                  icon="lucide:hash"
                  class="w-full"
                />
                <UAlert
                  v-else
                  color="error"
                  title="No pudimos cargar las etiquetas."
                  :actions="[{ label: 'Reintentar', onClick: () => refreshTags() }]"
                />
              </div>
              <div
                role="group"
                aria-label="Inscripciones"
                class="min-w-0 space-y-3"
              >
                <USeparator
                  label="Filtrar por inscripción"
                  position="start"
                />
                <div class="flex min-h-8 items-center">
                  <UCheckbox
                    v-model="filters.registrationOpen"
                    label="Con inscripción abierta"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCollapsible>

      <p
        class="text-sm text-muted"
        aria-live="polite"
      >
        {{ pagination.total }} resultado{{ pagination.total === 1 ? '' : 's' }}
        <template v-if="filters.sectionSlug !== 'all'">
          en <span class="font-semibold text-highlighted">{{ selectedSectionName }}</span>
        </template>
      </p>

      <UPageCard v-if="loading && !consultations.length">
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
      </template>

      <UEmpty
        v-else-if="!listError"
        title="No hay resultados"
        description="Probá ajustar la búsqueda o limpiar los filtros para encontrar más consultas."
        icon="lucide:search-x"
      />
      <UAlert
        v-if="listError"
        color="error"
        title="No pudimos cargar las consultas."
        description="Intentá de nuevo. Los resultados que ya cargaste se conservan."
        :actions="[{ label: 'Reintentar', onClick: () => loadConsultations() }]"
      />
      <div
        v-else-if="hasMore"
        class="flex justify-center"
      >
        <UButton
          label="Cargar más"
          size="xl"
          icon="lucide:arrow-down"
          trailing-icon="lucide:arrow-down"
          variant="subtle"
          :loading="loading"
          :disabled="loading"
          @click="loadConsultations()"
        />
      </div>
    </div>
  </UPageSection>
</template>
