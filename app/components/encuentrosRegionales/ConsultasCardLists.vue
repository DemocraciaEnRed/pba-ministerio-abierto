<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { PublicConsultationListItem } from '~/types/consulta'

type StatusFilter = 'scheduled' | 'open' | 'closed'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
}

// Cantidad de tarjetas visibles por página. El fetch trae todo el listado
// (nunca hay más consultas que regiones), pero paginamos en cliente de a 4.
const PER_PAGE = 4

const selectedStatusFilter = ref<StatusFilter>('scheduled')
const consultasStatuses = ref<TabsItem[]>([
  {
    label: 'Programados',
    value: 'scheduled'
  },
  {
    label: 'Abiertos',
    value: 'open'
  },
  {
    label: 'Realizados',
    value: 'closed'
  }
])

// Listado fijado a la sección `encuentros-regionales`, filtrado por estado.
// `server: false` fuerza la carga en cliente (no bloquea el render inicial).
const { data, status } = await useAsyncData(
  'encuentros-regionales-consultas-cardlist',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      page: 1,
      perPage: 50,
      sectionSlug: 'encuentros-regionales',
      state: selectedStatusFilter.value
    }
  }),
  {
    server: false,
    lazy: true,
    watch: [selectedStatusFilter]
  }
)

const consultations = computed(() => data.value?.items ?? [])

// Paginación en cliente sobre el listado ya cargado.
const page = ref(1)
const paginatedConsultations = computed(() =>
  consultations.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
)

// Al cambiar el estado, volvemos a la primera página.
watch(selectedStatusFilter, () => {
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

    <!-- El listado se carga solo en cliente (`server: false`); envolverlo en
         `ClientOnly` evita el desajuste de hidratación entre el estado inicial
         del servidor (sin datos) y el del cliente (fetch en curso). -->
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
        <div class="space-y-4">
          <ConsultasConsultaCard
            v-for="consultation in paginatedConsultations"
            :key="consultation.id"
            :consultation="consultation"
            orientation="horizontal"
          />
        </div>

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
        title="No hay consultas para el estado seleccionado."
        description="Probá con otro estado para ver más resultados."
        icon="lucide:file"
      />
    </ClientOnly>
  </div>
</template>
