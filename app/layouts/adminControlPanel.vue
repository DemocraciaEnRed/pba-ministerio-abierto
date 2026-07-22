<script setup lang="ts">
import type { NavigationMenuItem, ThemeUI } from '@nuxt/ui'

const route = useRoute()

const itemsNavigationMenu = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Inicio',
      to: '/admin',
      icon: 'i-lucide-home',
      active: route.path.startsWith('/admin') && route.path === '/admin'
    }
  ],
  [
    {
      label: 'Procesos',
      type: 'label'
    },
    {
      label: 'Consultas',
      to: '/admin/consultas',
      icon: 'i-lucide-message-square',
      active: route.path.startsWith('/admin/consultas')
    }
  ],
  [
    {
      label: 'Clasificación',
      type: 'label'
    },
    {
      label: 'Secciones',
      to: '/admin/secciones',
      icon: 'i-lucide-layout-grid',
      active: route.path.startsWith('/admin/secciones')
    },
    {
      label: 'Categorías',
      to: '/admin/categorias',
      icon: 'i-lucide-folders',
      active: route.path.startsWith('/admin/categorias')
    },
    {
      label: 'Etiquetas',
      to: '/admin/etiquetas',
      icon: 'i-lucide-tags',
      active: route.path.startsWith('/admin/etiquetas')
    }
  ],
  [
    {
      label: 'Configuración',
      type: 'label'
    },
    {
      label: 'General',
      to: '/admin/configuracion',
      icon: 'i-lucide-building-2',
      active: route.path.startsWith('/admin/configuracion')
    },
    {
      label: 'Páginas',
      to: '/admin/paginas',
      icon: 'i-lucide-file-text',
      active: route.path.startsWith('/admin/paginas')
    }
  ],
  [
    {
      label: 'Plataforma',
      type: 'label'
    },
    {
      label: 'Usuarios',
      to: '/admin/usuarios',
      icon: 'i-lucide-users',
      active: route.path.startsWith('/admin/usuarios')
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
              <div class="">
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
