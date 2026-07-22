<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Consultas',
    to: '/admin/consultas',
    icon: 'i-lucide-message-square',
    active: route.path.startsWith('/admin/consultas')
  },
  {
    label: 'Configuración',
    to: '/admin/configuracion',
    icon: 'i-lucide-building-2',
    active: route.path.startsWith('/admin/configuracion')
  },
  {
    label: 'Páginas',
    to: '/admin/paginas',
    icon: 'i-lucide-file-text',
    active: route.path.startsWith('/admin/paginas')
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
  },
  {
    label: 'Usuarios',
    to: '/admin/usuarios',
    icon: 'i-lucide-users',
    active: route.path.startsWith('/admin/usuarios')
  }
])
</script>

<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="font-semibold"
        >
          Administración
        </NuxtLink>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UButton
          to="/"
          label="Volver al sitio"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-6">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
