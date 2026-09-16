<script setup lang="ts">
import type { PublicObservatoryVideoDTO } from '~~/server/utils/serializers/observatoryVideo'

defineOptions({ name: 'ObservatorioVideosCarousel' })

const { data: videos } = await useAsyncData('observatory-videos-carousel', () =>
  $fetch<PublicObservatoryVideoDTO[]>('/api/observatory-videos')
)

const formatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

function formatDate(value: string | null): string | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return formatter.format(new Date(Date.UTC(year!, month! - 1, day!)))
}
</script>

<template>
  <UCarousel
    v-if="videos?.length"
    v-slot="{ item }"
    :items="videos"
    :ui="{ item: 'basis-full md:basis-1/2 lg:basis-1/3' }"
    arrows
    dots
    class="w-full"
  >
    <ULink
      :to="item.youtubeUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="group block w-full"
    >
      <article class="flex h-full flex-col overflow-hidden rounded-xl border border-default">
        <div class="relative aspect-video overflow-hidden bg-elevated">
          <img
            v-if="item.thumbnailUrl"
            :src="item.thumbnailUrl"
            :alt="item.title"
            class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          >
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="flex size-12 items-center justify-center rounded-full bg-black/60 text-white transition-colors group-hover:bg-primary">
              <UIcon
                name="i-lucide-play"
                class="size-6"
              />
            </span>
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-1 p-3">
          <h3 class="line-clamp-2 text-sm font-semibold leading-tight text-highlighted">
            {{ item.title }}
          </h3>
          <p
            v-if="formatDate(item.videoDate)"
            class="text-xs text-muted"
          >
            {{ formatDate(item.videoDate) }}
          </p>
        </div>
      </article>
    </ULink>
  </UCarousel>

  <UEmpty
    v-else
    icon="i-lucide-video"
    title="Todavía no hay registros audiovisuales"
    description="Pronto vas a poder ver acá los videos del Observatorio."
  />
</template>
