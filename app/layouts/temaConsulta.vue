<script setup lang="ts">
import type { NavigationMenuItem, PageHeroProps, ThemeUI } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    hero?: PageHeroProps
    topicSections?: NavigationMenuItem[]
    cover?: { url: string | null, altText?: string | null }
    // breadcrumb?: BreadcrumbItem[]
  }>(),
  {
    hero: () => ({
      title: 'Tema de participación',
      description: 'Detalle del tema de participación de la consulta ciudadana.'
    }),
    topicSections: () => [],
    cover: () => ({ url: null })
    // breadcrumb: () => []
  }
)

// Cuando hay portada, el hero la usa de fondo (con un velo oscuro para
// legibilidad) y el texto pasa a claro; si no, se mantiene el gradiente.
const hasCover = computed(() => Boolean(props.cover?.url))

const uiTheme = computed<ThemeUI>(() => ({
  pageHero: {
    root: hasCover.value
      ? 'relative isolate overflow-hidden bg-transparent'
      : 'bg-linear-to-b from-primary-400/50 to-white dark:from-neutral-400/10 dark:to-black/10',
    container: 'relative z-10 flex flex-col lg:grid py-24 sm:py-32 lg:py-16 gap-16 sm:gap-y-24',
    headline: hasCover.value ? 'justify-center text-white/90' : 'justify-center',
    wrapper: 'text-center',
    title: hasCover.value ? 'text-white' : undefined,
    description: hasCover.value ? 'text-white/85 text-balance' : 'text-balance',
    links: 'justify-center'
  }
}))

// Mide la altura real de la barra de navegación de contenido para exponerla
// como variable CSS. Así el `UPageAside` (y cualquier otro elemento sticky)
// puede pegarse por debajo del Header + la barra, no solo del Header.
const navRef = useTemplateRef<HTMLElement>('navRef')
const navHeight = ref(0)
let navObserver: ResizeObserver | undefined

watch(navRef, (el) => {
  navObserver?.disconnect()
  if (!el) {
    navHeight.value = 0
    return
  }
  navObserver = new ResizeObserver(() => {
    navHeight.value = el.offsetHeight
  })
  navObserver.observe(el)
}, { immediate: true })

onBeforeUnmount(() => navObserver?.disconnect())

// Offset sticky total: si hay barra de navegación, Header + barra; si no, solo Header.
const stickyTop = computed(() =>
  navHeight.value
    ? `calc(var(--ui-header-height) + ${navHeight.value}px)`
    : 'var(--ui-header-height)'
)
</script>

<template>
  <UTheme :ui="uiTheme">
    <UMain :style="{ '--consultas-sticky-top': stickyTop }">
      <Header />
      <div class="relative">
        <div
          v-if="hasCover"
          class="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            :src="cover.url!"
            :alt="cover.altText || ''"
            class="h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-linear-to-b from-black/55 via-black/45 to-black/70" />
        </div>
        <UPageHero
          v-bind="hero"
          class="relative"
        >
          <!-- <template
            v-if="breadcrumb.length"
            #top
          >
            <UBreadcrumb
              :items="breadcrumb"
              class="justify-center"
            />
          </template> -->
        </UPageHero>
      </div>
      <USeparator />
      <div
        v-if="topicSections.length"
        ref="navRef"
        class="sticky top-(--ui-header-height) z-10 border-b border-default bg-default/75 backdrop-blur"
      >
        <UContainer>
          <UNavigationMenu
            :items="topicSections"
          />
        </UContainer>
      </div>
      <UContainer>
        <slot />
      </UContainer>
      <div
        v-if="$slots['tema-otros-carrousel']"
        id="temas"
      >
        <USeparator icon="i-lucide-list" />
        <UContainer class="py-16">
          <h1 class="text-4xl font-extrabold mb-4 text-primary">
            Otros temas de la consulta
          </h1>
          <slot name="tema-otros-carrousel" />
        </UContainer>
      </div>
      <div
        v-if="$slots['tema-comentarios']"
        id="comentarios"
      >
        <USeparator icon="i-lucide-message-square" />
        <UContainer
          class="py-16"
          :ui="{ base: 'max-w-4xl' }"
        >
          <h1 class="text-4xl font-extrabold mb-4 text-primary text-center">
            Comentarios
          </h1>
          <slot name="tema-comentarios" />
        </UContainer>
      </div>
    </UMain>

    <Footer />
  </UTheme>
</template>
