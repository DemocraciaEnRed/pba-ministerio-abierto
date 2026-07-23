<script setup lang="ts">
import type { ListboxItem } from '@nuxt/ui'
import type { PublicConsultationListItem } from '~/types/consulta'

// Listado de consultas fijado a una sección (por slug). Reutiliza el filtrado
// del listado público de /consultas pero omite el filtro de secciones, ya que
// la sección viene dada por el prop. Pensado para embeberse en páginas de
// sección (p. ej. /dialogos) y ser reutilizable en otras secciones.
const props = defineProps<{
  sectionSlug: string
}>()

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

const statusItems: ListboxItem[] = [
  { label: 'Todas', value: 'all', icon: statusFilterIcons.all },
  { label: 'Programadas', value: 'scheduled', icon: statusFilterIcons.scheduled },
  { label: 'Abiertas', value: 'open', icon: statusFilterIcons.open },
  { label: 'Cerradas', value: 'closed', icon: statusFilterIcons.closed }
//   { label: 'Archivadas', value: 'archived', icon: statusFilterIcons.archived }
]

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

const categoryItems = computed<ListboxItem[]>(() =>
  (categoriesData.value ?? []).map(category => ({ label: category.name, value: category.id }))
)

const tagItems = computed<ListboxItem[]>(() =>
  (tagsData.value ?? []).map(tag => ({ label: tag.name, value: tag.id }))
)

// Listado principal: única fuente con watch sobre cada filtro para el refetch.
const { data, status } = await useAsyncData(
  () => `seccion-consultations-${props.sectionSlug}`,
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: 1,
      perPage: 50,
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
      () => filters.q,
      () => filters.status,
      () => filters.categoryIds.join(','),
      () => filters.tagIds.join(',')
    ]
  }
)

const consultations = computed(() => data.value?.items ?? [])
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside :ui="{ container: 'space-y-2' }">
          <!-- Estado -->
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
          <!-- Categorías -->
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
            :ui="{ label: 'text-sm' }"
          />
          <!-- Etiquetas -->
          <USeparator
            label="Etiquetas"
            position="start"
          />
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
  </UContainer>
</template>
