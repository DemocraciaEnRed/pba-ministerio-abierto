<script setup lang="ts">
import type { PageHeroProps, NavigationMenuItem, ThemeUI } from '@nuxt/ui'

withDefaults(
  defineProps<{
    hero?: PageHeroProps
    consultationSections?: NavigationMenuItem[]
  }>(),
  {
    hero: () => ({
      title: 'Consultas ciudadanas',
      description: 'Participa en las consultas ciudadanas abiertas y conoce los resultados de las consultas pasadas.'
    }),
    consultationSections: () => []
  }
)

const uiTheme: ThemeUI = {
  pageHero: {
    root: 'bg-linear-to-b from-primary-500/50 to-white dark:from-neutral-500/10 dark:to-black/10',
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
      <UPageHero
        v-bind="hero"
        id="page-hero-top"
      />
      <USeparator />
      <div
        v-if="consultationSections.length"
        ref="navRef"
        class="sticky top-(--ui-header-height) z-10 border-b border-default bg-default/75 backdrop-blur"
      >
        <UContainer>
          <UNavigationMenu
            :items="consultationSections"
          />
        </UContainer>
      </div>
      <UContainer id="panel-estadisticas">
        <slot />
      </UContainer>
      <div
        v-if="$slots['consultas-temas-carrousel']"
        id="temas"
      >
        <USeparator icon="i-lucide-list" />
        <UContainer
          class="py-16"
          :ui="{ }"
        >
          <h1 class="text-4xl font-extrabold mb-4 text-primary">
            Temas de participación
          </h1>
          <slot name="consultas-temas-carrousel" />
        </UContainer>
      </div>
      <div
        v-if="$slots['consultas-comentarios']"
        id="comentarios"
      >
        <USeparator icon="i-lucide-message-square" />
        <UContainer
          class="py-16"
          :ui="{ base: 'max-w-4xl' }"
        >
          <h1 class="text-4xl font-extrabold mb-4 text-primary">
            Comentarios
          </h1>
          <slot name="consultas-comentarios" />
        </UContainer>
      </div>
    </UMain>

    <Footer />
  </UTheme>
</template>
