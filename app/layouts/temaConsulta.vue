<script setup lang="ts">
import type { NavigationMenuItem, PageHeroProps, ThemeUI } from '@nuxt/ui'

withDefaults(
  defineProps<{
    hero?: PageHeroProps
    topicSections?: NavigationMenuItem[]
    // breadcrumb?: BreadcrumbItem[]
  }>(),
  {
    hero: () => ({
      title: 'Tema de participación',
      description: 'Detalle del tema de participación de la consulta ciudadana.'
    }),
    topicSections: () => []
    // breadcrumb: () => []
  }
)

const uiTheme: ThemeUI = {
  pageHero: {
    root: 'bg-linear-to-b from-primary-400/50 to-white dark:from-neutral-400/10 dark:to-black/10',
    container: 'flex flex-col lg:grid py-24 sm:py-32 lg:py-16 gap-16 sm:gap-y-24',
    headline: 'justify-center',
    wrapper: 'text-center',
    description: 'text-balance',
    links: 'justify-center'
  }
}

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
      <UPageHero v-bind="hero">
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
