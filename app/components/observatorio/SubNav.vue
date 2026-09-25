<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { scrollTo } = useScrollTo()

const observatoryPath = '/observatorio-obras-servicios'

const isObservatoryHome = computed(() => route.path === observatoryPath)

const observatorySections = [
  {
    label: '¿Qué es el Observatorio?',
    icon: 'lucide:info',
    id: 'presentacion'
  },
  {
    label: 'Cómo trabajamos',
    icon: 'lucide:workflow',
    id: 'como-trabajamos'
  },
  {
    label: 'Reuniones',
    icon: 'lucide:calendar-days',
    id: 'reuniones'
  },
  {
    label: 'Instituciones',
    icon: 'lucide:building-2',
    id: 'instituciones'
  },
  {
    label: 'Publicaciones',
    icon: 'lucide:file-down',
    id: 'publicaciones'
  },
  {
    label: 'Registro audiovisual',
    icon: 'lucide:video',
    id: 'registro-audiovisual'
  }
]

function selectObservatorySection(id: string, event?: Event) {
  if (!isObservatoryHome.value) return

  event?.preventDefault()
  document.getElementById(id)?.focus({ preventScroll: true })
  scrollTo(id, {
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start'
  })
}

const observatorySectionItems = computed<NavigationMenuItem[]>(() =>
  observatorySections.map(section => ({
    label: section.label,
    icon: section.icon,
    to: `${observatoryPath}#${section.id}`,
    active: isObservatoryHome.value && route.hash === `#${section.id}`,
    onSelect: (event: Event) => selectObservatorySection(section.id, event)
  }))
)

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'El Observatorio',
    icon: 'pba:observatorio',
    active: isObservatoryHome.value,
    children: observatorySectionItems.value
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
  items.value.map(item => ({
    label: item.label,
    icon: item.icon,
    to: item.to,
    children: item.children,
    onSelect: item.onSelect
  }))
)

const activeLabel = computed(() => items.value.find(item => item.active)?.label ?? 'Secciones')
</script>

<template>
  <UContainer>
    <UNavigationMenu
      :items="items"
      orientation="horizontal"
      content-orientation="vertical"
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
