<script setup lang="ts">
import type { PublicConsultationListItem } from '~/types/consulta'

type StatusFilter = 'all' | 'scheduled' | 'open' | 'closed'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
}

interface PublicWorkGroup {
  id: number
  slug: string
  name: string
  icon: string
  color: string
  displayOrder: number
}

const PER_PAGE = 4
const OBSERVATORY_SECTION_SLUG = 'observatorio-obras-servicios'

const selectedStatusFilter = ref<StatusFilter>('all')
const selectedWorkGroupFilter = defineModel<string>('workGroup', { default: 'all' })
const horizontalTabs = useIsMdUp()

const { data: workGroupsData, status: workGroupsStatus } = await useAsyncData(
  'observatorio-consultas-work-groups',
  () => $fetch<PublicWorkGroup[]>('/api/observatory-work-groups'),
  {
    server: false,
    lazy: true
  }
)

// Sin `label`: el contenido completo se renderiza en el slot #leading.
const workGroupItems = computed(() => [
  {
    name: 'Todos',
    value: 'all',
    icon: 'lucide:list',
    color: 'var(--ui-primary)'
  },
  ...(workGroupsData.value ?? []).map(group => ({
    name: group.name,
    value: String(group.id),
    icon: group.icon,
    color: group.color
  }))
])

const selectedWorkGroupName = computed(() =>
  workGroupItems.value.find(item => item.value === selectedWorkGroupFilter.value)?.name
)

const { data, status } = await useAsyncData(
  'observatorio-consultas-cardlist',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: 1,
      perPage: 50,
      sectionSlug: OBSERVATORY_SECTION_SLUG,
      ...(selectedStatusFilter.value !== 'all' && { state: selectedStatusFilter.value }),
      ...(selectedWorkGroupFilter.value !== 'all' && { observatoryWorkGroupIds: selectedWorkGroupFilter.value })
    }
  }),
  {
    server: false,
    lazy: true,
    watch: [selectedStatusFilter, selectedWorkGroupFilter]
  }
)

const consultations = computed(() => data.value?.items ?? [])

const page = ref(1)
const paginatedConsultations = computed(() =>
  consultations.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

watch([selectedStatusFilter, selectedWorkGroupFilter], () => {
  page.value = 1
})
</script>

<template>
  <div class="min-w-0 max-w-full space-y-8">
    <div class="space-y-4">
      <ConsultasEstadoTabs v-model="selectedStatusFilter" />
      <div
        role="group"
        aria-label="Grupos de trabajo"
        class="min-w-0 space-y-3"
      >
        <USeparator
          label="Filtrar por grupo de trabajo"
          position="start"
        />
        <div
          v-if="workGroupsStatus === 'idle' || workGroupsStatus === 'pending'"
          role="status"
        >
          <span class="sr-only">Cargando grupos de trabajo...</span>
          <USkeleton class="h-34 w-full" />
        </div>
        <UTabs
          v-else
          v-model="selectedWorkGroupFilter"
          :items="workGroupItems"
          :content="false"
          :orientation="horizontalTabs ? 'horizontal' : 'vertical'"
          color="neutral"
          :ui="{
            list: 'w-full md:overflow-x-auto',
            trigger: 'justify-start px-3 py-2 md:flex-1 md:basis-0 md:min-w-12 md:justify-center md:px-1'
          }"
          class="w-full"
        >
          <template #leading="{ item }">
            <UTooltip
              :text="item.name"
              :content="{ side: 'top' }"
              :disabled="!horizontalTabs"
            >
              <span class="flex w-full min-w-0 items-center gap-2 md:justify-center">
                <UIcon
                  :name="item.icon"
                  class="size-6 shrink-0 md:size-8"
                  :style="{ color: item.value === selectedWorkGroupFilter ? undefined : item.color }"
                />
                <!-- Oculto visualmente en md+, pero accesible para lectores de pantalla. -->
                <span class="w-full text-left text-sm md:sr-only">
                  {{ item.name }}
                </span>
              </span>
            </UTooltip>
          </template>
        </UTabs>
        <p
          v-if="workGroupsStatus === 'success'"
          class="text-sm text-muted"
          aria-live="polite"
        >
          <template v-if="selectedWorkGroupFilter === 'all'">
            Mostrando reuniones de todos los grupos de trabajo
          </template>
          <template v-else>
            Mostrando reuniones del grupo:
            <span class="font-semibold text-highlighted">{{ selectedWorkGroupName }}</span>
          </template>
        </p>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <UPageCard>
          Cargando consultas...
        </UPageCard>
      </template>

      <UPageCard v-if="status === 'pending'">
        Cargando consultas...
      </UPageCard>

      <template v-else-if="consultations.length > 0">
        <UBlogPosts
          orientation="vertical"
          :ui="{ base: 'sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:flex-col gap-4 lg:gap-y-4' }"
        >
          <ConsultasConsultaCard
            v-for="consultation in paginatedConsultations"
            :key="consultation.id"
            :consultation="consultation"
            orientation="vertical"
          />
        </UBlogPosts>

        <div
          v-if="consultations.length > PER_PAGE"
          class="flex justify-center"
        >
          <UPagination
            v-model:page="page"
            :items-per-page="PER_PAGE"
            :total="consultations.length"
          />
        </div>
      </template>

      <UEmpty
        v-else
        title="No hay consultas para los filtros seleccionados."
        description="Probá cambiar el estado o el grupo de trabajo para ver más resultados."
        icon="lucide:file"
      />
    </ClientOnly>
  </div>
</template>
