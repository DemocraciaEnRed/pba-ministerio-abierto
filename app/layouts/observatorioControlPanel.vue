<script setup lang="ts">
import type { NavigationMenuItem, ThemeUI } from '@nuxt/ui'

const route = useRoute()

const itemsNavigationMenu = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Volver',
      icon: 'i-lucide-arrow-left',
      to: '/admin'
    },
    {
      label: 'Ir a la página',
      icon: 'i-lucide-external-link',
      to: '/observatorio-obras-servicios'
    }
  ],
  [
    {
      label: 'Consultas',
      to: '/observatorio-obras-servicios/panel/consultas',
      icon: 'i-lucide-message-square',
      badge: {
        label: 'Consultas',
        color: 'neutral'
      },
      active: route.path.startsWith('/observatorio-obras-servicios/panel/consultas')
    },
    {
      label: 'Aportes',
      to: '/observatorio-obras-servicios/panel/aportes',
      icon: 'i-lucide-inbox',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/aportes')
    }
  ],
  [
    {
      label: 'Configuración',
      type: 'label'
    },
    {
      label: 'Grupos de trabajo',
      to: '/observatorio-obras-servicios/panel/grupos-trabajo',
      icon: 'i-lucide-users',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/grupos-trabajo')
    },
    {
      label: 'Instituciones',
      to: '/observatorio-obras-servicios/panel/instituciones',
      icon: 'i-lucide-building-2',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/instituciones')
    },
    {
      label: 'Métricas',
      to: '/observatorio-obras-servicios/panel/metricas',
      icon: 'i-lucide-chart-no-axes-column',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/metricas')
    },
    {
      label: 'Publicaciones',
      to: '/observatorio-obras-servicios/panel/publicaciones',
      icon: 'i-lucide-book-open',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/publicaciones')
    },
    {
      label: 'Registro audiovisual',
      to: '/observatorio-obras-servicios/panel/registro-audiovisual',
      icon: 'i-lucide-video',
      active: route.path.startsWith('/observatorio-obras-servicios/panel/registro-audiovisual')
    }
  ]
])

const uiTheme: ThemeUI = {
  pageAside: {
    container: 'gap-2'
  }
}
</script>

<template>
  <UTheme :theme="uiTheme">
    <Header />
    <UMain class="">
      <UContainer class="">
        <UPage>
          <template #left>
            <UPageAside>
              <div class="space-y-2 pb-2">
                <div class="flex justify-between items-start">
                  <p class="font-semibold leading-tight text-sm">
                    Observatorio de Obras y Servicios Públicos
                  </p>
                </div>
                <USeparator class="my-2" />
                <UNavigationMenu
                  :items="itemsNavigationMenu"
                  orientation="vertical"
                />
              </div>
            </UPageAside>
          </template>
          <slot />
          <template
            v-if="$slots['page-right']"
            #right
          >
            <UPageAside>
              <slot name="page-right" />
            </UPageAside>
          </template>
        </UPage>
      </UContainer>
    </UMain>
    <Footer />
  </UTheme>
</template>
