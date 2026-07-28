<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const selectedStatusFilter = ref('scheduled')
const consultasStatuses = ref<TabsItem[]>([
  {
    label: 'Programadas',
    value: 'scheduled'
  },
  {
    label: 'Abiertas',
    value: 'open'
  },
  {
    label: 'Cerradas',
    value: 'closed'
  }
])
</script>

<template>
  <UTabs
    v-model="selectedStatusFilter"
    :content="false"
    :items="consultasStatuses"
    color="neutral"
    class="w-full"
  />
</template>
