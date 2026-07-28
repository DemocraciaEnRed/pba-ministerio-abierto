<script setup lang="ts">
interface AgendaRegion {
  id: number
  slug: string
  name: string
}

interface AgendaItem {
  id: number
  location: string
  heldAt: string
  year: number | null
  held: boolean
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
      <!-- Timeline horizontal (lg+) -->
      <div class="hidden lg:grid grid-flow-col auto-cols-fr overflow-x-auto">
        <div
          v-for="item in items"
          :key="item.id"
          class=" flex flex-col items-stretch hover:bg-primary/5  dark:hover:bg-secondary/10 rounded-lg px-1 transition-all duration-300"
        >
          <!-- Marca de año -->
          <div>
            <div class="h-12 flex items-center">
              <template v-if="item.year">
                <span class="w-1 h-6 bg-neutral-900 dark:bg-neutral-100 mr-2" />
                <span class="text-lg font-bold">{{ item.year }}</span>
              </template>
            </div>
            <!-- Segmento de color -->
            <div
              class="h-4 rounded-sm border border-accented"
              :class="`bg-region-${item.region.slug}`"
            />
          </div>

          <!-- Detalle -->
          <div class="mt-3 text-center leading-tight space-y-2 items-center w-full flex flex-col h-full">
            <p class="text-muted">
              Región
              <span class="block font-bold text-lg text-highlighted">{{ item.region.name }}</span>
            </p>
            <div class="w-5 border-t border-accented mx-auto" />
            <div class="flex flex-col justify-center items-center gap-1 w-full p-0.5">
              <div class="flex justify-between items-center gap-1 px-1 w-full border border-accented bg-accented/15 rounded-sm p-1">
                <UIcon
                  name="lucide:pin"
                  class="min-w-4 size-4 text-muted"
                />
                <p class="text-right text-xs xl:text-sm font-medium">
                  {{ item.location }}
                </p>
              </div>
              <div class="flex justify-between items-center gap-1 px-1 w-full border border-accented bg-accented/15 rounded-sm p-0.5">
                <UIcon
                  name="lucide:calendar"
                  class="min-w-4 size-4 text-muted"
                />
                <p class="text-right text-xs xl:text-sm font-medium">
                  {{ formatDayMonth(item.heldAt) }}
                </p>
              </div>
            </div>
            <!-- Cuando se completa, se muestra este check -->
            <UIcon
              v-if="item.held"
              name="lucide:circle-check"
              class="size-8 text-success mb-3"
            />
          </div>
        </div>
      </div>

      <!-- Mobile (columna vertical) y tablet (grilla de tarjetas) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 lg:hidden">
        <div
          v-for="item in items"
          :key="item.id"
          class="relative flex overflow-hidden border border-transparent rounded-sm hover:border-accented transition-all duration-300"
        >
          <!-- Franja de color (lateral en mobile/tablet) -->
          <div
            class="w-2 shrink-0 rounded-md"
            :class="`bg-region-${item.region.slug}`"
          />

          <div class="flex flex-col gap-2 p-4 w-full leading-tight">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-1">
                <p class="text-muted">
                  Región
                  <span class="font-bold text-lg text-highlighted">{{ item.region.name }}</span>
                </p>
                <UIcon
                  v-if="item.held"
                  name="lucide:circle-check"
                  class="size-5 ml-2 text-success"
                />
              </div>
              <span
                v-if="item.year"
                class="shrink-0 rounded-full bg-neutral-900 dark:bg-neutral-100 p-2.5 py-0.5 text-sm font-bold text-white dark:text-neutral-900"
              >
                {{ item.year }}
              </span>
            </div>

            <div class="flex sm:flex-col gap-1 w-full">
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
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
