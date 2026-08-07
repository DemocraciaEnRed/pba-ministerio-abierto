<script setup lang="ts">
import type { PageHeroProps, NavigationMenuItem, PageAnchor } from '@nuxt/ui'
import type { ConsultaHeroMetadata, ConsultationDetail, ConsultationTopic, GalleryImage } from '~/types/consulta'
import type { PublicConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'

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
  registrationForm: PublicConsultationRegistrationFormDTO | null
}

type InteractivePageAnchor = Omit<PageAnchor, 'onClick'> & {
  onClick?: (event: MouseEvent) => void
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
const parsedBody = computed(() => parseMarkdown(consultation.value?.body))

usePageSeo(() => ({
  title: consultation.value?.title,
  description: toPlainText(consultation.value?.summary || consultation.value?.body),
  url: `/consultas/${route.params.slugConsulta}`,
  type: 'article'
}))
const enlaces = computed<ConsultationRelatedLink[]>(() => detail.value?.links ?? [])
const archivos = computed<ConsultationAttachment[]>(() => detail.value?.attachments ?? [])
const galeria = computed<GalleryImage[]>(() => detail.value?.gallery ?? [])
const registrationForm = computed(() => detail.value?.registrationForm ?? null)

const estadoBadge = computed(() =>
  consultation.value
    ? consultationStateBadge(consultation.value.visibility, consultation.value.participationState)
    : null
)

const hero = computed<PageHeroProps>(() => ({
  title: consultation.value?.title || 'Consulta',
  headline: consultation.value?.section?.name ?? undefined,
  description: consultation.value?.summary || 'Detalle de la consulta ciudadana.'
}))

const cover = computed(() => ({
  url: consultation.value?.coverUrl ?? null,
  altText: consultation.value?.coverAltText ?? null
}))

const consultationMetadata = computed<ConsultaHeroMetadata[]>(() => {
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

  if (consultation.value.region) {
    items.push({
      title: 'Región',
      description: consultation.value.region.name,
      icon: 'lucide:map-pin',
      variant: 'subtle'
    })
  }

  if (consultation.value.categories.length) {
    items.push({
      title: 'Ejes de gestión',
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

const commentsVisible = computed(() => consultation.value?.commentsEnabled !== false)

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
    ...(commentsVisible.value
      ? [{
          label: 'Comentarios',
          icon: 'i-lucide-message-square',
          to: '#comentarios'
        }]
      : [])
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
  commentsVisible.value
  && consultation.value?.visibility === 'visible'
  && consultation.value?.participationState === 'open'
)

const { scrollTo } = useScrollTo()

function createScrollAnchor(label: string, icon: PageAnchor['icon'], id: string): InteractivePageAnchor {
  return {
    label,
    icon,
    href: `#${id}`,
    onClick: (event: MouseEvent) => {
      event.preventDefault()
      scrollTo(id)
    }
  }
}

const consultationPageAnchors: ComputedRef<InteractivePageAnchor[]> = computed(() => {
  const anchors: InteractivePageAnchor[] = [createScrollAnchor('Volver arriba', 'lucide:arrow-up', 'page-hero')]

  if (consultation.value?.closedMessage) {
    anchors.push(createScrollAnchor('Mensaje de cierre', 'lucide:message-square', 'mensaje-cierre'))
  }
  if (archivos.value.length) {
    anchors.push(createScrollAnchor('Archivos', 'lucide:paperclip', 'archivos'))
  }
  if (enlaces.value.length) {
    anchors.push(createScrollAnchor('Enlaces relevantes', 'lucide:link', 'enlaces'))
  }
  if (galeria.value.length) {
    anchors.push(createScrollAnchor('Galería', 'lucide:images', 'galeria'))
  }
  if (temas.value.length) {
    anchors.push(createScrollAnchor('Temas de participación', 'lucide:list', 'temas'))
  }
  if (commentsVisible.value) {
    anchors.push(createScrollAnchor('Comentarios', 'lucide:message-square', 'comentarios'))
  }

  if (consultation.value?.canManage) {
    anchors.push({
      label: 'Administrar',
      icon: 'lucide:settings',
      to: `/consultas/${route.params.slugConsulta}/panel`,
      target: '_blank'
    })
  }
  return anchors
})
</script>

<template>
  <NuxtLayout
    name="consultas"
    :hero="hero"
    :cover="cover"
    :consultation-sections="consultationSections"
    :consultation-metadata="consultationMetadata"
  >
    <template
      v-if="registrationForm"
      #hero-actions
    >
      <ConsultasInscripcionCta
        :form="registrationForm"
        :consultation-slug="String(route.params.slugConsulta)"
      />
    </template>

    <UPage>
      <template #left>
        <UPageAside>
          <div
            v-if="consultation && consultationMetadata.length"
            class="space-y-2"
          >
            <UPageCard
              v-for="(item, index) in consultationMetadata"
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
      <template
        #right
      >
        <UPageAside>
          <UContentToc
            title="En esta página"
            :links="parsedBody.toc"
            highlight
            highlight-color="primary"
            highlight-variant="circuit"
            :ui="{
              root: 'px-0 sm:px-0 lg:px-0 md:px-0',
              container: 'pt-0 sm:pt-0 lg:py-0'
            }"
          >
            <template #bottom>
              <UPageAnchors
                title="Navegación rápida"
                :links="consultationPageAnchors"
              />
            </template>
          </UContentToc>
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
            :parsed="parsedBody"
          />
          <UCard
            v-if="consultation.closedMessage"
            id="mensaje-cierre"
            variant="subtle"
            title="Mensaje de cierre"
          >
            <MarkdownProse :content="consultation.closedMessage" />
          </UCard>

          <ConsultasArchivosCard
            id="archivos"
            :attachments="archivos"
          />
          <ConsultasEnlacesCard
            id="enlaces"
            :links="enlaces"
          />
          <ConsultasGaleriaCard
            id="galeria"
            :images="galeria"
          />
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
        dots
        align="start"
        :ui="{ item: 'basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4' }"
      >
        <ConsultasTemaCard :tema="item" />
      </UCarousel>
    </template>
    <template #mobile-navigation>
      <div class="space-y-8">
        <UContentToc
          v-if="parsedBody.toc.length"
          title="En esta página"
          :links="parsedBody.toc"
          default-open
          :ui="{
            root: 'static z-auto mx-0 max-h-none overflow-visible bg-transparent px-0 backdrop-blur-none',
            container: 'border-0 p-0',
            content: 'overflow-visible'
          }"
        />
        <div>
          <p class="mb-2 text-sm font-semibold text-highlighted">
            Navegación rápida
          </p>
          <UPageAnchors :links="consultationPageAnchors" />
        </div>
      </div>
    </template>
    <template
      v-if="commentsVisible"
      #consultas-comentarios
    >
      <MarkdownProse
        v-if="consultation?.commentsGuidance"
        :content="consultation.commentsGuidance"
        class="mb-6"
      />
      <ConsultasComentariosSeccion
        v-if="consultation"
        :consultation-slug="String(route.params.slugConsulta)"
        :commenting-open="commentingOpen"
        :can-manage="consultation.canManage"
        :participation-state="consultation.participationState"
        :opens-at="consultation.startsAt"
      />
    </template>
  </NuxtLayout>
</template>
