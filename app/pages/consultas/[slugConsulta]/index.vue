<script setup lang="ts">
import type { PageHeroProps, NavigationMenuItem } from '@nuxt/ui'
import type { ConsultaHeroMetadata, ConsultationDetail, ConsultationTopic, GalleryImage } from '~/types/consulta'

definePageMeta({
  layout: false
})

const route = useRoute()

interface ConsultationRelatedLink {
  id: number
  label: string
  url: string
  displayOrder: number
}

interface ConsultationAttachment {
  id: number
  displayOrder: number
  title: string | null
  filename: string | null
  mediaType: 'image' | 'document' | 'video' | 'audio' | 'other'
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
}

interface ConsultationDetailResponse {
  consultation: ConsultationDetail
  topics: ConsultationTopic[]
  links: ConsultationRelatedLink[]
  attachments: ConsultationAttachment[]
  gallery: GalleryImage[]
}

// Endpoint de vista (BFF): compone consulta + temas + enlaces en una sola
// llamada, en lugar de tres pedidos independientes.
// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin y `canManage` del usuario logueado.
const requestFetch = useRequestFetch()
const { data: detail, status, error } = await useAsyncData(
  `public-consultation-detail-${route.params.slugConsulta}`,
  () => requestFetch<ConsultationDetailResponse>(`/api/consultations/${route.params.slugConsulta}/detail`)
)

const consultation = computed(() => detail.value?.consultation ?? null)
const temas = computed<ConsultationTopic[]>(() => detail.value?.topics ?? [])

usePageSeo(() => ({
  title: consultation.value?.title,
  description: toPlainText(consultation.value?.summary || consultation.value?.body),
  url: `/consultas/${route.params.slugConsulta}`,
  type: 'article'
}))
const enlaces = computed<ConsultationRelatedLink[]>(() => detail.value?.links ?? [])
const archivos = computed<ConsultationAttachment[]>(() => detail.value?.attachments ?? [])
const galeria = computed<GalleryImage[]>(() => detail.value?.gallery ?? [])

const estadoBadge = computed(() =>
  consultation.value
    ? consultationStateBadge(consultation.value.visibility, consultation.value.participationState)
    : null
)

const hero = computed<PageHeroProps>(() => ({
  title: consultation.value?.title || 'Consulta',
  headline: 'Consulta ciudadana',
  description: consultation.value?.summary || 'Detalle de la consulta ciudadana.'
}))

const cover = computed(() => ({
  url: consultation.value?.coverUrl ?? null,
  altText: consultation.value?.coverAltText ?? null
}))

const metadata = computed<ConsultaHeroMetadata[]>(() => {
  if (!consultation.value) return []
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
      description: formatDate(consultation.value.startsAt),
      icon: 'lucide:calendar-plus',
      variant: 'subtle'
    },
    {
      title: 'Cierre de participación',
      description: formatDate(consultation.value.endsAt),
      icon: 'lucide:calendar-x',
      variant: 'subtle'
    }
  ]

  if (consultation.value.section) {
    items.push({
      title: 'Sección',
      description: consultation.value.section.name,
      icon: 'lucide:folder',
      variant: 'subtle'
    })
  }

  if (consultation.value.categories.length) {
    items.push({
      title: 'Categorías',
      description: consultation.value.categories.map(category => category.name).join(', '),
      icon: 'lucide:tags',
      variant: 'subtle'
    })
  }

  if (consultation.value.tags.length) {
    items.push({
      title: 'Etiquetas',
      description: consultation.value.tags.map(tag => tag.name).join(', '),
      icon: 'lucide:tag',
      variant: 'subtle'
    })
  }

  return items
})

const consultationSections = computed<NavigationMenuItem[][]>(() => {
  const leftMenu: NavigationMenuItem[] = [
    {
      label: 'Acerca de',
      icon: 'i-lucide-info',
      to: '#page-hero-top'
    },
    ...(temas.value.length
      ? [{
          label: 'Temas de participación',
          icon: 'i-lucide-list',
          to: '#temas'
        }]
      : []),
    {
      label: 'Comentarios',
      icon: 'i-lucide-message-square',
      to: '#comentarios'
    }
  ]
  const rightMenu: NavigationMenuItem[] = []
  if (consultation.value?.canManage) {
    rightMenu.push({
      label: 'Administrar',
      icon: 'i-lucide-settings',
      to: `/consultas/${route.params.slugConsulta}/panel`
    })
  }
  return [leftMenu, rightMenu]
})

// Los comentarios pueden crearse solo con la consulta visible y su participación abierta.
const commentingOpen = computed(() =>
  consultation.value?.visibility === 'visible'
  && consultation.value?.participationState === 'open'
)
</script>

<template>
  <NuxtLayout
    name="consultas"
    :hero="hero"
    :cover="cover"
    :consultation-sections="consultationSections"
  >
    <UPage>
      <template #left>
        <UPageAside
          :ui="{
            root: 'lg:top-(--consultas-sticky-top,var(--ui-header-height)) lg:max-h-[calc(100vh-var(--consultas-sticky-top,var(--ui-header-height)))]'
          }"
        >
          <div
            v-if="consultation && metadata.length"
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
          v-else-if="error || !consultation"
          class="space-y-2"
        >
          <p class="font-medium">
            No encontramos la consulta.
          </p>
          <UButton
            to="/consultas"
            label="Volver al listado"
            color="neutral"
            variant="ghost"
          />
        </UPageCard>

        <div
          v-else
          class="space-y-4"
        >
          <MarkdownProse
            v-if="consultation.body"
            :content="consultation.body"
          />
          <UCard
            v-if="consultation.closedMessage"
            variant="subtle"
            title="Mensaje de cierre"
          >
            <MarkdownProse :content="consultation.closedMessage" />
          </UCard>

          <ConsultasArchivosCard :attachments="archivos" />
          <ConsultasEnlacesCard :links="enlaces" />
          <ConsultasGaleriaCard :images="galeria" />
        </div>
      </UPageBody>
    </UPage>
    <template
      v-if="temas.length"
      #consultas-temas-carrousel
    >
      <UCarousel
        v-slot="{ item }"
        :items="temas"
        arrows
        dots
        align="start"
        :ui="{ item: 'basis-full md:basis-1/2 lg:basis-1/3' }"
      >
        <ConsultasTemaCard :tema="item" />
      </UCarousel>
    </template>
    <template #consultas-comentarios>
      <ConsultasComentariosSeccion
        v-if="consultation"
        :consultation-slug="String(route.params.slugConsulta)"
        :commenting-open="commentingOpen"
        :can-manage="consultation.canManage"
      />
    </template>
  </NuxtLayout>
</template>
