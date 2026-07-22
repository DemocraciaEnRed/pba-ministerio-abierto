<script setup lang="ts">
import type { DropdownMenuItem, HeaderProps, NavigationMenuItem } from '@nuxt/ui'
import AppLogo from './AppLogo.vue'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    to: '/',
    icon: 'lucide:home',
    active: route.path === '/',
  },
  {
    label: 'Participá',
    active: route.path.startsWith('/audiencias') || route.path.startsWith('/consultas') || route.path.startsWith('/territorio') || route.path.startsWith('/dialogos') || route.path.startsWith('/observatorio'),
    children: [
      {
        label: 'Audiencias',
        disabled: true,
        icon: 'pba:audiencias-publicas',
        description: 'Conocé y seguí las audiencias públicas abiertas a la comunidad',
        active: route.path.startsWith('/audiencias'),
      },
      {
        label: 'Consultas',
        disabled: true,
        icon: 'pba:consultas-publicas',
        description: 'Sumate a las consultas ciudadanas sobre proyectos de impacto',
        active: route.path.startsWith('/consultas'),
      },
      {
        label: 'Encuentros regionales',
        disabled: true,
        icon: 'pba:territorio',
        description: 'Participá para construir la agenda de desarrollo de tu región',
        active: route.path.startsWith('/territorio'),
      },
      {
        label: 'Diálogos',
        to: '/dialogos',
        icon: 'pba:obras',
        description: 'Formá parte para conocer el avance de obras estratégicas',
        active: route.path.startsWith('/dialogos'),
      },
      {
        label: 'Observatorio',
        disabled: true,
        icon: 'pba:observatorio',
        description: 'Accedé a información sobre este espacio institucional de la Obra Pública provincial',
        active: route.path.startsWith('/observatorio'),
      },
    ]
  },
  {
    label: 'Más información',
    icon: 'lucide:plus',
    active: route.path.startsWith('/acerca-de'),
    children: [
      {
        label: 'Términos y condiciones',
        to: '/terminos-y-condiciones',
        description: 'Marco legal y condiciones para participar en la plataforma.',
        active: route.path.startsWith('/terminos-y-condiciones')
      },
      {
        label: 'Política de privacidad',
        to: '/politica-de-privacidad',
        description: 'Cómo protegemos y tratamos tus datos personales',
        active: route.path.startsWith('/politica-de-privacidad')
      }
    ]
  }
])

const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Iniciar sesión',
    to: '/auth/login',
    icon: 'lucide:log-in'
  },
  {
    label: 'Crear cuenta',
    to: '/auth/signup',
    icon: 'lucide:user-plus'
  },
  {
    label: 'Mi perfil (demo)',
    to: '/perfil',
    icon: 'lucide:user-circle'
  },
  {
    label: 'Administración (demo)',
    to: '/admin',
    icon: 'lucide:shield-check'
  },
  {
    label: 'Cerrar sesión (simulado)',
    icon: 'lucide:log-out',
    disabled: true
  }
])

</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-12 shrink-0" />
      </NuxtLink>
    </template>
 
    <UNavigationMenu :items="items" class="w-full md:min-w-2xl justify-center" color="primary" :ui="{
      linkLabel: 'font-medium text-primary hover:text-primary',
      linkLeadingIcon: 'text-primary',
      childLinkLabel: 'text-primary',
      childLinkDescription: 'text-xs',
      childLinkIcon: 'size-10 text-primary',
    }" />

    <template #right>
      <UColorModeButton />
      <!-- <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          label="Cuenta"
          icon="lucide:circle-user-round"
          trailing-icon="lucide:chevron-down"
          color="neutral"
          variant="ghost"
        />
      </UDropdownMenu> -->
    </template>
  </UHeader>
</template>
