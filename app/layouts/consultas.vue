<script setup lang="ts">
import type { PageHeroProps, NavigationMenuItem, ThemeUI, DropdownMenuItem } from '@nuxt/ui'
import type { ConsultaHeroMetadata } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    hero?: PageHeroProps
    consultationSections?: NavigationMenuItem[][]
    consultationMetadata?: ConsultaHeroMetadata[]
    cover?: { url: string | null, altText?: string | null }
  }>(),
  {
    hero: () => ({
      title: 'Consultas ciudadanas',
      description: 'Participa en las consultas ciudadanas abiertas y conoce los resultados de las consultas pasadas.'
    }),
    consultationSections: () => [],
    consultationMetadata: () => [],
    cover: () => ({ url: null })
  }
)

// Cuando hay portada, el hero la usa de fondo (con un velo oscuro para
// legibilidad) y el texto pasa a claro; si no, se mantiene el gradiente.
const hasCover = computed(() => Boolean(props.cover?.url))

const uiTheme = computed<ThemeUI>(() => ({
  pageHero: {
    root: hasCover.value
      ? 'relative isolate overflow-hidden bg-transparent'
      : 'bg-linear-to-b from-primary-500/50 to-white dark:from-neutral-500/10 dark:to-black/10',
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

// Aplana los grupos del menú de navegación (izquierda/derecha) en grupos del
// dropdown para móvil, preservando la separación visual entre cada grupo.
const consultationSectionsMobile = computed<DropdownMenuItem[][]>(() =>
  props.consultationSections
    .filter(group => group.length)
    .map(group =>
      group.map(section => ({
        label: section.label,
        icon: section.icon,
        to: section.to
      }))
    )
);
const drawerOpen = ref(false);
const openDrawer = () => {
  drawerOpen.value = true;
};

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
            :src="props.cover?.url!"
            :alt="props.cover?.altText || ''"
            class="h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-linear-to-b from-black/55 via-black/45 to-black/70" />
        </div>
        <UPageHero
          v-bind="hero"
          id="page-hero-top"
          class="relative"
        />
      </div>
      <USeparator />
      <div
        v-if="consultationSections.length"
        ref="navRef"
        class="sticky top-(--ui-header-height) z-10 border-b border-default bg-default/75 backdrop-blur"
      >
        <UContainer class="">
          <UNavigationMenu
            :items="consultationSections"
            class="hidden lg:flex"
          />
          <div class="lg:hidden py-1 flex justify-between items-center gap-2">
            <UButton 
              label="Metadatos"
              icon="i-lucide-info"
              variant="ghost"
              color="neutral"
              @click="openDrawer"
            />
            <UDropdownMenu
              :items="consultationSectionsMobile"
              :content="{ align: 'center' }"
              arrow
              :ui="{ content: 'w-56' }"
            >
              <UButton
                label="Secciones"
                icon="i-lucide-list"
                trailing-icon="i-lucide-chevron-down"
                variant="ghost"
                color="neutral"
              />
            </UDropdownMenu>
          </div>
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
    <UDrawer
      v-model:open="drawerOpen"
      title="Detalles del proceso"
      description="Información del proceso participativo"
      :close="{
        color: 'primary',
        variant: 'outline',
        class: 'rounded-full'
      }"
      :ui="{
        body: 'flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-2 gap-2'
      }"
    >
      <template #body>
        <UPageCard
          v-for="(item, index) in props.consultationMetadata"
          :key="`metadata-mobile-${index}`"
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
      </template>
    </UDrawer>
    <Footer />
  </UTheme>
</template>
