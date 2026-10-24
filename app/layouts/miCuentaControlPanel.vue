<script setup lang="ts">
import type { NavigationMenuItem, ThemeUI } from '@nuxt/ui'

const route = useRoute()
const { canManageConsultations, isCollaborator, isPlatformAdmin } = useAccountRoles()

const itemsNavigationMenu = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Inicio',
      to: '/mi-cuenta',
      icon: 'i-lucide-home',
      active: route.path.startsWith('/mi-cuenta') && route.path === '/mi-cuenta'
    },
    {
      label: 'Editar perfil',
      to: '/mi-cuenta/perfil',
      icon: 'i-lucide-user',
      active: route.path.startsWith('/mi-cuenta/perfil')
    },
    {
      label: 'Foto de perfil',
      to: '/mi-cuenta/avatar',
      icon: 'i-lucide-image',
      active: route.path.startsWith('/mi-cuenta/avatar')
    }
  ],
  ...(canManageConsultations.value || isCollaborator.value || isPlatformAdmin.value
    ? [[
        {
          label: 'Gestión',
          type: 'label' as const
        },
        ...(canManageConsultations.value
          ? [{
              label: 'Mis consultas',
              to: '/mi-cuenta/consultas',
              icon: 'i-lucide-clipboard-list',
              active: route.path.startsWith('/mi-cuenta/consultas')
            }]
          : []),
        {
          label: 'Mis exportaciones',
          to: '/mi-cuenta/exportaciones',
          icon: 'i-lucide-file-down',
          active: route.path.startsWith('/mi-cuenta/exportaciones')
        }
      ]]
    : []),
  [
    {
      label: 'Seguridad',
      type: 'label'
    },
    {
      label: 'Cambiar email',
      to: '/mi-cuenta/email',
      icon: 'i-lucide-mail',
      active: route.path.startsWith('/mi-cuenta/email')
    },
    {
      label: 'Cambiar contraseña',
      to: '/mi-cuenta/contrasena',
      icon: 'i-lucide-lock',
      active: route.path.startsWith('/mi-cuenta/contrasena')
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
    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <UNavigationMenu
                :items="itemsNavigationMenu"
                orientation="vertical"
              />
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
