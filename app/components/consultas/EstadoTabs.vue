<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { statusFilterIcons } from '~/utils/estados'

type EstadoTabsValue = 'all' | 'scheduled' | 'open' | 'closed'

// Tabs de estado de participación con la estética del explorador del
// Observatorio: verticales en mobile y horizontales desde md.
const model = defineModel<EstadoTabsValue>({ default: 'all' })

const horizontal = useIsMdUp()

const items: TabsItem[] = [
  { label: 'Todas', value: 'all', icon: statusFilterIcons.all },
  { label: 'Participación abierta', value: 'open', icon: statusFilterIcons.open },
  { label: 'Participación programada', value: 'scheduled', icon: statusFilterIcons.scheduled },
  { label: 'Instancia participativa finalizada', value: 'closed', icon: statusFilterIcons.closed }
]
</script>

<template>
  <div
    role="group"
    aria-label="Estado de participación"
    class="min-w-0 space-y-3"
  >
    <USeparator
      label="Filtrar por estado de la participación"
      position="start"
    />
    <UTabs
      v-model="model"
      :content="false"
      :items="items"
      :orientation="horizontal ? 'horizontal' : 'vertical'"
      color="neutral"
      :ui="{
        list: 'w-full',
        trigger: 'min-h-10 justify-start md:justify-center',
        label: 'whitespace-normal text-left md:text-center wrap-break-word'
      }"
      class="w-full"
    />
  </div>
</template>
