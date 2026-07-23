<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

interface AuthSessionDTO {
  authenticated: boolean
  user: SelfUserDTO | null
}

const route = useRoute()
const { loggedIn, user } = useUserSession()
const { logout, loading } = useAuth()
const { data: authSession, refresh: refreshAuthSession } = await useFetch<AuthSessionDTO>('/api/auth/session', {
  default: () => ({ authenticated: false, user: null })
})

const userLabel = computed(() => {
  if (!loggedIn.value) {
    return 'Cuenta'
  }

  return user.value?.firstName?.trim()
    || authSession.value?.user?.firstName?.trim()
    || 'Mi cuenta'
})

const userAvatarUrl = computed(() => authSession.value?.user?.avatarUrl || user.value?.avatarUrl || null)

const userMenuItems = computed<DropdownMenuItem[]>(() => {
  // if (!loggedIn.value) {
  //   return [
  //     {
  //       label: 'Iniciar sesión',
  //       to: '/auth/login',
  //       icon: 'lucide:log-in'
  //     },
  //     {
  //       label: 'Crear cuenta',
  //       to: '/auth/signup',
  //       icon: 'lucide:user-plus'
  //     }
  //   ]
  // }

  const menuItems: DropdownMenuItem[] = [
    {
      label: 'Mi cuenta',
      to: '/mi-cuenta',
      icon: 'lucide:user-circle'
    }, {
      label: 'Ver mi perfil',
      to: `/u/${authSession.value?.user?.id}`,
      icon: 'lucide:user'
    }
  ]

  if (authSession.value?.user?.roles?.isPlatformAdmin) {
    menuItems.push({
      label: 'Administración',
      to: '/admin',
      icon: 'lucide:shield-check'
    })
  }

  menuItems.push({
    label: 'Cerrar sesión',
    icon: 'lucide:log-out',
    disabled: loading.value,
    onSelect: async () => await logout()
  })

  return menuItems
})

watch(loggedIn, () => {
  refreshAuthSession()
})

const isParticipaMenuActive = computed(() => {
  return route.path.startsWith('/audiencias') || route.path.startsWith('/consultas') || route.path.startsWith('/territorio') || route.path.startsWith('/dialogos') || route.path.startsWith('/observatorio')
})

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    to: '/',
    icon: 'lucide:home',
    active: route.path === '/'
  },
  {
    label: 'Participá',
    active: isParticipaMenuActive.value,
    children: [
      {
        label: 'Audiencias',
        disabled: true,
        icon: 'pba:audiencias-publicas',
        description: 'Conocé y seguí las audiencias públicas abiertas a la comunidad',
        active: route.path.startsWith('/audiencias')
      },
      {
        label: 'Consultas',
        disabled: true,
        icon: 'pba:consultas-publicas',
        description: 'Sumate a las consultas ciudadanas sobre proyectos de impacto',
        active: route.path.startsWith('/consultas')
      },
      {
        label: 'Diálogos',
        to: '/dialogos',
        icon: 'pba:obras',
        description: 'Formá parte para conocer el avance de obras estratégicas',
        active: route.path.startsWith('/dialogos')
      },
      {
        label: 'Encuentros regionales',
        disabled: true,
        icon: 'pba:territorio',
        description: 'Participá para construir la agenda de desarrollo de tu región',
        active: route.path.startsWith('/territorio')
      },
      {
        label: 'Observatorio',
        disabled: true,
        icon: 'pba:observatorio',
        description: 'Accedé a información sobre este espacio institucional de la Obra Pública provincial',
        active: route.path.startsWith('/observatorio')
      }
    ]
  },
  {
    label: 'Más información',
    icon: 'lucide:plus',
    active: route.path.startsWith('/acerca-de'),
    children: [
      {
        label: 'Términos y condiciones',
        to: '/acerca-de/terminos-y-condiciones',
        description: 'Marco legal y condiciones para participar en la plataforma.',
        active: route.path.startsWith('/acerca-de/terminos-y-condiciones')
      },
      {
        label: 'Política de privacidad',
        to: '/acerca-de/politica-de-privacidad',
        description: 'Cómo protegemos y tratamos tus datos personales',
        active: route.path.startsWith('/acerca-de/politica-de-privacidad')
      }
    ]
  }
])

