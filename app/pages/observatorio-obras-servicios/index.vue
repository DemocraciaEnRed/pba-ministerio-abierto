<script setup lang="ts">
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

interface WorkGroup {
  id: number
  slug: string
  name: string
  description: string | null
  color: string
  iconColor: string
  icon: string
}

usePageSeo({
  title: 'Observatorio de Obras y Servicios Públicos',
  description: 'Espacio institucional de participación y control ciudadano donde universidades, sindicatos, cámaras empresariales, colegios profesionales y organizaciones de la sociedad civil trabajan junto al Ministerio para analizar, evaluar y mejorar las políticas de infraestructura y servicios públicos de la Provincia.',
  url: '/observatorio-obras-servicios'
})

const { data: workGroups } = await useAsyncData('observatory-work-groups', () =>
  $fetch<WorkGroup[]>('/api/observatory-work-groups')
)

const themeUi: ThemeUI = {
  pageHero: {
    root: 'header-background-observatorio-obras-servicios bg-primary',
    // Default container: flex flex-col lg:grid py-24 sm:py-32 lg:py-40 gap-16 sm:gap-y-24
    container: 'flex flex-col lg:flex lg:flex-row py-12 sm:py-16 md:py-16 lg:py-16 gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center',
    // Default title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
    title: 'text-white text-shadow-lg text-4xl sm:text-5xl font-extrabold ',
    // Default description: 'text-lg sm:text-xl/8 text-muted',
    description: 'text-white text-shadow-lg',
    wrapper: 'max-w-2xl text-center lg:text-left lg:ml-0 lg:mr-full'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      :ui="themeUi.pageHero"
    >
      <img
        src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/observatorio-obras-servicios/logo-white.svg"
        alt="Observatorio de Obras y Servicios Públicos Logo"
        class="mx-auto lg:mx-0 lg:max-w-2xl max-w-xl"
      >
    </UPageHero>
    <ObservatorioSubNav />
    <USeparator />
    <UPageSection>
      <div class="max-w-3xl mx-auto space-y-6">
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          El <span class="font-bold">Observatorio de Obras y Servicios Públicos</span> es un espacio institucional de participación y control ciudadano donde <span class="font-bold">universidades, sindicatos, cámaras empresariales, colegios profesionales y organizaciones de la sociedad civil</span> trabajan junto al Ministerio para analizar, evaluar y mejorar las políticas de infraestructura y servicios públicos de la Provincia.
        </p>
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          A través de un proceso permanente de diálogo y colaboración, las instituciones participantes aportan su conocimiento, experiencia y mirada crítica para fortalecer las capacidades estatales y mejorar las políticas públicas, con la convicción de que las transformaciones construidas con la sociedad son más legítimas, más pertinentes y más sostenibles en el tiempo.
        </p>
      </div>
    </UPageSection>
    <USeparator />
    <UPageSection
      title="Grupos de trabajo"
    >
      <template #description>
        <div class="flex flex-col items-center gap-4">
          <div
            v-if="workGroups?.length"
            class="flex flex-wrap justify-center gap-2"
            aria-label="Grupos de trabajo del Observatorio"
          >
            <UTooltip
              v-for="group in workGroups"
              :key="group.id"
              :text="group.name"
            >
              <span
                class="flex size-16 items-center justify-center rounded-2xl shadow-sm"
                :style="{ backgroundColor: group.color }"
                :aria-label="group.name"
              >
                <UIcon
                  :name="group.icon"
                  class="size-10"
                  :style="{ color: group.iconColor || '#ffffff' }"
                />
              </span>
            </UTooltip>
          </div>
          <p>
            El Observatorio se organiza en grupos de trabajo que abordan los distintos ejes de la obra pública provincial.
          </p>
        </div>
      </template>
      <UPageGrid>
        <div
          v-for="group in workGroups || []"
          :key="group.id"
          class="flex gap-5 overflow-hidden rounded-lg border p-4 shadow-sm"
          :style="{
            borderColor: `color-mix(in srgb, ${group.color} 85%, transparent)`,
            background: `linear-gradient(120deg, color-mix(in srgb, ${group.color} 12%, transparent), transparent 72%)`
          }"
        >
          <div
            class="size-23 flex shrink-0 items-center justify-center rounded-lg p-3"
          >
            <UIcon
              :name="group.icon"
              class="size-23 text-white"
              :style="{ backgroundColor: group.color }"
            />
          </div>
          <div class="w-full flex flex-col gap-2">
            <h3 class="text-lg font-bold leading-tight">
              {{ group.name }}
            </h3>
            <p class="text-sm opacity-90">
              {{ group.description }}
            </p>
          </div>
        </div>
      </UPageGrid>
    </UPageSection>
    <USeparator />
    <UPageSection
      title="Instituciones que integran el Observatorio"
      description="Universidades, colegios profesionales, cámaras empresariales, sindicatos y organizaciones de la sociedad civil que participan del espacio."
    >
      <ObservatorioInstitutionsShowcase />
    </UPageSection>
    <USeparator />
    <UPageSection
      title="Reuniones"
      description="Reuniones, encuentros y consultas realizadas en el marco del Observatorio."
    >
      <ObservatorioConsultasCardLists />
    </UPageSection>
    <div class="bg-accented/25 dark:bg-accented/10 py-12 sm:py-16 drop-shadow-md">
      <UContainer>
        <LazyObservatorioNumbersAlcance />
      </UContainer>
    </div>
    <USeparator />
    <UContainer>
      <UPageSection
        title="Publicaciones"
        description="Documentos, estudios e informes producidos en el marco del Observatorio, disponibles para su descarga."
      >
        <ObservatorioPublicationsShowcase />
      </UPageSection>
      <USeparator />
      <UPageSection
        title="Registro audiovisual"
        description="Registros de las reuniones, encuentros y presentaciones del Observatorio."
      >
        <ObservatorioVideosCarousel />
      </UPageSection>
    </UContainer>
  </UTheme>
</template>
