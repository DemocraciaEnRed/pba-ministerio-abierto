<script setup lang="ts">
import type { ListboxItem, PageHeroProps } from '@nuxt/ui'
import type { PublicConsultationListItem } from '~/types/consulta'

definePageMeta({
  layout: false
})

type StatusFilter = 'all' | 'scheduled' | 'open' | 'closed' | 'archived'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
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

const route = useRoute()
const router = useRouter()

usePageSeo({
  title: 'Consultas ciudadanas',
  description: 'Explorá los procesos de participación ciudadana abiertos y sumá tu voz en las decisiones públicas.',
  url: '/consultas'
})

function parseIdList(value: unknown): number[] {
  if (value === undefined || value === null) return []
  const raw = Array.isArray(value) ? value : [value]
  return raw
    .flatMap(item => String(item).split(','))
    .map(item => Number(item.trim()))
    .filter(item => Number.isInteger(item) && item > 0)
}

function parseStatus(value: unknown): StatusFilter {
  const allowed: StatusFilter[] = ['all', 'scheduled', 'open', 'closed', 'archived']
  return allowed.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

const filters = reactive({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  status: parseStatus(route.query.status),
  sectionIds: parseIdList(route.query.sectionIds),
  categoryIds: parseIdList(route.query.categoryIds),
  tagIds: parseIdList(route.query.tagIds)
})

// Búsqueda con debounce: el input actualiza `searchInput` y, tras una breve
// pausa, su valor se aplica a `filters.q`, que es lo que dispara el refetch.
const searchInput = ref(filters.q)
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

const statusItems: ListboxItem[] = [
  { label: 'Todas', value: 'all', icon: statusFilterIcons.all },
  { label: 'Programadas', value: 'scheduled', icon: statusFilterIcons.scheduled },
  { label: 'Abiertas', value: 'open', icon: statusFilterIcons.open },
  { label: 'Cerradas', value: 'closed', icon: statusFilterIcons.closed },
  { label: 'Archivadas', value: 'archived', icon: statusFilterIcons.archived }
]

const hero: PageHeroProps = {
  title: 'Consultas ciudadanas',
  description: 'Participa en las consultas ciudadanas abiertas y conoce los resultados de las consultas pasadas.'
}

// Datos de referencia (secciones + categorías + etiquetas): se cargan una sola vez, sin watchers.
const { data: sectionsData, status: sectionsStatus } = await useAsyncData(
  'public-sections',
  () => $fetch<PublicTaxonomy[]>('/api/sections')
)

const { data: categoriesData, status: categoriesStatus } = await useAsyncData(
  'public-categories',
  () => $fetch<PublicCategory[]>('/api/categories')
)

const { data: tagsData, status: tagsStatus } = await useAsyncData(
  'public-tags',
  () => $fetch<PublicTaxonomy[]>('/api/tags')
)

const sectionItems = computed<ListboxItem[]>(() =>
  (sectionsData.value ?? []).map(section => ({ label: section.name, value: section.id }))
)

// Categorías agrupadas por sección (ListboxItem[][]): cada grupo lleva un
// header no seleccionable con el nombre de la sección. Las categorías cuya
// sección no esté activa caen en un grupo defensivo "Generales".
const categoryItems = computed<ListboxItem[][]>(() => {
  const sections = sectionsData.value ?? []
  const categories = categoriesData.value ?? []
  const groups: ListboxItem[][] = []

  for (const section of sections) {
    const inSection = categories.filter(category => category.sectionId === section.id)
    if (inSection.length === 0) continue
    groups.push([
      { type: 'label', label: section.name },
      ...inSection.map(category => ({ label: category.name, value: category.id }))
    ])
  }

  const knownSectionIds = new Set(sections.map(section => section.id))
  const orphans = categories.filter(category => !knownSectionIds.has(category.sectionId))
  if (orphans.length > 0) {
    groups.push([
      { type: 'label', label: 'Generales' },
      ...orphans.map(category => ({ label: category.name, value: category.id }))
    ])
  }

  return groups
})

const tagItems = computed<ListboxItem[]>(() =>
  (tagsData.value ?? []).map(tag => ({ label: tag.name, value: tag.id }))
)

// Listado principal: única fuente con watch sobre cada filtro para el refetch.
const { data, status } = await useAsyncData(
  'public-consultations',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: 1,
      perPage: 50,
      q: filters.q || undefined,
      state: filters.status === 'all' ? undefined : filters.status,
      sectionIds: filters.sectionIds.length ? filters.sectionIds.join(',') : undefined,
      categoryIds: filters.categoryIds.length ? filters.categoryIds.join(',') : undefined,
      tagIds: filters.tagIds.length ? filters.tagIds.join(',') : undefined
    }
  }),
  {
    watch: [
      () => filters.q,
      () => filters.status,
      () => filters.sectionIds.join(','),
      () => filters.categoryIds.join(','),
      () => filters.tagIds.join(',')
    ]
  }
)

