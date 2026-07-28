<script setup lang="ts">
import type { PageCardProps } from '@nuxt/ui'

// 3 encuentros regionales realizados
// 27 municipios alcanzados
// 1.050 participantes totales
// 42 proyectos ciudadanos recibidos

const cardTheme: ComputedRef<PageCardProps['ui']> = computed(() => ({
  root: 'w-full hover:scale-105 transition-transform duration-300',
  title: 'text-5xl font-bold text-primary',
  description: 'uppercase font-semibold text-xl',
  wrapper: 'flex items-center gap-2',
  body: 'flex-1 flex flex-col justify-evenly items-center text-center'
}))
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4 px-16">
    <UPageCard
      spotlight
      spotlight-color="primary"
      variant="subtle"
      title="3"
      description="Eventos realizados"
      :ui="cardTheme"
    />
    <UPageCard
      spotlight
      spotlight-color="primary"
      variant="subtle"
      title="27"
      description="Municipios alcanzados"
      :ui="cardTheme"
    />
    <UPageCard
      spotlight
      spotlight-color="primary"
      variant="subtle"
      title="1.050"
      description="Participantes totales"
      :ui="cardTheme"
    />
    <UPageCard
      spotlight
      spotlight-color="primary"
      variant="subtle"
      title="42"
      description="Proyectos ciudadanos recibidos"
      :ui="cardTheme"
    />
  </div>
</template>
