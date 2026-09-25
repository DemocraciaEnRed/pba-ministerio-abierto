<script setup lang="ts">
import type { PublicObservatoryInstitutionDTO } from '~~/server/utils/serializers/observatoryInstitution'
import {
  OBSERVATORY_SHOWCASE_ANIMATE_MIN,
  OBSERVATORY_SHOWCASE_ROW_MAX,
  OBSERVATORY_SHOWCASE_SECOND_ROW_MIN
} from '#shared/schemas/observatory'

defineOptions({ name: 'ObservatorioInstitutionsMarquee' })

const UMarquee = resolveComponent('UMarquee')

const { data, status } = useFetch<PublicObservatoryInstitutionDTO[]>('/api/observatory-institutions/showcase', {
  key: 'observatory-institutions-marquee',
  server: false,
  lazy: true,
  default: () => []
})

const failedIds = ref(new Set<number>())

const institutions = computed(() =>
  data.value.filter(institution => institution.logoUrl && !failedIds.value.has(institution.id))
)

const isHidden = computed(() =>
  (status.value === 'success' || status.value === 'error') && institutions.value.length === 0
)

const isAnimated = computed(() => institutions.value.length >= OBSERVATORY_SHOWCASE_ANIMATE_MIN)

const rows = computed(() => {
  const items = institutions.value
  if (items.length < OBSERVATORY_SHOWCASE_SECOND_ROW_MIN) {
    return [items.slice(0, OBSERVATORY_SHOWCASE_ROW_MAX)]
  }
  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
})

// Pausa la animación mientras la sección no está en pantalla.
const root = useTemplateRef<HTMLElement>('root')
const isVisible = ref(true)
let observer: IntersectionObserver | undefined

watch(root, (element) => {
  observer?.disconnect()
  if (!element) return
  observer = new IntersectionObserver(([entry]) => {
    isVisible.value = entry?.isIntersecting ?? true
  })
  observer.observe(element)
}, { flush: 'post', immediate: true })

onBeforeUnmount(() => observer?.disconnect())

function rowBindings(row: PublicObservatoryInstitutionDTO[], index: number) {
  if (!isAnimated.value) {
    return { class: 'flex flex-wrap justify-center gap-4 sm:gap-6 px-4' }
  }

  return {
    repeat: 2,
    pauseOnHover: true,
    reverse: index === 1,
    style: { '--duration': `${Math.max(row.length, 6) * 4}s` },
    ui: {
      root: '[--gap:--spacing(4)] sm:[--gap:--spacing(6)]',
      content: isVisible.value ? 'py-1' : 'py-1 ![animation-play-state:paused]'
    }
  }
}
</script>

<template>
  <div
    v-if="!isHidden"
    ref="root"
    class="w-full space-y-8 py-10 lg:py-14"
  >
    <h3 class="text-2xl sm:text-3xl text-pretty tracking-tight font-bold text-highlighted text-center px-4 sm:px-6 lg:px-8">
      Algunas  de las instituciones que participan del Observatorio
    </h3>

    <ClientOnly>
      <template #fallback>
        <div class="flex justify-center gap-4 sm:gap-6 overflow-hidden px-4">
          <USkeleton
            v-for="i in 6"
            :key="i"
            class="h-14 w-28 sm:h-20 sm:w-40 shrink-0 rounded-lg"
          />
        </div>
      </template>

      <div
        v-if="status !== 'success'"
        class="flex justify-center gap-4 sm:gap-6 overflow-hidden px-4"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-14 w-28 sm:h-20 sm:w-40 shrink-0 rounded-lg"
        />
      </div>

      <div
        v-else
        class="space-y-4 sm:space-y-6"
      >
        <component
          :is="isAnimated ? UMarquee : 'div'"
          v-for="(row, index) in rows"
          :key="index"
          v-bind="rowBindings(row, index)"
        >
          <UTooltip
            v-for="institution in row"
            :key="institution.id"
            :text="institution.name"
          >
            <ULink
              v-if="institution.websiteUrl"
              :to="institution.websiteUrl"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Abrir sitio de ${institution.name}`"
              class="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 transition hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-20 sm:w-40 sm:p-3 dark:border-white/15"
            >
              <img
                :src="institution.logoUrl!"
                :alt="institution.name"
                width="160"
                height="80"
                loading="lazy"
                decoding="async"
                draggable="false"
                class="max-h-full max-w-full object-contain"
                @error="failedIds.add(institution.id)"
              >
            </ULink>
            <div
              v-else
              class="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 sm:h-20 sm:w-40 sm:p-3 dark:border-white/15"
            >
              <img
                :src="institution.logoUrl!"
                :alt="institution.name"
                width="160"
                height="80"
                loading="lazy"
                decoding="async"
                draggable="false"
                class="max-h-full max-w-full object-contain"
                @error="failedIds.add(institution.id)"
              >
            </div>
          </UTooltip>
        </component>
      </div>
    </ClientOnly>

    <div class="flex justify-center px-4">
      <UButton
        to="#instituciones"
        variant="link"
        icon="lucide:arrow-down"
        trailing-icon="lucide:arrow-down"
        label="Conocé todas las instituciones que participan"
      />
    </div>
  </div>
</template>
