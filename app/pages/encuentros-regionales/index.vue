<script lang="ts" setup>
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

const ejesTematicosDescripciones = ref([
  {
    title: 'Conectividad y logística',
    description: 'Corredores viales para el desarrollo, seguridad vial, rehabilitación y mantenimiento, apoyo logístico a la producción local y caminos rurales',
    icon: 'lucide:route'

  },
  {
    title: 'Infraestructura para los sistemas de ciudades',
    description: 'Infraestructura urbana, productiva, para el transporte, ambiental, institucional, comunitaria y cultural.',
    icon: 'lucide:building-2'
  },
  {
    title: 'Gestión integrada de los recursos hídricos',
    description: 'Gestión de cuencas, adaptación productiva a extremos climáticos, riesgo hídrico en ciudades, agua y saneamiento',
    icon: 'lucide:droplets'
  },
  {
    title: 'Infraestructura del cuidado',
    description: 'Red del Cuidado para infancias, personas con discapacidad, personas mayores, mujeres y diversidades, juventudes',
    icon: 'lucide:heart-handshake'
  },
  {
    title: 'Energía accesible y sostenible',
    description: 'Energía eléctrica, gas, energías renovables y eficiencia energética.',
    icon: 'lucide:zap'
  },
  {
    title: 'Juventudes',
    description: 'Futuro del trabajo, oferta educativa, condiciones necesarias para el arraigo, infraestructuras para su desarrollo integral',
    icon: 'lucide:users'
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
  root: 'bg-accented/25 dark:bg-accented/10 py-12 sm:py-12 md:py-12 lg:py-12 flex flex-col gap-6 sm:gap-y-6 md:gap-y-6 justify-center items-center',
  // container (default): 'flex flex-col lg:grid py-16 sm:py-24 lg:py-32 gap-8 sm:gap-16',
  // container (for horizontal): 'lg:grid-cols-2 lg:items-center',
  // container: 'flex flex-col lg:flex lg:flex-row-reverse gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center mx-auto py-12 sm:py-16 md:py-16 lg:py-16',
  container: 'flex flex-col sm:flex-col md:flex-row-reverse lg:flex lg:flex-row-reverse items-center md:items-start lg:items-start py-0 sm:py-0 md:py-0 lg:py-0 sm:gap-7',
  body: ' space-y-6 mx-auto lg:mt-0',
  wrapper: 'w-full xl:w-9/12'
}

// Al hacer clic en una región del mapa, navega a la última consulta creada asignada a
// esa región. Si la región no tiene ninguna consulta, el clic no tiene efecto.
async function onRegionSelect(regionSlug: string) {
  const { slug } = await $fetch(`/api/regions/${regionSlug}/latest-consultation`)
  if (slug) {
    await navigateTo(`/consultas/${slug}`)
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      orientation="horizontal"
      reverse
    >
      <template #header>
        <h1 class="text-md sm:text-lg font-medium text-white text-shadow-lg uppercase mb-3 text-center sm:text-left">
          Encuentros Regionales
        </h1>
        <div class="flex items-stretch gap-1">
          <p class="font-bold sm:font-extrabold text-xl sm:text-4xl text-white text-shadow-lg uppercase max-sm:leading-tight">
            ¿
          </p>
          <p class="font-bold sm:font-extrabold text-xl sm:text-4xl text-white text-shadow-lg uppercase max-sm:leading-tight">
            Cuánto<br>futuro<br>cabe en la<br>provincia?
          </p>
          <div class="self-stretch border-l-white border-l-3 mx-3 sm:mx-5" />
          <p class="font-light sm:font-extralight text-lg sm:text-2xl text-white text-shadow-lg uppercase max-sm:leading-tight">
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
          <div class="max-w-3xl space-y-6 mx-auto">
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El Ministerio de Infraestructura y Servicios Públicos de la Provincia de Buenos Aires puso en marcha estos
              encuentros -destinados a las ocho regiones del interior bonaerense- para sumar aportes al <span class="font-bold text-highlighted">
                Plan Estratégico de Infraestructura (PEI)</span>, fortaleciendo una perspectiva territorial para consensuar la agenda de inversión en
              obras públicas.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              A través de estas <span class="font-bold text-highlighted">jornadas presenciales</span> y de los <span class="font-bold text-highlighted">espacios de participación</span> disponibles en esta plataforma,
              construiremos una <span class="font-bold text-highlighted">agenda de infraestructura</span> que refleje las necesidades y oportunidades de cada región
              junto a organizaciones sociales y comunitarias, entidades productivas, empresas, cooperativas, mutuales,
              universidades, instituciones deportivas, gobiernos locales, referentes territoriales y la sociedad civil.
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
        <div class="flex flex-col w-9/12 sm:w-7/12 md:w-6/12 xl:w-3/12 gap-4">
          <ULink
            to="https://drive.google.com/file/d/1Rjpm0XVlGnGd05ZjOrb5FDbhrMNw6UPn/view"
            target="_blank"
            external
          >
            <img
              src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/encuentros-regionales/plan-estrategico-infraestructura-pba-cover.jpg"
              loading="lazy"
              class="h-auto rounded-lg shadow-lg border border-default hover:scale-103 transition-transform duration-300"
              alt="Plan Estratégico de Infraestructura de la Provincia de Buenos Aires"
            >
          </ULink>
          <UButton
            to="https://drive.google.com/file/d/1Rjpm0XVlGnGd05ZjOrb5FDbhrMNw6UPn/view"
            target="_blank"
            color="secondary"
            icon="lucide:download"
            :ui="{ base: 'py-3 justify-center text-center text-md font-bold lg:text-xl relative hover:scale-103 transition-transform duration-300' }"
          >
            DESCARGÁ EL DOCUMENTO RESUMEN
          </UButton>
          <UButton
            to="/encuentros-regionales/formulario"
            target="_blank"
            color="secondary"
            icon="lucide:notebook-pen"
            :ui="{ base: 'py-3 justify-center text-center text-md font-bold lg:text-xl relative hover:scale-103 transition-transform duration-300' }"
          >
            SUMÁ TUS APORTES
          </UButton>
        </div>
      </template>
      <template #body>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase">
          ¿CÓMO LO HACEMOS?
        </h1>
        <div class="space-y-6">
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
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
            Ejes Temáticos
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 w-full gap-2">
            <UAlert
              v-for="eje in ejesTematicosDescripciones"
              :key="eje.title"
              :title="eje.title"
              :description="eje.description"
              :icon="eje.icon"
              variant="subtle"
              color="neutral"
              orientation="horizontal"
              :ui="{
                title: 'text-md sm:text-lg font-bold text-primary',
                description: 'leading-7 text-base',
                icon: 'size-6 sm:size-7 text-primary pt-2',
                root: 'items-start'
              }"
            />
          </div>
        </div>
      </template>
    </UPageSection>
    <USeparator />
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="flex flex-col-reverse md:flex-row justify-center gap-6">
            <div class="w-9/12 sm:w-6/12 mx-auto md:w-8/12 lg:w-6/12">
              <EncuentrosRegionalesMapSelector @select="onRegionSelect" />
            </div>
            <div class="w-full space-y-6">
              <div class="space-y-2">
                <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-left">
                  Participá de los encuentros regionales
                </h1>
                <h1 class="text-xl sm:text-2xl lg:text-3xl text-pretty tracking-tight font-light text-highlighted uppercase text-left">
                  Agenda
                </h1>
              </div>
              <div class="px-4 lg:px-6 bg-elevated/35 border border-default rounded-lg shadow-lg">
                <EncuentrosRegionalesAgendaTimeline />
              </div>
            </div>
          </div>
          <div class="max-w-5xl space-y-6 mx-auto">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary">
              Regionalización de la PBA en el marco del PEI
            </h1>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              En la Provincia, los criterios de regionalización son múltiples y suelen ser utilizados por distintos organismos para <span class="font-bold text-highlighted">planificar políticas públicas</span>. En este caso, se toma como base la propuesta publicada por el Ministerio de Economía bonaerense en el estudio "Programación del Desarrollo Territorial. Diagnóstico preliminar y líneas de acción (2011-2012)", que delimitó regiones económico-productivas desde una perspectiva político-administrativa.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              A partir de este esquema, se introdujeron ajustes orientados a favorecer la complementariedad productiva y social, con el objetivo de que sirvan como <span class="font-bold text-highlighted">insumo para la construcción de iniciativas de infraestructura integrales</span> que superen la capacidad de acción aislada de cada gobierno local. Esta organización territorial no restringe la realización de intervenciones fuera de sus límites; por el contrario, pretende articular esfuerzos para potenciar el desarrollo territorial y la eficacia de las políticas públicas, respetando las especificidades locales.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El criterio adoptado agrupó municipios en regiones homogéneas y compactas desde el punto de vista socioeconómico, dando como resultado una división del territorio en las <span class="font-bold text-highlighted">9 regiones</span> indicadas en el mapa disponible en este sitio.
            </p>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
    <USeparator
      icon="pba:encuentros-regionales"
      :ui="{ icon: 'size-18 text-primary' }"
    />
    <div class="py-12 sm:py-16 md:py-16 lg:py-16">
      <UContainer class="w-full lg:max-w-5xl 2xl:max-w-6xl">
        <h1 class="text-center sm:text-left text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase mb-4">
          ACCEDÉ A LA INFORMACIÓN DE CADA JORNADA
        </h1>
        <p class="text-center sm:text-left leading-7 text-neutral-700 dark:text-neutral-300 mb-6">
          Al clickear en cada región, encontrarás los documentos de cada encuentro y los espacios de participación para que te inscribas, dejes tus aportes y proyectos, y hagas comentarios.
        </p>
        <EncuentrosRegionalesConsultasCardLists />
      </UContainer>
    </div>
    <USeparator />
    <div class="bg-accented/25 dark:bg-accented/10 py-12 sm:py-16 md:py-16 lg:py-16 drop-shadow-md">
      <UContainer>
        <LazyEncuentrosRegionalesNumbersAlcance />
      </UContainer>
    </div>
    <USeparator />
    <UContainer>
      <div class="max-w-5xl space-y-6 mx-auto py-12 sm:py-16 md:py-16 lg:py-16">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl text-pretty tracking-tight font-extrabold text-primary uppercase text-center">
          ¿Por qué sumarte?
        </h1>
        <EncuentrosRegionalesTestimonialsList />
      </div>
    </UContainer>
  </UTheme>
</template>
