<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
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
const horizontalTabs = ref(false)

onMounted(() => {
  const mediaQuery = window.matchMedia('(min-width: 768px)')
  const updateOrientation = () => {
    horizontalTabs.value = mediaQuery.matches
  }

  updateOrientation()
  mediaQuery.addEventListener('change', updateOrientation)
  onBeforeUnmount(() => mediaQuery.removeEventListener('change', updateOrientation))
})

const consultasStatuses = ref<TabsItem[]>([
  {
    label: 'Todos',
    value: 'all',
    icon: 'lucide:list',
    badge: undefined
  },
  {
    label: 'Participación abierta',
    value: 'open',
    icon: 'lucide:circle-play',
    badge: undefined
  },
  {
    label: 'Participación programada',
    value: 'scheduled',
    icon: 'lucide:calendar-days',
    badge: undefined
  },
  {
    label: 'Instancia participativa finalizada',
    value: 'closed',
    icon: 'lucide:lock',
    badge: undefined
  }
])

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
      <div
        role="group"
        aria-label="Estado de participación"
        class="min-w-0 space-y-3"
      >
        <USeparator
          label="Filtrar por estado de la participación"
          position="start"
        />
        <UTabs
          v-model="selectedStatusFilter"
          :content="false"
          :items="consultasStatuses"
          :orientation="horizontalTabs ? 'horizontal' : 'vertical'"
          color="neutral"
          :ui="{
            list: 'w-full',
            trigger: 'min-h-10 justify-start md:justify-center',
            label: 'whitespace-normal text-left md:text-center wrap-break-word'
          }"
          class="w-full"
        />
      </div>
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
        <!-- <div
          v-else
          class="grid grid-cols-1 gap-1 sm:gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 p-1 bg-"
        >
          <UButton
            v-for="group in workGroupItems"
            :key="group.value"
            :icon="group.icon"
            :label="group.label"
            color="neutral"
            variant="outline"
            :aria-pressed="selectedWorkGroupFilter === group.value"
            :style="{
              '--work-group-color': group.color,
              'color': selectedWorkGroupFilter === group.value ? '#ffffff' : group.color,
              'backgroundColor': selectedWorkGroupFilter === group.value ? group.color : undefined
            }"
            :ui="{
              leadingIcon: 'size-6 sm:size-8',
              label: 'whitespace-normal wrap-break-word'
            }"
            class="min-h-10 w-full gap-2 px-3 py-2 text-left ring-(--work-group-color) hover:bg-(--work-group-color)/10 focus-visible:outline-(--work-group-color)"
            @click="selectedWorkGroupFilter = group.value"
          />
        </div> -->
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
