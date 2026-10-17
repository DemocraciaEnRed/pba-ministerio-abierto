<script setup lang="ts">
import type { PublicConsultationListItem } from '~/types/consulta'

interface ConsultationsResponse {
  items: PublicConsultationListItem[]
}

const { data } = await useAsyncData(
  'home-destacadas-consultations',
  () => $fetch<ConsultationsResponse>('/api/consultations', {
    query: {
      featured: 'true',
      states: 'open,scheduled',
      perPage: 12
    }
  }),
  {
    server: false,
    lazy: true
  }
)

// Primero las que tienen la inscripción presencial abierta, después las que la
// tienen programada; el resto mantiene el orden del servidor (sort estable).
const registrationPriority = { open: 0, scheduled: 1, closed: 2 } as const

const items = computed(() =>
  [...(data.value?.items ?? [])].sort((a, b) =>
    registrationPriority[a.registration?.state ?? 'closed'] - registrationPriority[b.registration?.state ?? 'closed']
  )
)

// Con una sola card no hay nada que rotar. Con dos, en md+ se ven ambas
// (2 columnas) y Embla no tiene a dónde avanzar; en mobile rotan.
const hasMultiple = computed(() => items.value.length > 1)

// Autoplay solo si la persona no pidió reducir el movimiento.
const prefersReducedMotion = ref(false)
onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const autoplay = computed(() =>
  hasMultiple.value && !prefersReducedMotion.value
    ? { delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }
    : false
)
</script>

<template>
  <template v-if="items.length">
    <UPageSection
      id="destacadas"
      title="Destacadas"
      description="Instancias abiertas o programadas que vale la pena conocer primero, con las inscripciones presenciales abiertas al frente."
    >
      <UCarousel
        v-slot="{ item }"
        :items="items"
        :arrows="items.length > 2"
        :dots="items.length > 2"
        :loop="hasMultiple"
        :autoplay="autoplay"
        class="w-full"
        :ui="{
          container: 'items-stretch',
          item: items.length > 1 ? 'basis-full md:basis-1/2' : 'basis-full'
        }"
      >
        <div class="h-full p-1">
          <ConsultasConsultaCard
            :consultation="item"
            orientation="horizontal"
            class="h-full"
          />
        </div>
      </UCarousel>
    </UPageSection>
    <USeparator />
  </template>
</template>
