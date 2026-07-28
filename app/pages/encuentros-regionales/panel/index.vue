<script setup lang="ts">
import type { PageCardProps } from '@nuxt/ui'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Administración - Encuentros Regionales')

const accessCards: (PageCardProps & { to: string })[] = [
  {
    title: 'Encuentros',
    description: 'Consultas que pertenecen a los Encuentros Regionales y tienen una región asignada.',
    icon: 'i-lucide-message-square',
    to: '/encuentros-regionales/panel/encuentros'
  },
  {
    title: 'Formularios',
    description: 'Aportes enviados por la ciudadanía a través del formulario público.',
    icon: 'i-lucide-inbox',
    to: '/encuentros-regionales/panel/formularios'
  },
  {
    title: 'Regiones',
    description: 'Catálogo fijo de regiones de la Provincia de Buenos Aires.',
    icon: 'i-lucide-map-pinned',
    to: '/encuentros-regionales/panel/regiones'
  },
  {
    title: 'Agenda',
    description: 'Fechas y municipios de los Encuentros Regionales y su estado de realización.',
    icon: 'i-lucide-calendar-days',
    to: '/encuentros-regionales/panel/agenda'
  },
  {
    title: 'Testimonios',
    description: 'Testimonios de participantes que se muestran en la página pública.',
    icon: 'i-lucide-quote',
    to: '/encuentros-regionales/panel/testimonios'
  }
]
</script>

<template>
  <div>
    <UPageHeader
      title="Administración de Encuentros Regionales"
      description="Gestione todo lo referido a los Encuentros Regionales desde este panel de administración."
    />
    <UPageBody>
      <UPageGrid>
        <UPageCard
          v-for="card in accessCards"
          :key="card.to"
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :to="card.to"
          spotlight
        />
      </UPageGrid>
    </UPageBody>
  </div>
</template>
