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

const selectedWorkGroup = ref('all')
const { scrollTo } = useScrollTo()
const colorMode = useColorMode()

// En dark mode se refuerza el gradiente con 10% más de color del grupo
function workGroupCardStyle(color: string) {
  const gradientStrength = colorMode.value === 'dark' ? 32 : 18
  return {
    borderColor: `color-mix(in srgb, ${color} 85%, transparent)`,
    background: `linear-gradient(120deg, color-mix(in srgb, ${color} ${gradientStrength}%, transparent), transparent 72%)`
  }
}

async function selectWorkGroup(groupId: number) {
  selectedWorkGroup.value = String(groupId)
  await nextTick()
  document.getElementById('reuniones')?.focus({ preventScroll: true })
  scrollTo('reuniones', {
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start'
  })
}

function goToReuniones() {
  document.getElementById('reuniones')?.focus({ preventScroll: true })
  scrollTo('reuniones', {
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start'
  })
}

const baseS3Url = 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/fotos-observatorio-obras-servicios'
const fotosDialogos = [
  '/obs-obras-servicios01.jpg',
  '/obs-obras-servicios02.jpg',
  '/obs-obras-servicios03.jpg',
  '/obs-obras-servicios04.jpg',
  '/obs-obras-servicios05.jpg',
  '/obs-obras-servicios06.jpg'
]

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
  },
  pageSection: {
    container: 'lg:py-24'
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
    <UPageSection
      id="presentacion"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      :ui="{ container: 'lg:py-24' }"
    >
      <div class="max-w-5xl mx-auto space-y-6">
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          El <span class="font-bold">Observatorio de Obras y Servicios Públicos</span> es un espacio institucional de participación y control ciudadano donde <span class="font-bold">universidades, sindicatos, cámaras empresariales, colegios profesionales y organizaciones de la sociedad civil</span> trabajan junto al Ministerio para analizar, evaluar y mejorar las políticas de infraestructura y servicios públicos de la Provincia.
        </p>
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          A través de un proceso permanente de diálogo y colaboración, las instituciones participantes aportan su conocimiento, experiencia y mirada crítica para fortalecer las capacidades estatales y mejorar las políticas públicas, con la convicción de que las transformaciones construidas con la sociedad son más legítimas, más pertinentes y más sostenibles en el tiempo.
        </p>
        <p class="leading-7 font-semibold text-primary">
          ¿Sos parte de alguna de las instituciones participantes o querés sumarte al diálogo ciudadano sobre infraestructura y servicios públicos en la Provincia?
        </p>
        <div class="flex flex-col md:flex-row gap-6 justify-center">
          <UPageCard
            title="Presentá aportes y propuestas"
            description="Las instituciones integrantes pueden presentar aportes a los ejes de trabajo."
            highlight
            highlight-color="primary"
            icon="lucide:file-text"
            to="/observatorio-obras-servicios/formulario"
            target="_blank"
            class="w-full"
            spotlight
            spotlight-color="primary"
            variant="subtle"
            :ui="{
              root: 'hover:scale-103 transition-transform duration-300',
              title: 'text-xl'
            }"
          >
            <template #leading>
              <div class="flex items-center justify-center w-full gap-2">
                <UIcon
                  name="lucide:arrow-right"
                  class="size-8 text-primary"
                />
                <UIcon
                  name="lucide:file-text"
                  class="size-8 text-primary"
                />
              </div>
            </template>
          </UPageCard>
          <UPageCard
            title="Participá de las reuniones"
            highlight
            highlight-color="primary"
            description="Podes anotarte y participar en las reuniones del Observatorio"
            spotlight
            spotlight-color="primary"
            variant="subtle"
            class="w-full cursor-pointer"
            :ui="{
              root: 'hover:scale-103 transition-transform duration-300',
              title: 'text-xl'
            }"
            @click="goToReuniones"
          >
            <template #leading>
              <div
                v-if="workGroups && workGroups?.length > 0"
                class="flex items-center justify-center w-full gap-2"
              >
                <UIcon
                  v-for="group in workGroups"
                  :key="`card-workgroup-${group.id}`"
                  :name="group.icon"
                  class="size-8"
                  :style="{ color: group.color }"
                />
              </div>
            </template>
          </UPageCard>
        </div>
      </div>
      <UCarousel
        v-slot="{ item, index }"
        :items="fotosDialogos"
        :autoplay="{ delay: 4000 }"
        loop
        arrows
        dots
        :ui="{ item: 'basis-full sm:basis-1/2 lg:basis-1/3' }"
        class="w-full py-8"
      >
        <img
          :src="`${baseS3Url}${item}`"
          :alt="`Foto diálogo ${index + 1}`"
          class="h-64 w-full rounded-lg object-cover shadow-lg"
        >
      </UCarousel>
    </UPageSection>
    <USeparator />
    <ObservatorioInstitutionsMarquee />
    <USeparator />
    <UPageSection
      id="como-trabajamos"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      :ui="{ container: 'lg:py-24' }"
    >
      <div class="flex flex-col md:flex-row-reverse gap-12 max-w-6xl mx-auto items-center">
        <div class="w-full mx-auto space-y-6">
          <h3 class="text-center sm:text-left text-3xl sm:text-4xl lg:text-5xl leading-tight text-pretty tracking-tight font-bold text-highlighted">
            ¿Cómo trabajamos en el Observatorio?
          </h3>
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            Poniendo en común el <ULink
              to="https://drive.google.com/file/d/1rXpM5bpyaziTMs-crAH8fg9f9fN3ELo8/view?usp=sharing"
              class="font-semibold text-primary underline hover:text-primary-dark"
            >Plan de Fortalecimiento Institucional 2024-2027</ULink> y el <ULink
              to="https://drive.google.com/file/d/1Rjpm0XVlGnGd05ZjOrb5FDbhrMNw6UPn/view?usp=sharing"
              class="font-bold text-primary underline hover:text-primary-dark"
            >Plan Estratégico de Infraestructura 2024-2027</ULink>, la agenda del Observatorio se organiza en siete grupos de trabajo temáticos, donde instituciones y especialistas analizan las iniciativas prioritarias del Ministerio, intercambian experiencias y proponen mejoras concretas. Además, se realizan reuniones plenarias al inicio y al cierre de cada año.
          </p>
        </div>
        <div class="flex w-full sm:w-4/5 lg:w-3/5 mx-auto gap-6 justify-center">
          <div class="flex flex-col gap-6">
            <ULink
              to="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pfi-plan-de-fortalecimiento-institucional-2024-2027.pdf"
              target="_blank"
              external
            >
              <img
                src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pfi-plan-de-fortalecimiento-institucional-2024-2027.png"
                loading="lazy"
                class="h-auto rounded-lg shadow-lg border border-default hover:scale-103 transition-transform duration-300"
                alt="Plan de Fortalecimiento Institucional del MISP 2024-2027"
              >
            </ULink>
            <div class="flex justify-center">
              <UButton
                to="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pfi-plan-de-fortalecimiento-institucional-2024-2027.pdf"
                target="_blank"
                color="secondary"
                icon="lucide:download"
                :ui="{ base: 'hover:scale-103 transition-transform duration-300' }"
              >
                Descargar
              </UButton>
            </div>
          </div>
          <div class="flex flex-col gap-6">
            <ULink
              to="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pei-plan-estrategico-de-infraestructura-2026.pdf"
              target="_blank"
              external
            >
              <img
                src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pei-plan-estrategico-de-infraestructura-2026.png"
                loading="lazy"
                class="h-auto rounded-lg shadow-md border border-default hover:scale-103 transition-transform duration-300"
                alt="Plan Estratégico de Infraestructura de la Provincia de Buenos Aires"
              >
            </ULink>
            <div class="flex justify-center">
              <UButton
                to="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/pdf/misp-pei-plan-estrategico-de-infraestructura-2026.pdf"
                target="_blank"
                color="secondary"
                icon="lucide:download"
                :ui="{ base: 'hover:scale-103 transition-transform duration-300' }"
              >
                Descargar
              </UButton>
            </div>
          </div>
        </div>
      </div>
      <div class="max-w-6xl mx-auto space-y-6 mt-10">
        <h3 class="text-3xl md:text-4xl text-pretty tracking-tight font-bold text-highlighted text-center">
          Grupos de trabajo
        </h3>
        <p class="text-secondary text-lg md:text-xl font-semibold text-center">
          Elegí el grupo de trabajo y conocélas reuniones programadas y realizadas.
        </p>
        <div class="flex flex-col items-center gap-4">
          <div
            v-if="workGroups?.length"
            class="flex flex-wrap justify-center gap-3"
            aria-label="Grupos de trabajo del Observatorio"
          >
            <UTooltip
              v-for="group in workGroups"
              :key="group.id"
              :text="group.name"
            >
              <a
                href="#reuniones"
                class="flex size-16 sm:size-20 items-center justify-center rounded-2xl shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary hover:scale-102 hover:-translate-y-1 transition-transform duration-200"
                :style="{ backgroundColor: group.color }"
                :aria-label="`Ver reuniones de ${group.name}`"
                @click.prevent="selectWorkGroup(group.id)"
              >
                <UIcon
                  :name="group.icon"
                  class="size-10 sm:size-12"
                  :style="{ color: group.iconColor || '#ffffff' }"
                />
              </a>
            </UTooltip>
          </div>
        </div>
      </div>
      <div class="mx-auto flex flex-wrap justify-center gap-4">
        <a
          v-for="group in workGroups || []"
          :key="group.id"
          href="#reuniones"
          :aria-label="`Ver reuniones de ${group.name}`"
          class="flex flex-row sm:flex-col md:flex-row w-full gap-4 overflow-hidden rounded-lg border p-4 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] hover:scale-101 transition-transform duration-150"
          :style="workGroupCardStyle(group.color)"
          @click.prevent="selectWorkGroup(group.id)"
        >
          <div
            class="size-10 sm:size-14 md:size-18 flex shrink-0 items-center justify-center rounded-lg"
          >
            <UIcon
              :name="group.icon"
              class="size-10 sm:size-14 md:size-18 text-white"
              :style="{ backgroundColor: group.color }"
            />
          </div>
          <div class="w-full flex flex-col gap-2">
            <h3 class="text-lg font-bold leading-tight text-highlighted">
              {{ group.name }}
            </h3>
            <p class="text-sm">
              {{ group.description }}
            </p>
          </div>
        </a>
      </div>
    </UPageSection>
    <USeparator />
    <UPageSection
      id="reuniones"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      title="Reuniones"
      description="Reuniones, encuentros y consultas realizadas en el marco del Observatorio."
    >
      <ObservatorioConsultasCardLists v-model:work-group="selectedWorkGroup" />
    </UPageSection>
    <USeparator />
    <div class="bg-accented/25 dark:bg-accented/10 py-12 sm:py-16 drop-shadow-md">
      <UContainer>
        <LazyObservatorioNumbersAlcance />
      </UContainer>
    </div>
    <USeparator />
    <UPageSection
      id="instituciones"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      title="Instituciones que integran el Observatorio"
      description="Universidades, colegios profesionales, cámaras empresariales, sindicatos y organizaciones de la sociedad civil que participan del espacio."
    >
      <ObservatorioInstitutionsShowcase />
    </UPageSection>
    <USeparator />
    <UPageSection
      id="publicaciones"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      title="Publicaciones"
      description="Documentos, estudios e informes producidos en el marco del Observatorio, disponibles para su descarga."
    >
      <ObservatorioPublicationsShowcase />
    </UPageSection>
    <USeparator />
    <UPageSection
      id="registro-audiovisual"
      tabindex="-1"
      class="scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      title="Registro audiovisual"
      description="Registros de las reuniones, encuentros y presentaciones del Observatorio."
    >
      <ObservatorioVideosCarousel />
    </UPageSection>
  </UTheme>
</template>
