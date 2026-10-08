<script setup lang="ts">
import type { PageCardProps, ThemeUI } from '@nuxt/ui'
import { CONSULTATION_TYPES } from '#shared/data/consultation-types'

usePageSeo({
  description: 'Ministerio Abierto reúne las instancias participativas del Ministerio de Infraestructura y Servicios Públicos de la provincia de Buenos Aires: audiencias, consultas, diálogos y el observatorio de obras y servicios públicos.',
  url: '/'
})

const baseS3Url = 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/home'
const heroBackgroundImages = [
  { src: `${baseS3Url}/imagen001.jpg`, alt: 'Obras y servicios públicos en la provincia de Buenos Aires' },
  { src: `${baseS3Url}/imagen002.jpg`, alt: 'Infraestructura pública y desarrollo territorial' },
  { src: `${baseS3Url}/imagen003.jpg`, alt: 'Encuentros de participación ciudadana' },
  { src: `${baseS3Url}/imagen004.jpg`, alt: 'Espacios de diálogo con la comunidad' },
  { src: `${baseS3Url}/imagen005.jpg`, alt: 'Gestión pública y obra en territorio' },
  { src: `${baseS3Url}/imagen006.jpg`, alt: 'Relevamientos y trabajo territorial' },
  { src: `${baseS3Url}/imagen007.jpg`, alt: 'Instancias de consulta y escucha' },
  { src: `${baseS3Url}/imagen008.jpg`, alt: 'Proyectos de infraestructura en movimiento' },
  { src: `${baseS3Url}/imagen009.jpg`, alt: 'Agenda pública abierta y participativa' },
  { src: `${baseS3Url}/imagen010.jpg`, alt: 'Desarrollo de la provincia de Buenos Aires' },
  { src: `${baseS3Url}/imagen011.jpg`, alt: 'Obras para mejorar la calidad de vida' },
  { src: `${baseS3Url}/imagen012.jpg`, alt: 'Servicios públicos y gestión en territorio' },
  { src: `${baseS3Url}/imagen013.jpg`, alt: 'Vinculación institucional con la ciudadanía' },
  { src: `${baseS3Url}/imagen014.jpg`, alt: 'Trabajo conjunto con las comunidades' },
  { src: `${baseS3Url}/imagen015.jpg`, alt: 'Infraestructura para un futuro compartido' }
]

const preloadedHeroImages = new Set<string>()

const preloadHeroImage = (src: string) => {
  if (preloadedHeroImages.has(src)) {
    return
  }

  preloadedHeroImages.add(src)

  const image = new Image()
  image.src = src
}

onMounted(() => {
  heroBackgroundImages.forEach((item) => {
    preloadHeroImage(item.src)
  })
})

const sectionsAsPageCards: Array<PageCardProps> = CONSULTATION_TYPES.map(type => ({
  slug: type.slug,
  to: type.enabled && type.landingRoute ? type.landingRoute : undefined,
  icon: type.icon,
  title: type.label,
  description: type.tagline,
  class: type.enabled && type.landingRoute ? undefined : 'opacity-60 cursor-not-allowed pointer-events-none'
}))

