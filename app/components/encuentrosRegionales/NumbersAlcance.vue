<script setup lang="ts">
import type { PageCardProps } from '@nuxt/ui'

interface Metric {
  id: number
  key: string
  label: string
  value: string
  displayOrder: number
}

const { data } = await useFetch<Metric[]>('/api/regional-meetings/metrics', {
  default: () => []
})

const metrics = computed(() => data.value ?? [])

const cardTheme: ComputedRef<PageCardProps['ui']> = computed(() => ({
  root: 'w-full hover:scale-105 transition-transform duration-300',
  title: 'text-5xl font-bold text-primary',
  description: 'uppercase font-semibold text-xl',
  wrapper: 'flex items-center gap-2',
  body: 'flex-1 flex flex-col justify-evenly items-center text-center'
}))
</script>

<template>
  <div
    v-if="metrics.length"
    class="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4 px-16"
  >
    <UPageCard
      v-for="metric in metrics"
      :key="metric.id"
      spotlight
      spotlight-color="primary"
      variant="subtle"
      :title="metric.value"
      :description="metric.label"
      :ui="cardTheme"
    />
  </div>
</template>
