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
      to: '/encuentros-regionales'
    }
  ],
  [
    {
      label: 'Formularios',
      to: '/encuentros-regionales/panel/formularios',
      icon: 'i-lucide-inbox',
      active: route.path.startsWith('/encuentros-regionales/panel/formularios')
    },
    {
      label: 'Encuentros',
      to: '/encuentros-regionales/panel/encuentros',
      icon: 'i-lucide-message-square',
      badge: {
        label: 'Consultas',
        color: 'neutral'
      },
      active: route.path.startsWith('/encuentros-regionales/panel/encuentros')
    }
  ],
  [
    {
      label: 'Configuración',
      type: 'label'
    },
    {
      label: 'Regiones',
      to: '/encuentros-regionales/panel/regiones',
      icon: 'i-lucide-map-pinned',
      active: route.path.startsWith('/encuentros-regionales/panel/regiones')
    },
    {
      label: 'Agenda',
      to: '/encuentros-regionales/panel/agenda',
      icon: 'i-lucide-calendar-days',
      active: route.path.startsWith('/encuentros-regionales/panel/agenda')
    },
    {
      label: 'Testimonios',
      to: '/encuentros-regionales/panel/testimonios',
      icon: 'i-lucide-quote',
      active: route.path.startsWith('/encuentros-regionales/panel/testimonios')
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
                    Encuentros Regionales
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
