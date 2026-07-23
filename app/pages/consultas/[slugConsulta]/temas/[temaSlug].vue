<script setup lang="ts">
import type { BreadcrumbItem, NavigationMenuItem, PageHeroProps } from '@nuxt/ui'
import type {
  ConsultaHeroMetadata,
  ConsultationTopic,
  GalleryImage,
  MechanismType,
  TopicAttachment,
  TopicDetailResponse,
  TopicLink
} from '~/types/consulta'

definePageMeta({
  layout: false
})

const route = useRoute()

const consultationSlug = computed(() => String(route.params.slugConsulta))
const topicSlug = computed(() => String(route.params.temaSlug))

// Endpoint de vista (BFF): compone tema + enlaces + adjuntos + consulta padre +
// temas hermanos en una sola llamada, en lugar de pedidos independientes.
// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin y `canManage` del usuario logueado.
const requestFetch = useRequestFetch()
const { data: detail, status, error } = await useAsyncData(
  `public-topic-detail-${consultationSlug.value}-${topicSlug.value}`,
  () => requestFetch<TopicDetailResponse>(
    `/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/detail`
  )
)

const tema = computed(() => detail.value?.topic ?? null)
const consultation = computed(() => detail.value?.consultation ?? null)

usePageSeo(() => ({
  title: tema.value?.title,
  description: toPlainText(
    tema.value?.summary || tema.value?.questionText || tema.value?.body
  ),
  image: tema.value?.coverUrl,
  imageAlt: tema.value?.title,
  url: `/consultas/${consultationSlug.value}/temas/${topicSlug.value}`,
  type: 'article'
}))
const enlaces = computed<TopicLink[]>(() => detail.value?.links ?? [])
const archivos = computed<TopicAttachment[]>(() => detail.value?.attachments ?? [])
const galeria = computed<GalleryImage[]>(() => detail.value?.gallery ?? [])

// Temas hermanos para el carrusel: se excluye el tema actual.
const otrosTemas = computed<ConsultationTopic[]>(() =>
  (detail.value?.topics ?? []).filter(topic => topic.slug !== topicSlug.value)
)

const estadoBadge = computed(() =>
  tema.value
    ? topicStateBadge(tema.value.visibility, tema.value.participationState)
    : null
)

const mechanismLabels: Record<MechanismType, string> = {
  support: 'Apoyo',
  vote: 'Votación',
  survey: 'Encuesta'
}

const mechanismIcons: Record<MechanismType, string> = {
  support: 'lucide:thumbs-up',
  vote: 'lucide:vote',
  survey: 'lucide:list-checks'
}

const hero = computed<PageHeroProps>(() => ({
  title: tema.value?.title || 'Tema',
  headline: consultation.value?.title || 'Consulta ciudadana',
  description: tema.value?.summary || 'Detalle del tema de participación.'
}))

const cover = computed(() => ({
  url: tema.value?.coverUrl ?? null,
  altText: tema.value?.coverAltText ?? null
}))

const breadcrumb = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: 'Consultas', icon: 'i-lucide-folders', to: '/consultas' }
  ]

  if (consultation.value) {
    items.push({
      label: consultation.value.title,
      to: `/consultas/${consultationSlug.value}`
    })
  }

  if (tema.value) {
    items.push({ label: tema.value.title })
  }

  return items
})

const metadata = computed<ConsultaHeroMetadata[]>(() => {
  if (!tema.value) return []

  const items: ConsultaHeroMetadata[] = [
    {
      title: 'Estado',
      description: estadoBadge.value?.label ?? '—',
      icon: estadoBadge.value?.icon ?? 'lucide:activity',
      variant: 'subtle',
      highlight: true,
      highlightColor: estadoBadge.value?.color ?? undefined
    },
    {
      title: 'Inicio de participación',
      description: formatDate(tema.value.participationStartsAt),
      icon: 'lucide:calendar-plus',
      variant: 'subtle'
    },
    {
      title: 'Cierre de participación',
      description: formatDate(tema.value.participationEndsAt),
      icon: 'lucide:calendar-x',
      variant: 'subtle'
    }
  ]

  if (tema.value.mechanismType) {
    items.push({
      title: 'Mecanismo',
      description: mechanismLabels[tema.value.mechanismType],
      icon: mechanismIcons[tema.value.mechanismType],
      variant: 'subtle'
    })
  }

  return items
})

// Navegación entre secciones del tema (scrolls dentro de la misma página).
const topicSections = computed<NavigationMenuItem[]>(() => {
  const sections: NavigationMenuItem[] = [
    { label: 'Sobre el tema', icon: 'i-lucide-layout-dashboard', to: '#top' }
  ]

  if (otrosTemas.value.length) {
    sections.push({ label: 'Otros temas', icon: 'i-lucide-list', to: '#temas' })
  }

  sections.push({ label: 'Comentarios', icon: 'i-lucide-message-square', to: '#comentarios' })

  return sections
})
</script>

<template>
  <NuxtLayout
    name="tema-consulta"
    :hero="hero"
    :cover="cover"
    :topic-sections="topicSections"
    :breadcrumb="breadcrumb"
  >
    <UPage>
      <template #left>
        <UPageAside
          :ui="{
            root: 'lg:top-(--consultas-sticky-top,var(--ui-header-height)) lg:max-h-[calc(100vh-var(--consultas-sticky-top,var(--ui-header-height)))]'
          }"
        >
          <div
            v-if="tema && metadata.length"
            class="space-y-2"
          >
            <UPageCard
              v-for="(item, index) in metadata"
              :key="index"
              v-bind="item"
              variant="subtle"
              :ui="{
                wrapper: 'flex-row',
                leading: 'mr-2 mb-0 mt-0.5',
                container: 'sm:p-2.5',
                title: 'text-sm',
                description: 'text-xs'
              }"
            />
          </div>
        </UPageAside>
      </template>
      <UPageBody id="top">
        <ConsultasLoadingSkeleton v-if="status === 'pending'" />

        <UPageCard
          v-else-if="error || !tema"
          class="space-y-2"
        >
          <p class="font-medium">
            No encontramos el tema.
          </p>
          <UButton
            :to="`/consultas/${consultationSlug}`"
            label="Volver a la consulta"
            color="neutral"
            variant="ghost"
          />
        </UPageCard>

        <div
          v-else
          class="space-y-4"
        >
          <MarkdownProse
            v-if="tema.body"
            :content="tema.body"
          />

          <UCard
            v-if="tema.questionText"
            variant="subtle"
            title="Pregunta"
          >
            <p class="text-sm">
              {{ tema.questionText }}
            </p>
          </UCard>

          <ConsultasArchivosCard :attachments="archivos" />
          <ConsultasEnlacesCard :links="enlaces" />
          <ConsultasGaleriaCard :images="galeria" />
        </div>
      </UPageBody>
    </UPage>
    <template #tema-otros-carrousel>
      <UCarousel
        v-if="otrosTemas.length"
        v-slot="{ item }"
        :items="otrosTemas"
        arrows
        dots
        align="start"
        :ui="{ item: 'basis-full md:basis-1/2 lg:basis-1/3' }"
      >
        <ConsultasTemaCard :tema="item" />
      </UCarousel>
      <p
        v-else
        class="text-sm text-muted"
      >
        No hay otros temas de participación en esta consulta.
      </p>
    </template>
    <template #tema-comentarios>
      <ConsultasComentariosSeccion
        v-if="tema"
        :consultation-slug="consultationSlug"
        :topic-slug="topicSlug"
        :commenting-open="tema.participationOpen"
        :can-manage="tema.canManage"
      />
    </template>
  </NuxtLayout>
</template>
