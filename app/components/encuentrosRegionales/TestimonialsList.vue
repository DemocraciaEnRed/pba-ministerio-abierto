<script setup lang="ts">
interface TestimonialGroupRegion {
  id: number
  slug: string
  name: string
}

interface Testimonial {
  id: number
  body: string
  authorName: string
  municipality: string
}

interface TestimonialGroup {
  id: number
  name: string
  municipality: string
  heldAt: string
  region: TestimonialGroupRegion | null
  testimonials: Testimonial[]
}

const { data, status } = await useFetch<TestimonialGroup[]>('/api/regional-meetings/testimonials', {
  default: () => []
})

const getBodyBackgroundColor = (group: TestimonialGroup) => {
  if (group.region) {
    return `border border-region-${group.region.slug} dark:text-region-${group.region.slug} bg-region-${group.region.slug}/10 dark:bg-region-${group.region.slug}/20`
  }
  return 'bg-accented'
}

const groups = computed(() =>
  (data.value ?? []).map(group => ({
    ...group,
    bodyBackgroundColor: getBodyBackgroundColor(group),
    testimoniosBackgroundColor: getBodyBackgroundColor(group)
  }))
)
</script>

<template>
  <div
    v-if="status === 'pending'"
    class="text-center text-muted py-8"
  >
    Cargando testimonios...
  </div>

  <UCarousel
    v-else
    v-slot="{ item: group }"
    :items="groups"
    arrows
    dots
    :ui="{
      viewport: 'overflow-hidden p-2',
      container: 'items-start ms-0',
      item: 'basis-full ps-0'
    }"
    class="w-full"
  >
    <section class="space-y-4 w-full px-4">
      <div
        class="text-center"
        :class="['rounded-lg p-4', `${group.bodyBackgroundColor}`]"
      >
        <p class="font-semibold">
          Participantes del Encuentro {{ group.name }}
        </p>
        <p class="text-sm text-muted">
          {{ [group.municipality, formatDateLong(group.heldAt)].filter(Boolean).join(' | ') }}
        </p>
      </div>

      <UPageColumns>
        <UPageCard
          v-for="testimonial in group.testimonials"
          :key="`testimonial-${testimonial.id}`"
          variant="subtle"
          :description="testimonial.body"
          :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]', root: group.testimoniosBackgroundColor }"
        >
          <template #footer>
            <UUser
              :name="testimonial.authorName"
              :description="testimonial.municipality"
              :avatar="{ src: undefined, alt: testimonial.authorName }"
              size="xl"
            />
          </template>
        </UPageCard>
      </UPageColumns>
    </section>
  </UCarousel>
</template>
