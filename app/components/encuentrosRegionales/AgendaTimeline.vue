<script setup lang="ts">
import type { AgendaItemState } from '~/utils/estados'

type AgendaRegionSlug
  = | 'metropolitana'
    | 'fluvial'
    | 'noroeste'
    | 'este'
    | 'centro-sur'
    | 'sudoeste'
    | 'costa-maritima'
    | 'norte'
    | 'centro-norte'

interface AgendaRegion {
  id: number
  slug: AgendaRegionSlug
  name: string
}

interface AgendaItem {
  id: number
  location: string
  heldAt: string
  year: number | null
  state: AgendaItemState
  highlighted: boolean
  registrationUrl: string | null
  region: AgendaRegion
}

const { data, status } = await useFetch<AgendaItem[]>('/api/regional-meetings/agenda', {
  default: () => []
})

const items = computed(() => data.value ?? [])
</script>

<template>
  <div class="py-4">
    <div
      v-if="status === 'pending'"
      class="text-center text-muted py-8"
    >
      Cargando agenda...
    </div>

    <template v-else>
      <div class="grid lg:grid-cols-2 lg:grid-flow-col lg:grid-rows-4 gap-2  items-center">
        <div
          v-for="item in items"
          :key="`agenda-item-${item.id}`"
          class="relative flex overflow-hidden border rounded-md transition-all duration-300"
          :class="item.highlighted ? `border-region-${item.region.slug} bg-region-${item.region.slug}/10` : 'border-transparent hover:border-accented'"
        >
          <!-- Franja de color (lateral en mobile/tablet) -->
          <div
            class="w-2.5 shrink-0 rounded-md"
            :class="`bg-region-${item.region.slug} ${item.highlighted ? 'rounded-none' : null}`"
          />

          <div class="flex flex-col gap-2 p-4 w-full leading-tight">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-1">
                <p class="text-muted">
                  Región
                  <span class="font-bold text-lg text-highlighted">{{ item.region.name }}</span>
                </p>
              </div>
              <div class="flex gap-2">
                <UBadge
                  :icon="agendaItemStateBadge(item.state).icon"
                  :label="agendaItemStateBadge(item.state).label"
                  :color="agendaItemStateBadge(item.state).color"
                  variant="subtle"
                  class="rounded-full"
                />
                <span
                  v-if="item.year"
                  class="shrink-0 rounded-full bg-neutral-900 dark:bg-neutral-100 p-2.5 py-0.5 text-sm font-bold text-white dark:text-neutral-900"
                >
                  {{ item.year }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-1 w-full">
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
                  {{ formatDayMonth(item.heldAt) }}
                </p>
              </div>
            </div>

            <UButton
              v-if="item.registrationUrl"
              :to="item.registrationUrl"
              target="_blank"
              external
              rel="noopener noreferrer"
              label="Inscribite"
              icon="lucide:external-link"
              :color="item.highlighted ? `region-${item.region.slug}` : 'secondary'"
              size="sm"
              variant="solid"
              block
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
