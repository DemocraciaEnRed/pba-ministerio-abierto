<script setup lang="ts">
import type { ListboxItem, TabsItem } from '@nuxt/ui'
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
  displayOrder: number
}

const PER_PAGE = 4
const OBSERVATORY_SECTION_SLUG = 'observatorio-obras-servicios'

const selectedStatusFilter = ref<StatusFilter>('all')
const selectedWorkGroupIds = ref<number[]>([])

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

const selectedWorkGroupKey = computed(() => selectedWorkGroupIds.value.join(','))

const { data: workGroupsData, status: workGroupsStatus } = await useAsyncData(
  'observatorio-consultas-work-groups',
  () => $fetch<PublicWorkGroup[]>('/api/observatory-work-groups'),
  {
    server: false,
    lazy: true
  }
)

const workGroupItems = computed<ListboxItem[]>(() =>
  (workGroupsData.value ?? []).map(group => ({
    label: group.name,
    value: group.id,
    icon: group.icon
  }))
)

const { data, status } = await useAsyncData(
  'observatorio-consultas-cardlist',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: 1,
      perPage: 50,
      sectionSlug: OBSERVATORY_SECTION_SLUG,
      ...(selectedStatusFilter.value !== 'all' && { state: selectedStatusFilter.value }),
      ...(selectedWorkGroupIds.value.length > 0 && { observatoryWorkGroupIds: selectedWorkGroupKey.value })
    }
  }),
  {
    server: false,
    lazy: true,
    watch: [selectedStatusFilter, selectedWorkGroupKey]
  }
)

const consultations = computed(() => data.value?.items ?? [])

const page = ref(1)
const paginatedConsultations = computed(() =>
  consultations.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

watch([selectedStatusFilter, selectedWorkGroupKey], () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-4">
    <UTabs
      v-model="selectedStatusFilter"
      :content="false"
      :items="consultasStatuses"
      color="neutral"
      class="w-full"
    />

    <div class="space-y-2">
      <USeparator
        label="Grupos de trabajo"
        position="start"
      />
      <UListbox
        v-model="selectedWorkGroupIds"
        :items="workGroupItems"
        value-key="value"
        size="sm"
        multiple
        :loading="workGroupsStatus === 'pending'"
        :ui="{
          label: 'text-sm'
        }"
      />
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
        description="Probá cambiar el estado o los grupos de trabajo para ver más resultados."
        icon="lucide:file"
      />
    </ClientOnly>
  </div>
</template>
