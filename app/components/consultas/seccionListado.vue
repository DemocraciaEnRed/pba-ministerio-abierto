<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'
import type { PublicConsultationListItem } from '~/types/consulta'

// Listado de consultas fijado a una sección (por slug), con la estética del
// explorador del Observatorio: búsqueda y filtros arriba, grilla paginada
// abajo. Pensado para embeberse en páginas de sección (p. ej. /dialogos).
const props = defineProps<{
  sectionSlug: string
}>()

type StatusFilter = 'all' | 'scheduled' | 'open' | 'closed'

const PER_PAGE = 8

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface PublicTaxonomy {
  id: number
  slug: string
  name: string
  description: string | null
}

interface PublicCategory extends PublicTaxonomy {
  sectionId: number
}

const filters = reactive({
  q: '',
  status: 'all' as StatusFilter,
  categoryIds: [] as number[],
  tagIds: [] as number[]
})

// Búsqueda con debounce: el input actualiza `searchInput` y, tras una breve
// pausa, su valor se aplica a `filters.q`, que es lo que dispara el refetch.
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
})

// Datos de referencia (categorías + etiquetas) y el listado se cargan solo en
// el cliente (`server: false`), de modo que el bloque aparece una vez montada
// la página en lugar de bloquear el render inicial (SSR). Las keys incluyen el
// slug para no colisionar si el componente se usa para varias secciones.
const { data: categoriesData, status: categoriesStatus } = await useAsyncData(
  () => `seccion-categories-${props.sectionSlug}`,
  () => $fetch<PublicCategory[]>('/api/categories', {
    query: { sectionSlug: props.sectionSlug }
  }),
  { server: false, lazy: true }
)

const { data: tagsData, status: tagsStatus } = await useAsyncData(
  'seccion-tags',
  () => $fetch<PublicTaxonomy[]>('/api/tags'),
  { server: false, lazy: true }
)

const categoryItems = computed<SelectMenuItem[]>(() =>
  (categoriesData.value ?? []).map(category => ({ label: category.name, value: category.id }))
)

const tagItems = computed<SelectMenuItem[]>(() =>
  (tagsData.value ?? []).map(tag => ({ label: tag.name, value: tag.id }))
)

const page = ref(1)

watch(
  () => [filters.q, filters.status, filters.categoryIds.join(','), filters.tagIds.join(',')],
  () => {
    page.value = 1
  }
)

// Listado principal: única fuente con watch sobre cada filtro para el refetch.
const { data, status } = await useAsyncData(
  () => `seccion-consultations-${props.sectionSlug}`,
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: page.value,
      perPage: PER_PAGE,
      sectionSlug: props.sectionSlug,
      q: filters.q || undefined,
      state: filters.status === 'all' ? undefined : filters.status,
      categoryIds: filters.categoryIds.length ? filters.categoryIds.join(',') : undefined,
      tagIds: filters.tagIds.length ? filters.tagIds.join(',') : undefined
    }
  }),
  {
    server: false,
    lazy: true,
    watch: [
      () => page.value,
      () => filters.q,
      () => filters.status,
      () => filters.categoryIds.join(','),
      () => filters.tagIds.join(',')
    ]
  }
)

const consultations = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? { page: 1, perPage: PER_PAGE, total: 0, totalPages: 0 })

const hasActiveFilters = computed(() =>
  Boolean(searchInput.value || filters.status !== 'all' || filters.categoryIds.length || filters.tagIds.length)
)

function clearFilters() {
  searchInput.value = ''
  filters.q = ''
  filters.status = 'all'
  filters.categoryIds = []
  filters.tagIds = []
  page.value = 1
}
</script>

<template>
  <UContainer class="py-10 sm:py-12">
    <div class="min-w-0 max-w-full space-y-8">
      <div class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="searchInput"
            placeholder="Buscar por título o descripción"
            icon="i-lucide-search"
            size="lg"
            class="w-full"
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

        <ConsultasEstadoTabs v-model="filters.status" />

        <div
          v-if="categoryItems.length > 0 || tagItems.length > 0"
          class="grid gap-4 md:grid-cols-2"
        >
          <div
            v-if="categoryItems.length > 0"
            role="group"
            aria-label="Ejes de gestión"
            class="min-w-0 space-y-3"
          >
            <USeparator
              label="Filtrar por ejes de gestión"
              position="start"
            />
            <USelectMenu
              v-model="filters.categoryIds"
              :items="categoryItems"
              value-key="value"
              multiple
              :loading="categoriesStatus === 'pending'"
              :search-input="{ placeholder: 'Buscar eje...' }"
              placeholder="Todos los ejes"
              icon="lucide:tags"
              class="w-full"
            />
          </div>
          <div
            v-if="tagItems.length > 0"
            role="group"
            aria-label="Etiquetas"
            class="min-w-0 space-y-3"
          >
            <USeparator
              label="Filtrar por etiquetas"
              position="start"
            />
            <USelectMenu
              v-model="filters.tagIds"
              :items="tagItems"
              value-key="value"
              multiple
              :loading="tagsStatus === 'pending'"
              :search-input="{ placeholder: 'Buscar etiqueta...' }"
              placeholder="Todas las etiquetas"
              icon="lucide:hash"
              class="w-full"
            />
          </div>
        </div>

        <p
          class="text-sm text-muted"
          aria-live="polite"
        >
          {{ pagination.total }} resultado{{ pagination.total === 1 ? '' : 's' }}
        </p>
      </div>

      <UPageCard v-if="status === 'idle' || status === 'pending'">
        Cargando consultas...
      </UPageCard>

      <template v-else-if="consultations.length > 0">
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
        title="No hay consultas para los filtros seleccionados."
        description="Probá cambiar los filtros para ver más resultados."
        icon="lucide:file"
      />
    </div>
  </UContainer>
</template>
