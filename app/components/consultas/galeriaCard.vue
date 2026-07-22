<script setup lang="ts">
interface PublicGalleryImage {
  id: number
  displayOrder: number
  title: string | null
  altText: string | null
  description: string | null
  url: string | null
}

const props = withDefaults(defineProps<{
  images: PublicGalleryImage[]
  title?: string
}>(), {
  title: 'Galería'
})

const items = computed(() =>
  [...props.images]
    .filter(image => image.url)
    .sort((a, b) => a.displayOrder - b.displayOrder)
)

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

const activeImage = computed(() => items.value[activeIndex.value] ?? null)

function onSelect(index: number) {
  activeIndex.value = index
}

function select(index: number) {
  activeIndex.value = index
  carousel.value?.emblaApi?.scrollTo(index)
}

// Si cambia la lista (p. ej. al filtrar), reseteamos el índice activo.
watch(items, () => {
  activeIndex.value = 0
})

function imageAlt(image: PublicGalleryImage): string {
  return image.altText || image.title || 'Imagen de la galería'
}
</script>

<template>
  <UCard
    v-if="items.length"
    variant="subtle"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-images"
          class="size-5 text-muted"
        />
        <h3 class="font-semibold">
          {{ title }}
        </h3>
      </div>
    </template>

    <div class="space-y-3">
      <UCarousel
        ref="carousel"
        v-slot="{ item }"
        :items="items"
        :arrows="items.length > 1"
        class="w-full"
        @select="onSelect"
      >
        <div class="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-elevated">
          <img
            :src="item.url!"
            :alt="imageAlt(item)"
            class="max-h-full max-w-full object-contain"
            loading="lazy"
          >
        </div>
      </UCarousel>

      <div
        v-if="activeImage && (activeImage.title || activeImage.description)"
        class="space-y-1"
      >
        <p
          v-if="activeImage.title"
          class="text-sm font-medium"
        >
          {{ activeImage.title }}
        </p>
        <p
          v-if="activeImage.description"
          class="text-sm text-muted"
        >
          {{ activeImage.description }}
        </p>
      </div>

      <div
        v-if="items.length > 1"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="(image, index) in items"
          :key="image.id"
          type="button"
          class="size-16 overflow-hidden rounded-md border bg-elevated transition"
          :class="activeIndex === index ? 'border-primary opacity-100' : 'border-default opacity-60 hover:opacity-100'"
          :aria-label="`Ver imagen ${index + 1}`"
          @click="select(index)"
        >
          <img
            :src="image.url!"
            :alt="imageAlt(image)"
            class="size-full object-cover"
            loading="lazy"
          >
        </button>
      </div>
    </div>
  </UCard>
</template>