const itemsMobile = computed<NavigationMenuItem[][]>(() => [
[
  {
    label: 'Inicio',
    to: '/',
    icon: 'lucide:home',
    active: route.path === '/'
  },
],
[
  {
    label: 'Participá',
    type: 'label',
    ui: { label: 'font-medium text-primary text-base' }
  },
  {
        label: 'Audiencias',
        disabled: true,
        icon: 'pba:audiencias-publicas',
        description: 'Conocé y seguí las audiencias públicas abiertas a la comunidad',
        active: route.path.startsWith('/audiencias')
      },
      {
        label: 'Consultas',
        disabled: true,
        icon: 'pba:consultas-publicas',
        description: 'Sumate a las consultas ciudadanas sobre proyectos de impacto',
        active: route.path.startsWith('/consultas')
      },
      {
        label: 'Diálogos',
        to: '/dialogos',
        icon: 'pba:obras',
        description: 'Formá parte para conocer el avance de obras estratégicas',
        active: route.path.startsWith('/dialogos')
      },
      {
        label: 'Encuentros regionales',
        disabled: true,
        icon: 'pba:territorio',
        description: 'Participá para construir la agenda de desarrollo de tu región',
        active: route.path.startsWith('/territorio')
      },
      {
        label: 'Observatorio',
        disabled: true,
        icon: 'pba:observatorio',
        description: 'Accedé a información sobre este espacio institucional de la Obra Pública provincial',
        active: route.path.startsWith('/observatorio')
      }
    ],
    [
  {
    label: 'Más información',
    icon: 'lucide:plus',
    type: 'label',
    ui: { label: 'font-medium text-primary text-base' }
  },
   {
        label: 'Términos y condiciones',
        to: '/acerca-de/terminos-y-condiciones',
        description: 'Marco legal y condiciones para participar en la plataforma.',
        active: route.path.startsWith('/acerca-de/terminos-y-condiciones')
      },
      {
        label: 'Política de privacidad',
        to: '/acerca-de/politica-de-privacidad',
        description: 'Cómo protegemos y tratamos tus datos personales',
        active: route.path.startsWith('/acerca-de/politica-de-privacidad')
      }
    ]
   
  ])

const navigationMenuUi = {
  linkLabel: 'font-medium text-primary hover:text-primary',
  linkLeadingIcon: 'text-primary',
  childLinkLabel: 'text-primary',
  childLinkDescription: 'text-xs',
  childLinkIcon: 'size-10 text-primary'
}
</script>

<template>
  <UHeader
    mode="modal"
  >
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-12 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
    :items="items"
    :ui="navigationMenuUi"
    content-orientation="vertical"
    />
    <template #body>
      <UNavigationMenu
        :items="itemsMobile"
        :ui="navigationMenuUi"
        orientation="vertical"
        />
    </template>

    <template #right>
      <UColorModeButton />
      <UButton
        v-if="!loggedIn"
        to="/auth/login"
        label="Iniciar sesión"
        icon="lucide:log-in"
        color="primary"
        variant="subtle"
        :ui="{
          label: 'hidden lg:inline',
        }"
      />
      <UDropdownMenu
        v-if="loggedIn"
        :items="userMenuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          :label="userLabel"
          :avatar="userAvatarUrl ? { src: userAvatarUrl } : undefined"
          :icon="userAvatarUrl ? undefined : (loggedIn ? 'lucide:user-circle' : 'lucide:circle-user-round')"
          trailing-icon="lucide:chevron-down"
          color="primary"
          variant="ghost"
          :loading="loggedIn && loading"
          :ui="{
            label: 'hidden lg:inline',
          }"
        />
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
