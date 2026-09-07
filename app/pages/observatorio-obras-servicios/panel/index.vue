<script setup lang="ts">
import type { PageCardProps } from '@nuxt/ui'

definePageMeta({
  layout: 'observatorio-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Administración - Observatorio de Obras y Servicios Públicos')

const accessCards: (PageCardProps & { to: string })[] = [
  {
    title: 'Consultas',
    description: 'Consultas que pertenecen al Observatorio y tienen un grupo de trabajo asignado.',
    icon: 'i-lucide-message-square',
    to: '/observatorio-obras-servicios/panel/consultas'
  },
  {
    title: 'Grupos de trabajo',
    description: 'Catálogo fijo de grupos de trabajo del Observatorio.',
    icon: 'i-lucide-users',
    to: '/observatorio-obras-servicios/panel/grupos-trabajo'
  }
]
</script>

<template>
  <div>
    <UPageHeader
      title="Administración del Observatorio"
      description="Gestione todo lo referido al Observatorio de Obras y Servicios Públicos desde este panel de administración."
    />
    <UPageBody class="space-y-8">
      <ObservatorioPanelOverviewStats />

      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted">
          Accesos rápidos
        </h2>
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
      </section>
    </UPageBody>
  </div>
</template>
