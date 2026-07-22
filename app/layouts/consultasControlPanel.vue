<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { slug, data: consultation } = useConsultationAdmin()
const listLink = useConsultationsListLink()

const basePath = computed(() => `/consultas/${slug.value}/panel`)
const publicView = computed(() => `/consultas/${slug.value}`)

const estadoBadge = computed(() =>
  consultation.value
    ? consultationStateBadge(consultation.value.visibility, consultation.value.participationState)
    : null
)

const itemsNavigationMenu = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Volver a consultas',
      icon: 'i-lucide-arrow-left',
      to: listLink.value
    },
    {
      label: 'Ver consulta',
      icon: 'i-lucide-external-link',
      to: publicView.value,
      size: 'sm'
    }
  ],
  [
    {
      label: 'Panel',
      icon: 'i-lucide-layout-dashboard',
      to: basePath.value,
      active: route.path === basePath.value
    },
    {
      label: 'Temas de participación',
      icon: 'i-lucide-list-tree',
      to: `${basePath.value}/temas`,
      active: route.path.startsWith(`${basePath.value}/temas`)
    }
  ],
  [
    {
      label: 'Editar',
      icon: 'i-lucide-pencil',
      to: `${basePath.value}/editar`,
      active: route.path.startsWith(`${basePath.value}/editar`)
    },
    {
      label: 'Clasificación',
      icon: 'i-lucide-shapes',
      to: `${basePath.value}/clasificacion`,
      active: route.path.startsWith(`${basePath.value}/clasificacion`)
    }
  ],
  [
    {
      type: 'label',
      label: 'Contenido'
    },
    {
      label: 'Enlaces',
      icon: 'i-lucide-link',
      to: `${basePath.value}/enlaces`,
      active: route.path.startsWith(`${basePath.value}/enlaces`)
    },
    {
      label: 'Archivos',
      icon: 'i-lucide-paperclip',
      to: `${basePath.value}/archivos`,
      active: route.path.startsWith(`${basePath.value}/archivos`)
    },
    {
      label: 'Galería',
      icon: 'i-lucide-images',
      to: `${basePath.value}/galeria`,
      active: route.path.startsWith(`${basePath.value}/galeria`)
    },
    {
      label: 'Miembros y roles',
      icon: 'i-lucide-users',
      to: `${basePath.value}/miembros`,
      active: route.path.startsWith(`${basePath.value}/miembros`)
    },
    {
      label: 'Comentarios',
      icon: 'i-lucide-message-square',
      to: `${basePath.value}/comentarios`,
      active: route.path.startsWith(`${basePath.value}/comentarios`)
    },
    {
      label: 'Configuración',
      icon: 'i-lucide-settings',
      to: `${basePath.value}/configuracion`,
      active: route.path.startsWith(`${basePath.value}/configuracion`)
    }
  ],
  [
    {
      label: 'Participación',
      icon: 'i-lucide-users',
      disabled: true,
      badge: { label: 'Próximamente', color: 'neutral', variant: 'subtle' }
    },
    {
      label: 'Resultados',
      icon: 'i-lucide-chart-column',
      disabled: true,
      badge: { label: 'Próximamente', color: 'neutral', variant: 'subtle' }
    }
  ]
])
</script>

<template>
  <div>
    <Header />
    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <div class="space-y-2 pb-2">
                <div class="flex justify-between items-start">
                  <p class="text-xs font-medium uppercase text-muted">
                    Consulta
                  </p>
                  <UBadge
                    v-if="consultation && estadoBadge"
                    :label="estadoBadge.label"
                    :color="estadoBadge.color"
                    variant="soft"
                  />
                </div>
                <ULink
                  :to="publicView"
                  target="_blank"
                  class="font-semibold leading-tight text-sm"
                >
                  {{ consultation?.title || slug }}
                </ULink>
              </div>
              <USeparator class="my-2" />
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
  </div>
</template>