// Sincroniza la URL para que los filtros sean compartibles y funcione atrás/adelante.
watch(
  () => [filters.q, filters.status, filters.sectionIds.join(','), filters.categoryIds.join(','), filters.tagIds.join(',')],
  () => {
    const query: Record<string, string> = {}
    if (filters.q) query.q = filters.q
    if (filters.status !== 'all') query.status = filters.status
    if (filters.sectionIds.length) query.sectionIds = filters.sectionIds.join(',')
    if (filters.categoryIds.length) query.categoryIds = filters.categoryIds.join(',')
    if (filters.tagIds.length) query.tagIds = filters.tagIds.join(',')
    router.replace({ query })
  }
)

const consultations = computed(() => data.value?.items ?? [])
</script>

<template>
  <NuxtLayout
    name="consultas"
    :hero="hero"
  >
    <UPage>
      <template #left>
        <UPageAside :ui="{ container: 'space-y-2' }">
          <!-- Status filter -->
          <USeparator
            label="Estado"
            position="start"
          />
          <UListbox
            v-model="filters.status"
            :items="statusItems"
            value-key="value"
            color="primary"
          />
          <!-- Section (gran filtro) -->
          <USeparator
            label="Secciones"
            position="start"
          />
          <UListbox
            v-model="filters.sectionIds"
            :items="sectionItems"
            value-key="value"
            multiple
            :loading="sectionsStatus === 'pending'"
          />
          <!-- Categories -->
          <USeparator
            label="Categorias"
            position="start"
          />
          <UListbox
            v-model="filters.categoryIds"
            :items="categoryItems"
            value-key="value"
            size="sm"
            multiple
            :loading="categoriesStatus === 'pending'"
            :ui="{
              label: 'text-sm'
            }"
          />
          <USeparator
            label="Etiquetas"
            position="start"
          />
          <!-- Tags -->
          <UListbox
            v-model="filters.tagIds"
            :items="tagItems"
            value-key="value"
            size="sm"
            multiple
            :loading="tagsStatus === 'pending'"
          />
        </UPageAside>
      </template>

      <UPageBody>
        <UInput
          v-model="searchInput"
          placeholder="Buscar por título o descripción"
          icon="i-lucide-search"
          class="w-full"
        />

        <UPageCard v-if="status === 'pending'">
          Cargando consultas...
        </UPageCard>

        <div
          v-else-if="consultations.length > 0"
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <ConsultasConsultaCard
            v-for="consultation in consultations"
            :key="consultation.id"
            :consultation="consultation"
          />
        </div>

        <UEmpty
          v-else
          title="No hay consultas para los filtros seleccionados."
          description="Intenta cambiar los filtros para ver más resultados."
          icon="lucide:file"
        />
      </UPageBody>
    </UPage>
  </NuxtLayout>
</template>
