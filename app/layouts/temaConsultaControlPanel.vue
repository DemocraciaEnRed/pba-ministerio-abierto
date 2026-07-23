<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { slug, data: consultation } = useConsultationAdmin()

type MechanismType = 'support' | 'vote' | 'survey'
type Visibility = 'hidden' | 'visible' | 'archived'
type ParticipationState = 'scheduled' | 'open' | 'closed'

interface AdminTopicSummary {
  id: number
  slug: string
  title: string
  visibility: Visibility
  participationState: ParticipationState
  mechanismType: MechanismType | null
  configLockedAt: string | null
}

const slugTema = computed(() => String(route.params.slugTema))

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: topic } = await useAsyncData(
  () => `admin-topic-${slug.value}-${slugTema.value}`,
  () => requestFetch<AdminTopicSummary>(`/api/consultations/${slug.value}/topics/${slugTema.value}`),
  { watch: [slug, slugTema] }
)

const basePath = computed(() => `/consultas/${slug.value}/panel/temas/${slugTema.value}`)
const publicView = computed(() => `/consultas/${slug.value}/temas/${slugTema.value}`)
const estadoBadge = computed(() =>
  topic.value
    ? topicStateBadge(topic.value.visibility, topic.value.participationState)
    : null
)

const mechanismLabels: Record<MechanismType, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

const itemsNavigationMenu = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Volver a temas',
      icon: 'i-lucide-arrow-left',
      to: `/consultas/${slug.value}/panel/temas`
    },
    {
      label: 'Ver tema',
      icon: 'i-lucide-eye',
      to: publicView.value
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
      label: 'Editar',
      icon: 'i-lucide-pencil',
      to: `${basePath.value}/editar`,
      active: route.path.startsWith(`${basePath.value}/editar`)
    },
    {
      label: 'Portada',
      icon: 'i-lucide-image',
      to: `${basePath.value}/portada`,
      active: route.path.startsWith(`${basePath.value}/portada`)
    },
    {
      label: 'Método de participación',
      icon: 'i-lucide-sliders-horizontal',
      to: `${basePath.value}/metodo-participacion`,
      active: route.path.startsWith(`${basePath.value}/metodo-participacion`)
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
      label: 'Resultados',
      icon: 'i-lucide-chart-column',
      to: `${basePath.value}/resultados`,
      active: route.path.startsWith(`${basePath.value}/resultados`)
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
              <div class="mb-4 space-y-2 border-b border-default pb-4">
                <p class="text-xs font-medium uppercase text-muted">
                  Consulta
                </p>
                <p class="font-semibold leading-tight">
                  {{ consultation?.title || slug }}
                </p>

                <p class="pt-1 text-xs font-medium uppercase text-muted">
                  Tema
                </p>
                <p class="font-semibold leading-tight">
                  {{ topic?.title || slugTema }}
                </p>

                <div
                  v-if="topic"
                  class="flex flex-wrap gap-2"
                >
                  <UBadge
                    v-if="estadoBadge"
                    :label="estadoBadge.label"
                    :color="estadoBadge.color"
                    variant="subtle"
                  />
                  <UBadge
                    :label="topic.mechanismType ? mechanismLabels[topic.mechanismType] : 'Sin método'"
                    :color="topic.mechanismType ? 'neutral' : 'error'"
                    variant="outline"
                  />
                  <UBadge
                    v-if="topic.configLockedAt || topic.visibility !== 'hidden'"
                    label="Config. fija"
                    icon="i-lucide-lock"
                    color="neutral"
                    variant="subtle"
                  />
                </div>
              </div>
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
