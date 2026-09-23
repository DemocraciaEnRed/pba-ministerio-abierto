<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Sobre el Observatorio',
    icon: 'pba:observatorio',
    to: '/observatorio-obras-servicios',
    active: route.path === '/observatorio-obras-servicios'
  },
  {
    label: 'Formulario de aportes',
    icon: 'lucide:file-text',
    to: '/observatorio-obras-servicios/formulario',
    active: route.path.startsWith('/observatorio-obras-servicios/formulario')
  },
  {
    label: 'Preguntas frecuentes',
    icon: 'lucide:circle-question-mark',
    to: '/observatorio-obras-servicios/preguntas-frecuentes',
    active: route.path.startsWith('/observatorio-obras-servicios/preguntas-frecuentes')
  }
])

// En móvil, el menú horizontal se reemplaza por un dropdown compacto.
const itemsMobile = computed<DropdownMenuItem[]>(() =>
  items.value.map(item => ({ label: item.label, icon: item.icon, to: item.to }))
)

const activeLabel = computed(() => items.value.find(item => item.active)?.label ?? 'Secciones')
</script>

<template>
  <UContainer>
    <UNavigationMenu
      :items="items"
      orientation="horizontal"
      class="hidden sm:flex justify-center"
    />
    <div class="sm:hidden flex justify-center py-1">
      <UDropdownMenu
        :items="itemsMobile"
        :content="{ align: 'center' }"
        arrow
      >
        <UButton
          :label="activeLabel"
          trailing-icon="lucide:chevron-down"
          variant="ghost"
          color="neutral"
        />
      </UDropdownMenu>
    </div>
  </UContainer>
</template>
