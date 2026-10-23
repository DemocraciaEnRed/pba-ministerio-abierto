<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ParticipationState, RegionalMeetingSummary } from '~/types/consulta'

interface AgendaItem extends RegionalMeetingSummary {
  id: number
  region: { id: number, slug: string, name: string } | null
  consultation: {
    id: number
    title: string
    publicPath: string
    participationState: ParticipationState
  }
}

interface AgendaResponse {
  year: number
  years: number[]
  items: AgendaItem[]
}

const currentYear = regionalMeetingYear(new Date())
const selectedYear = ref(String(currentYear))

const { data, status } = await useFetch<AgendaResponse>('/api/regional-meetings/agenda', {
  query: { year: selectedYear },
  key: 'encuentros-regionales-agenda'
})

// Los años vienen del servidor (siempre incluye el actual); se conservan entre
// cambios de tab para que el listado de tabs no parpadee mientras carga.
const years = ref<number[]>(data.value?.years ?? [currentYear])
watch(() => data.value?.years, (value) => {
  if (value?.length) years.value = value
})

const yearTabs = computed<TabsItem[]>(() =>
  years.value.map(year => ({ label: String(year), value: String(year) }))
)

const items = computed(() => data.value?.items ?? [])

function regionColorSlug(item: AgendaItem) {
  return item.region ? `region-${item.region.slug}` : null
}
</script>

<template>
  <div class="py-4 space-y-4">
    <UTabs
      v-if="yearTabs.length > 1"
      v-model="selectedYear"
      :items="yearTabs"
      :content="false"
      variant="link"
      color="secondary"
      aria-label="Año de los encuentros"
    />

    <div
      v-if="status === 'pending' && items.length === 0"
      class="text-center text-muted py-8"
    >
      Cargando agenda...
    </div>

    <UEmpty
      v-else-if="items.length === 0"
      icon="lucide:calendar-days"
      :title="`Todavía no hay encuentros para ${selectedYear}`"
      description="Pronto vamos a publicar las fechas de los próximos Encuentros Regionales."
      variant="naked"
    />

    <div
      v-else
      class="grid lg:grid-cols-2 gap-2 items-stretch"
      :class="{ 'opacity-60 transition-opacity': status === 'pending' }"
    >
      <div
        v-for="item in items"
        :key="`agenda-item-${item.id}`"
        class="relative flex overflow-hidden border border-transparent hover:border-accented rounded-md transition-all duration-300"
      >
        <div
          class="w-2.5 shrink-0 rounded-md"
          :class="regionColorSlug(item) ? `bg-${regionColorSlug(item)}` : 'bg-accented'"
        />

        <div class="flex flex-col gap-2 p-4 w-full leading-tight">
          <div class="flex items-start justify-between gap-2">
            <p class="text-muted">
              Región
              <span class="font-bold text-lg text-highlighted">{{ item.region?.name ?? 'Sin región' }}</span>
            </p>
            <UBadge
              :icon="participationStateBadge(item.consultation.participationState).icon"
              :label="participationStateBadge(item.consultation.participationState).label"
              :color="participationStateBadge(item.consultation.participationState).color"
              variant="subtle"
              class="rounded-full shrink-0"
            />
          </div>

          <p class="text-sm font-semibold text-default text-pretty">
            {{ item.consultation.title }}
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-1 w-full">
            <div class="flex items-center justify-between gap-2 px-3 w-full border border-accented bg-accented/15 rounded-sm p-0.5">
              <UIcon
                name="lucide:pin"
                class="min-w-4 size-4 text-secondary"
              />
              <p class="text-sm text-right font-medium">
                {{ item.location }}
              </p>
            </div>
            <div class="flex items-center justify-between gap-2 px-3 w-full border border-accented bg-accented/15 rounded-sm p-0.5">
              <UIcon
                name="lucide:calendar"
                class="min-w-4 size-4 text-secondary"
              />
              <p class="text-sm text-right font-medium">
                {{ formatEventDateTime(item.heldAt) }} h
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 mt-auto">
            <UButton
              :to="item.consultation.publicPath"
              label="Ver más"
              icon="lucide:arrow-right"
              trailing
              color="neutral"
              variant="subtle"
              size="sm"
              block
            />
            <UButton
              v-if="item.registrationUrl && item.registrationState === 'open'"
              :to="item.registrationUrl"
              target="_blank"
              external
              rel="noopener noreferrer"
              label="Inscribite"
              icon="lucide:external-link"
              trailing
              color="secondary"
              size="sm"
              variant="solid"
              block
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