const themeUi: ThemeUI = {
  pageSection: {
    container: 'gap-8 sm:gap-8 py-10 sm:py-12 lg:py-16'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <section class="relative isolate overflow-hidden">
      <div class="absolute inset-0 -z-10">
        <UCarousel
          v-slot="{ item, index }"
          loop
          fade
          :autoplay="{ delay: 6500 }"
          :items="heroBackgroundImages"
          class="h-full"
          :ui="{
            root: 'h-full',
            viewport: 'h-full',
            container: 'h-full',
            item: 'h-full basis-full'
          }"
        >
          <img
            :src="item.src"
            :alt="item.alt"
            class="h-full w-full object-cover"
            width="1920"
            height="1080"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            decoding="async"
          >
        </UCarousel>

        <div class="absolute inset-0 bg-linear-to-b from-slate-950/75 via-slate-950/55 to-background/95" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(15,23,42,0.56))]" />
      </div>

      <UPageHero
        title="MINISTERIO ABIERTO"
        description="Un espacio con propuestas de participación ciudadana sobre obras y servicios públicos en la Provincia de Buenos Aires."
        class="relative z-10"
        :ui="{
          root: 'bg-linear-to-b from-pba-primary-300/25 to-white/15 dark:from-pba-alt-900/50 dark:to-black/10',
          description: 'text-neutral-100 dark:text-neutral-100 text-shadow-lg',
          title: 'text-pba-300 text-shadow-lg'
        }"
      />
    </section>
    <USeparator />
    <UPageSection
      id="origen"
      headline=""
      title="Construimos futuro"
    >
      <template #description>
        <p class="text-center max-w-4xl mx-auto">
          <span class="font-bold text-highlighted">MINISTERIO ABIERTO</span> es una iniciativa del
          <br class="hidden md:block">
          <span class="font-bold md:whitespace-nowrap text-highlighted">Ministerio de Infraestructura y Servicios Públicos</span>, en el marco de su Plan de Fortalecimiento Institucional, para promover la gestión abierta, transparente, cercana y participativa entre el Estado provincial, los municipios, las instituciones y la comunidad.
        </p>
      </template>
      <div class="space-y-6 text-center max-w-4xl mx-auto">
        <p class="text-secondary text-lg md:text-2xl font-semibold mt-10">
          Informarnos. Dialogar. Proponer. La infraestructura que transforma la Provincia se logra entre todos y todas.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-3 mx-auto max-w-full mt-10">
        <UPageCard
          v-for="(feature, index) in sectionsAsPageCards"
          :key="index"
          :highlight="feature.to ? true : false"
          spotlight
          spotlight-color="primary"
          variant="subtle"
          class="w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(18%-0.5rem)] xl:w-[calc(18%-0.5rem)]"
          :class="feature.class ?? undefined"
          :to="feature.to"
          :target="feature.target"
          :ui="{
            root: 'hover:scale-103 transition-transform duration-300',
            container: 'p-3 sm:p-3'
          }"
        >
          <div class="flex-1 flex flex-col justify-evenly lg:min-h-80 items-center text-center">
            <UIcon
              :name="feature.icon"
              class="size-22 lg:size-30 xl:size-38 text-primary my-2"
            />
            <UIcon
              v-show="feature.to"
              name="lucide:arrow-up-right"
              class="size-4 text-primary absolute top-3 right-3"
            />
            <UBadge
              v-if="!feature.to"
              color="primary"
              variant="subtle"
              label="Próximamente"
              class="sm:absolute sm:top-3 sm:right-3"
              size="sm"
            />
            <h3 class="text-md md:text-lg xl:text-xl text-primary font-bold leading-tight">
              {{ feature.title }}
            </h3>
            <p class="hidden sm:block text-sm">
              {{ feature.description }}
            </p>
          </div>
        </UPageCard>
      </div>
    </UPageSection>
    <UPageSection>
      <a
        href="https://mapainversionespba.minfra.gba.gob.ar/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="MapaInversiones PBA: Obras Públicas en la Provincia de Buenos Aires (se abre en una pestaña nueva)"
        class="group relative block overflow-hidden rounded-lg text-white shadow-lg transition-shadow duration-300 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <div
          class="absolute inset-0 banner-mapainversionespba-cover transition-transform duration-700 ease-out group-hover:scale-105"
          aria-hidden="true"
        />
        <div
          class="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10"
          aria-hidden="true"
        />
        <UIcon
          name="lucide:arrow-up-right"
          class="absolute top-4 right-4 hidden size-6 opacity-80 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block"
          aria-hidden="true"
        />
        <div class="relative flex flex-col gap-8 p-6 sm:p-10 lg:p-14">
          <img
            src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/mapainversionespba-white.svg"
            alt="MapaInversiones PBA - Ministerio de Infraestructura y Servicios Públicos - Gobierno de la Provincia de Buenos Aires"
            width="837"
            height="143"
            loading="lazy"
            class="h-auto w-full max-w-md lg:max-w-2xl"
          >
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              <h2 class="text-2xl md:text-3xl font-bold leading-tight">
                Obras Públicas en la Provincia de Buenos Aires
              </h2>
              <p class="mt-2 text-base md:text-lg text-white/90">
                Te brindamos información para que puedas conocer y controlar la ejecución de la Obra Pública.
              </p>
            </div>
            <span class="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 font-semibold text-primary transition-colors duration-300 group-hover:bg-white/90 lg:self-auto">
              Explorá el mapa
              <UIcon
                name="lucide:external-link"
                class="size-4"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </a>
    </UPageSection>
  </UTheme>
</template>
