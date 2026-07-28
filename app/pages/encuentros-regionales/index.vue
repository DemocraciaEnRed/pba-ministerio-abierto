<script lang="ts" setup>
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

const ejesTematicosDescripciones = ref([
  {
    title: 'Conectividad y logística',
    description: 'Corredores viales para el desarrollo, seguridad vial, rehabilitación y mantenimiento, apoyo logístico a la producción local y caminos rurales'
  },
  {
    title: 'Infraestructura para los sistemas de ciudades',
    description: 'Infraestructura urbana, productiva, para el transporte, ambiental, institucional, comunitaria y cultural.'
  },
  {
    title: 'Gestión integrada de los recursos hídricos',
    description: 'Gestión de cuencas, adaptación productiva a extremos climáticos, riesgo hídrico en ciudades, agua y saneamiento'
  },
  {
    title: 'Infraestructura del cuidado',
    description: 'Red del Cuidado para infancias, personas con discapacidad, personas mayores, mujeres y diversidades, juventudes'
  },
  {
    title: 'Energía accesible y sostenible',
    description: 'Energía eléctrica, gas, energías renovables y eficiencia energética.'
  },
  {
    title: 'Juventudes',
    description: 'Promoción del desarrollo integral a través de la educación y el trabajo.'
  }
])

