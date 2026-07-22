<script setup lang="ts">
import type { PageCardProps, ThemeUI } from '@nuxt/ui'
import { fromNow } from '~~/app/utils/dates'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Mi cuenta')

const { profile, canManageConsultations } = useAccountRoles()

const displayName = computed(() => {
  const p = profile.value
  if (!p) return 'Tu cuenta'
  return p.displayName?.trim() || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.email
})

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return undefined

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

const estadoCuentaItems = computed<PageCardProps[]>(() => {
  const p = profile.value
  if (!p) {
    return [
      {
        title: 'Cuenta',
        description: 'Cargando estado de tu cuenta…',
        icon: 'i-lucide-loader-circle'
      }
    ]
  }

  return [
    {
      title: 'Email',
      description: p.emailVerifiedAt ? 'Correo verificado' : 'Pendiente de verificación',
      icon: p.emailVerifiedAt ? 'i-lucide-badge-check' : 'i-lucide-alert-circle'
    },
    {
      title: 'Último acceso',
      description: fromNow(p.lastLoginAt),
      icon: 'i-lucide-clock-3'
    },
    {
      title: 'Perfil público',
      description: 'Completá tu información para generar más confianza.',
      icon: 'i-lucide-id-card',
      to: '/mi-cuenta/perfil'
    }
  ]
})

const accesosRapidosItems = computed<PageCardProps[]>(() => {
  const items: PageCardProps[] = [
    {
      title: 'Editar perfil',
      description: 'Actualizá tu información personal y preferencias públicas.',
      icon: 'i-lucide-user-round-cog',
      to: '/mi-cuenta/perfil'
    },
    {
      title: 'Foto de perfil',
      description: 'Subí o recortá una imagen para personalizar tu cuenta.',
      icon: 'i-lucide-image-up',
      to: '/mi-cuenta/avatar'
    }
  ]

  if (canManageConsultations.value) {
    items.push({
      title: 'Mis consultas',
      description: 'Revisá las consultas donde tenés rol de gestión.',
      icon: 'i-lucide-clipboard-list',
      to: '/mi-cuenta/consultas'
    })
  }

  return items
})

const seguridadLinks: PageCardProps[] = [
  {
    title: 'Cambiar email',
    description: 'Actualizá tu dirección de correo electrónico.',
    icon: 'i-lucide-mail',
    to: '/mi-cuenta/email'
  },
  {
    title: 'Cambiar contraseña',
    description: 'Modificá tu contraseña para mantener tu cuenta segura.',
    icon: 'i-lucide-lock',
    to: '/mi-cuenta/contrasena'
  }
]

const greetingBasedOnTime = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '¡Buen día!'
  if (hour < 18) return '¡Buenas tardes!'
  return '¡Buenas noches!'
}

const uiTheme: ThemeUI = {
  separator: {
    label: 'text-lg'
  }
}
</script>

<template>
  <UTheme :theme="uiTheme">
    <UPageBody>
      <UPageCard variant="subtle">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              :src="profile?.avatarUrl || undefined"
              :text="initials"
              icon="i-lucide-user"
              size="3xl"
            />
            <div class="space-y-1">
              <p class="text-sm text-muted">
                {{ greetingBasedOnTime() }}
              </p>
              <p class="text-xl font-semibold">
                {{ displayName }}
              </p>
              <p class="text-sm text-muted">
                {{ profile?.email }}
              </p>
            </div>
          </div>
          <UBadge
            :label="profile?.emailVerifiedAt ? 'Cuenta verificada' : 'Cuenta pendiente de verificación'"
            :color="profile?.emailVerifiedAt ? 'success' : 'warning'"
            variant="subtle"
            class="self-start sm:self-center"
          />
        </div>
      </UPageCard>
      <USeparator
        label="Estado de la cuenta"
        position="start"
      />
      <section class="space-y-3">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UPageCard
            v-for="item in estadoCuentaItems"
            :key="item.title"
            v-bind="item"
          />
        </div>
      </section>
      <USeparator
        label="Accesos rápidos"
        position="start"
      />
      <section class="space-y-3">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UPageCard
            v-for="item in accesosRapidosItems"
            :key="item.title"
            v-bind="item"
            spotlight
          />
        </div>
      </section>
      <USeparator
        label="Seguridad"
        position="start"
      />
      <section class="space-y-3">
        <div class="grid gap-4 sm:grid-cols-2">
          <UPageCard
            v-for="item in seguridadLinks"
            :key="item.title"
            v-bind="item"
          />
        </div>
      </section>
    </UPageBody>
  </UTheme>
</template>
