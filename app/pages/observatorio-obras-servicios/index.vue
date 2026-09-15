<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
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

const openFaq = ref<string[]>([])

const { data: workGroups } = await useAsyncData('observatory-work-groups', () =>
  $fetch<WorkGroup[]>('/api/observatory-work-groups')
)

const faqItems = ref<AccordionItem[]>([
  {
    label: '¿Cuándo y por qué se creó?',
    value: 'cuando-por-que-creo',
    content: `Fue creado en 2024 por el Ministerio de Infraestructura y Servicios Públicos mediante la Resolución Nº 1172/24, como una de las iniciativas estratégicas del Plan de Fortalecimiento Institucional 2024–2027.

Su puesta en marcha responde al desafío de fortalecer las capacidades del Ministerio incorporando el conocimiento, la experiencia y las distintas perspectivas de quienes participan en la planificación, el desarrollo, la gestión y la evaluación de la infraestructura y los servicios públicos. En este marco, el Observatorio es un espacio institucional permanente de diálogo y trabajo colaborativo, que permite sistematizar estos aportes y transformarlos en insumos para mejorar las políticas públicas.

El funcionamiento del Observatorio se encuentra regulado por su Reglamento Interno, mediante la Resolución N.º 17/2025. Allí se establecen sus normas de funcionamiento, sus principios generales —transparencia, participación y legalidad— y la composición de sus órganos: la Presidencia, a cargo de la Subsecretaría Técnica, Administrativa y Legal del Ministerio; las Vocalías; y los Equipos de Trabajo.`
  },
  {
    label: '¿Cómo funciona?',
    value: 'como-funciona',
    content: `El Observatorio cuenta con siete grupos temáticos, vinculados con las principales líneas del Ministerio a través del Plan Estratégico de Infraestructura (PEI) y el Plan de Fortalecimiento Institucional (PFI). Cada año, un Plan de Trabajo Anual, consensuado entre las instituciones, define los temas y prioridades que abordará cada grupo. Una reunión plenaria de apertura presenta la agenda y, al cierre del año, se comparten los avances, resultados y desafíos.

Los grupos están integrados por representantes de las instituciones participantes, equipos técnicos del MISP, especialistas invitados y referentes sectoriales, que intercambian experiencias y construyen propuestas conjuntas. Los encuentros, presenciales o virtuales, combinan exposiciones breves, intercambio y trabajo colaborativo.

Los resultados se sistematizan en documentos técnicos validados por las y los participantes y se incorporan a políticas, planes y herramientas del Ministerio.

El proceso se desarrolla en seis pasos:
1. Convocamos reuniones y espacios de intercambio.
2. Escuchamos aportes de instituciones y especialistas.
3. Sistematizamos propuestas, estudios y recomendaciones.
4. Analizamos la pertinencia técnica e institucional.
5. Incorporamos mejoras en el ciclo de las políticas públicas.
6. Informamos avances, resultados y desafíos.`
  },
  {
    label: '¿Cómo participar?',
    value: 'como-participar',
    content: `La participación en el Observatorio se canaliza a través de las instituciones que lo integran: universidades, cámaras empresariales, colegios profesionales, sindicatos y organizaciones de la sociedad civil, junto con las y los especialistas invitadas/os.

Cada institución integrante formaliza su incorporación mediante la firma de un convenio marco de colaboración con el Ministerio de Infraestructura y Servicios Públicos.

El trabajo cotidiano se desarrolla a través de las y los especialistas que cada organización designa como representantes, que se suman a uno o más grupos de trabajo según su perfil e interés temático.

La participación se concreta por tres vías complementarias: asistencia a las reuniones de los grupos de trabajo, exposiciones y presentaciones en los encuentros, y presentación de aportes técnicos (proyectos, investigaciones, experiencias, datos, propuestas o documentos) vinculados con los ejes de trabajo.

Este espacio web acompaña y facilita el proceso de participación. Las instituciones que integran el Observatorio pueden inscribirse en las reuniones de trabajo, acceder y descargar materiales, presentar propuestas y aportes, y consultar los resultados y avances del trabajo colectivo.

¿Tu institución quiere formar parte del Observatorio?

Las universidades, cámaras empresariales, colegios profesionales, sindicatos y organizaciones de la sociedad civil interesadas en integrarse pueden enviar su propuesta a observatorio@minfra.gba.gob.ar, indicando el perfil de la institución, los ejes o grupos de trabajo de interés y el aporte que podrían realizar.`
  },
  {
    label: '¿Quiénes integran el Observatorio?',
    value: 'quienes-integran',
    content: `La lista de instituciones integrantes es dinámica y puede modificarse mensualmente con la incorporación de nuevas instituciones.

Universidades nacionales y provinciales:
Universidad Nacional Arturo Jauretche; Universidad Nacional de Avellaneda; Universidad Nacional de Hurlingham; Universidad Nacional de José C. Paz; Universidad Nacional de La Matanza; Universidad Nacional de La Plata; Universidad Nacional de Lanús; Universidad Nacional de Lomas de Zamora; Universidad Nacional de Luján; Universidad Nacional de Mar del Plata; Universidad Nacional de Moreno; Universidad Nacional de Quilmes; Universidad Nacional de San Antonio de Areco; Universidad Nacional de San Martín; Universidad Nacional de Tres de Febrero; Universidad Nacional del Delta; Universidad Nacional del Noroeste de la Provincia de Buenos Aires; Universidad Nacional del Oeste; Universidad Nacional del Sur; Universidad Nacional Guillermo Brown; Universidad Nacional Raúl Scalabrini Ortiz; Universidad Pedagógica Nacional; Universidad Tecnológica Nacional; Universidad Provincial de Ezeiza; Universidad Provincial del Sudoeste.

Unidades académicas:
Facultad de Ciencias Sociales UBA; Observatorio de la Contratación Pública de la Universidad Austral.

Organismos del sistema universitario:
Consejo Interuniversitario Nacional (CIN); Consejo Latinoamericano de Ciencias Sociales (CLACSO); Facultad Latinoamericana de Ciencias Sociales (FLACSO).

Cámaras empresariales:
Cámara Argentina de Consultoras de Ingeniería (CADECI); Cámara Argentina de la Construcción de la Provincia de Buenos Aires (CAMARCO PBA).

Colegios profesionales:
Colegio de Arquitectos de la Provincia de Buenos Aires; Colegio de Ingenieros de la Provincia de Buenos Aires.

Sindicatos:
Fundación UOCRA.

Organizaciones de la sociedad civil:
Asociación Argentina de Estudios de Administración Pública (AAEAP); CIPPEC; Democracia en Red; Equipo Latinoamericano de Justicia y Género (ELA); Fundación Poder Ciudadano; Fundación Transparencia Activa; Fundar; Grow – Género y Trabajo; Ingeniería sin Fronteras.

Instituciones invitadas en carácter de especialistas:
Asesoría General de Gobierno; Banco Interamericano de Desarrollo (BID); Bolsa de Cereales y Productos de Bahía Blanca; Bolsa de Comercio de Rosario (BCP); CAF - Banco de desarrollo de América Latina y El Caribe; Cámara de Apelación en lo Contencioso Administrativo de San Nicolás, Zárate, Campana, Pergamino y Junín; Centro de Estudios Legales y Sociales (CELS); Colectivo Feministas sin Fronteras; Confederación de Asociaciones Rurales de Buenos Aires y La Pampa (CARBAP); Consejo Federal de Decanos de Ingeniería (CONFEDI); Consorcio de Gestión del Puerto de Dock Sud (CGPDS); Contaduría General de la Provincia; Federación de Cooperativas de la República Argentina (COOPERAR); Federación de Cooperativas de Trabajo, Consumo y Vivienda (COOPERAR); Fondo de Garantías Buenos Aires (Fuerza Solidaria); Grow – Género y Trabajo; Instituto Argentino de Normalización y Certificación (IRAM); Instituto de Investigaciones y Políticas del Ambiente Construido (IIPAC); Instituto Tecnológico de Chascomús (INTECH); Ministerio de Desarrollo de la Comunidad de la Provincia de Buenos Aires; Ministerio de Mujeres y Diversidad de la Provincia de Buenos Aires; Municipalidad de Ayacucho; Observatorio de Derecho al Cuidado de la Universidad Nacional del Centro.`
  },
  {
    label: '¿Qué resultados genera?',
    value: 'que-resultados-genera',
    content: `Políticas públicas trabajadas colectivamente. Las políticas e iniciativas del Ministerio se ponen en diálogo con el conocimiento, la experiencia y las perspectivas de las instituciones que integran el Observatorio. Esto permite someterlas a una revisión crítica, incorporar experiencias y casos de referencia locales, regionales e internacionales, adoptar estándares y buenas prácticas, y generar nuevas propuestas y líneas de trabajo.

El intercambio también permite mejorar las estrategias de formulación, implementación, articulación, capacitación y sensibilización de las iniciativas. Así, las políticas incorporan conocimiento especializado y situado, responden mejor a las necesidades y capacidades de los distintos sectores y se construyen sobre una base más amplia de consenso, lo que contribuye a que sean más pertinentes, legítimas y efectivas.

Entre los principales resultados se encuentran:
- Plan Estratégico de Infraestructura.
- Conectividad y logística.
- Energía accesible y sostenible.
- Gestión Integrada del Recurso Hídrico.
- Infraestructura para los Sistemas de Ciudades.
- Infraestructura del Cuidado.
- Plan de Integridad, Transparencia y Gobierno Abierto.
- Programa de Infraestructura Sostenible y Resiliente.
- Plan de Género y Diversidad 2024–2027.
- Manual de Infraestructura con Perspectiva de Género y Diversidad.
- Planificación con perspectiva de cuidados frente a los cambios sociodemográficos.
- Contenidos Mínimos de los Planes de Gestión Ambiental y Social de las Obras del MISP.
- Metodología de etiquetado de obras sostenibles y resilientes.
- Plan de Innovación y Transformación Digital 2024–2027 del MISP.
- MapaInversiones PBA.
- Metodología BIM.
- Laboratorio InfraInnova de IA.
- Oficina Virtual.
- PBA Contrataciones.
- Estudio sobre Brechas de Inversión en Infraestructura.
- Manual de Evaluaciones.
- Anteproyecto de Ley de Obra Pública de la Provincia de Buenos Aires.
- Pliego con Perspectiva de Integridad, Desarrollo Sostenible y Género y Diversidad.`
  }
])

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
  accordion: {
    label: 'text-2xl font-bold text-primary',
    body: 'leading-7 text-neutral-700 dark:text-neutral-300',
    trigger: 'hover:cursor-pointer'
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

    <UPageSection>
      <div class="max-w-3xl mx-auto space-y-6">
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          El <span class="font-bold">Observatorio de Obras y Servicios Públicos</span> es un espacio institucional de participación y control ciudadano donde universidades, sindicatos, cámaras empresariales, colegios profesionales y organizaciones de la sociedad civil trabajan junto al Ministerio para analizar, evaluar y mejorar las políticas de infraestructura y servicios públicos de la Provincia.
        </p>
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          A través de un proceso permanente de diálogo y colaboración, las instituciones participantes aportan su conocimiento, experiencia y mirada crítica para fortalecer las capacidades estatales y mejorar las políticas públicas, con la convicción de que las transformaciones construidas con la sociedad son más legítimas, más pertinentes y más sostenibles en el tiempo.
        </p>
        <p class="leading-7 text-neutral-700 dark:text-neutral-300">
          Estas instancias permiten identificar impactos sociales y ambientales de los proyectos no detectados originalmente, mejorar la calidad del diseño y la implementación, y contribuir a la generación de confianza y legitimidad en la comunidad.
        </p>
        <UAccordion
          v-model="openFaq"
          :items="faqItems"
          type="multiple"
          class="w-full"
        />
      </div>
    </UPageSection>
    <UContainer>
      <UPageSection
        title="Grupos de trabajo"
        description="El Observatorio se organiza en grupos de trabajo que abordan los distintos ejes de la obra pública provincial."
      >
        <UPageGrid>
          <div
            v-for="group in workGroups || []"
            :key="group.id"
            class="flex flex-col gap-3 rounded-xl p-5"
            :style="{ backgroundColor: group.color, color: group.iconColor }"
          >
            <UIcon
              :name="group.icon"
              class="size-10"
            />
            <h3 class="text-lg font-semibold leading-tight">
              {{ group.name }}
            </h3>
            <p class="text-sm opacity-90">
              {{ group.description }}
            </p>
          </div>
        </UPageGrid>
      </UPageSection>

      <UPageSection
        title="Instituciones que integran el Observatorio"
        description="Universidades, colegios profesionales, cámaras empresariales, sindicatos y organizaciones de la sociedad civil que participan del espacio."
      >
        <ObservatorioInstitutionsShowcase />
      </UPageSection>
    </UContainer>
  </UTheme>
</template>