const themeUi: ThemeUI = {
  pageHero: {
    root: 'header-background-encuentros-regionales bg-primary',
    // Default container: flex flex-col lg:grid py-24 sm:py-32 lg:py-40 gap-16 sm:gap-y-24
    container: 'flex flex-col lg:flex lg:flex-row py-12 sm:py-16 md:py-16 lg:py-16 gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center',
    // Default title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
    title: 'text-white text-shadow-lg text-4xl sm:text-5xl font-extrabold ',
    // Default description: 'text-lg sm:text-xl/8 text-muted',
    description: 'text-white text-shadow-lg',
    wrapper: 'max-w-2xl text-left lg:text-left lg:ml-0 lg:mr-full'
  },
  pageBody: {
    base: 'py-16 mt-0'
  }
}
const comoHacemosPageSectionUi: ThemeUI['pageSection'] = {
  root: 'bg-accented/25 dark:bg-accented/10 py-12 sm:py-12 md:py-12 lg:py-12 flex flex-col gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center',
  // container (default): 'flex flex-col lg:grid py-16 sm:py-24 lg:py-32 gap-8 sm:gap-16',
  // container (for horizontal): 'lg:grid-cols-2 lg:items-center',
  // container: 'flex flex-col lg:flex lg:flex-row-reverse gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center mx-auto py-12 sm:py-16 md:py-16 lg:py-16',
  container: 'flex flex-col sm:flex-col md:flex-row-reverse lg:flex lg:flex-row-reverse items-center md:items-start py-0 sm:py-0 md:py-0 lg:py-0 lg:max-w-8/12',
  body: ' space-y-6 mx-auto lg:mt-0',
  wrapper: 'w-full md:w-7/12 lg:w-8/12'
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      orientation="horizontal"
      reverse
    >
      <template #header>
        <h1 class="text-xl font-medium text-white text-shadow-lg uppercase mb-2">
          Encuentros Regionales
        </h1>
        <div class="flex items-stretch gap-1">
          <p class="font-extrabold text-4xl text-white text-shadow-lg uppercase">
            ¿
          </p>
          <p class="font-extrabold text-4xl text-white text-shadow-lg uppercase">
            Cuánto<br>futuro<br>cabe en la<br>provincia?
          </p>
          <div class="self-stretch border-l-white border-l-4 mx-5" />
          <p class="font-extralight text-2xl text-white text-shadow-lg uppercase">
            DIÁLOGO<br>Y PARTICIPACIÓN<br>PARA DISEÑAR<br>UNA AGENDA<br>DE DESARROLLO
          </p>
        </div>
      </template>
      <UIcon
        name="pba:encuentros-regionales-filled"
        class="size-40 shrink-0 text-white sm:size-40 md:size-52 lg:size-60"
      />
    </UPageHero>
    <UContainer>
      <UPage>
        <UPageBody>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-center">
            ¿Cuánto futuro cabe en la provincia?
          </h1>
          <div class="max-w-5xl space-y-6 mx-auto">
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El Ministerio de Infraestructura y Servicios Públicos de la Provincia de Buenos Aires puso en marcha estos
              encuentros -destinados a las ocho regiones del interior bonaerense- para sumar aportes al <span class="font-bold text-highlighted">
                Plan Estratégico de Infraestructura (PEI)</span>, fortaleciendo una perspectiva territorial para consensuar la agenda de inversión en
              obras públicas.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              A través de estas <span class="font-bold text-highlighted">jornadas presenciales</span> y de los <span class="font-bold text-highlighted">espacios de participación</span> disponibles en esta plataforma,
              construiremos una <span class="font-bold text-highlighted">agenda de infraestructura</span> que refleje las necesidades y oportunidades de cada región
              junto a
              organizaciones sociales y comunitarias, entidades productivas, empresas, cooperativas, mutuales,
              universidades, instituciones deportivas, gobiernos locales, referentes territoriales y la sociedad civil."
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Durante estos encuentros se propone incorporar el saber territorial de cada obra o proyecto de la
              comunidad involucrada a la mirada técnica del Ministerio, generando una instancia de gobierno abierto
              que apunte a mejorar el impacto de la intervención, a favorecer el acceso a la información y a
              contribuir a la generación de confianza.
            </p>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
    <USeparator />
    <UPageSection
      orientation="horizontal"
      :ui="comoHacemosPageSectionUi"
    >
      <template #default>
        <div class="flex flex-col w-7/12 sm:w-6/12 md:w-5/12 lg:w-4/12 gap-4 hover:scale-103 transition-transform duration-300 sticky md:pt-5 top-(--ui-header-height)">
          <img
            src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/encuentros-regionales/plan-estrategico-infraestructura-pba-cover.jpg"
            loading="lazy"
            class="h-auto rounded-lg shadow-lg border border-default"
            alt="Plan Estratégico de Infraestructura de la Provincia de Buenos Aires"
          >
          <UButton
            to="https://docs.google.com/document/d/1gruvB4EHw6z6yESUJNGmwK0Tori7dPKN/edit"
            target="_blank"
            color="secondary"
            :ui="{ base: 'py-3 justify-center text-center text-md lg:text-xl relative' }"
          >
            <span class="font-bold">DESCARGÁ EL DOCUMENTO RESUMEN</span>
          </UButton>
        </div>
      </template>
      <template #body>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase">
          ¿CÓMO LO HACEMOS?
        </h1>
        <div class="max-w-5xl space-y-6 mx-auto">
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            Poniendo en común el <span class="font-bold text-highlighted">Plan Estratégico de Infraestructura</span>, que se organiza en cinco ejes de gestión, con los que
            abordan las necesidades y los desafíos territoriales en cuanto al desarrollo de la infraestructura y el acceso a
            servicios básicos vinculados a los <span class="font-bold text-highlighted">recursos hídricos, la conectividad, la energía, los sistemas urbanos y los
              cuidados</span>.
          </p>
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            A partir de estos ejes temáticos, en cada encuentro regional se debate e intercambia en <span class="font-bold text-highlighted">mesas participativas</span> para
            sumar aportes al PEI. A su vez, hay un espacio destinado específicamente a las <span class="font-bold text-highlighted">juventudes</span>.
          </p>
          <h3 class="text-xl font-bold text-primary">
            Ejes Temáticos
          </h3>
          <div class="flex flex-col lg:flex-row gap-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 w-full gap-2">
              <UAlert
                v-for="eje in ejesTematicosDescripciones"
                :key="eje.title"
                :title="eje.title"
                variant="subtle"
                color="neutral"
                orientation="horizontal"
              >
                <template #actions>
                  <UPopover
                    mode="hover"
                    :close-delay="250"
                    enable-touch
                    arrow
                  >
                    <UButton
                      color="primary"
                      variant="soft"
                      icon="lucide:info"
                    />
                    <template #content>
                      <div class="max-w-xs m-4 inline-flex text-center">
                        {{ eje.description }}
                      </div>
                    </template>
                  </UPopover>
                </template>
              </UAlert>
            </div>
            <UButton
              to="https://docs.google.com/document/d/1gruvB4EHw6z6yESUJNGmwK0Tori7dPKN/edit"
              target="_blank"
              color="secondary"
              :ui="{ base: 'py-3 justify-center text-center text-xl flex lg:flex-col gap-4' }"
            >
              <UIcon
                name="lucide:notebook-pen"
                class="size-8 lg:size-13 shrink-0 text-highlight md:mb-2"
              />
              <span class="font-bold">SUMÁ TUS APORTES</span>
            </UButton>
          </div>
        </div>
      </template>
    </UPageSection>
    <USeparator />
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="space-y-2">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-center">
              Participá de los encuentros regionales
            </h1>
            <h1 class="text-xl sm:text-2xl lg:text-3xl text-pretty tracking-tight font-light text-highlighted uppercase text-center">
              Agenda
            </h1>
          </div>
          <div class="px-4 lg:px-6 bg-elevated/35 border border-default rounded-lg shadow-lg">
            <EncuentrosRegionalesStepper />
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="flex gap-6">
            <div class="w-3/12">
              <EncuentrosRegionalesMapSelector />
            </div>
            <div class="w-8/12">
              <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-left mb-4">
                Encuentros
              </h1>
              <EncuentrosRegionalesConsultasCardLists />
            </div>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
    <div class="bg-accented/25 dark:bg-accented/10 py-12 sm:py-16 md:py-16 lg:py-16 drop-shadow-md">
      <UContainer>
        <LazyEncuentrosRegionalesNumbersAlcance />
      </UContainer>
    </div>
    <UContainer>
      <UPage>
        <UPageBody>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-center">
            CONOCÉ MAS
          </h1>
          <div class="max-w-5xl space-y-6 mx-auto py-12 sm:py-16 md:py-16 lg:py-16">
            <EncuentrosRegionalesConoceMas />
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
    <USeparator />
    <UContainer>
      <div class="max-w-5xl space-y-6 mx-auto py-12 sm:py-16 md:py-16 lg:py-16">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-center">
          ¿Por qué <span class="font-black text-highlighted">sumarte</span>?
        </h1>
        <EncuentrosRegionalesTestimonialsList />
      </div>
    </UContainer>
  </UTheme>
</template>
