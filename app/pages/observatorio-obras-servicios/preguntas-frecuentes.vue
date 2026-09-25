<script setup lang="ts">
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

usePageSeo({
  title: 'Preguntas frecuentes del Observatorio de Obras y Servicios Públicos',
  description: 'Resolvé tus dudas sobre el Observatorio de Obras y Servicios Públicos: su origen, funcionamiento, instituciones integrantes y resultados.',
  url: '/observatorio-obras-servicios/preguntas-frecuentes'
})

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
  pageHeader: {
    root: 'text-center max-w-3xl mx-auto',
    wrapper: 'flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero>
      <img
        src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/observatorio-obras-servicios/logo-white.svg"
        alt="Observatorio de Obras y Servicios Públicos Logo"
        class="mx-auto lg:mx-0 lg:max-w-2xl max-w-xl"
      >
    </UPageHero>
    <ObservatorioSubNav />
    <USeparator />
    <UContainer>
      <UPage>
        <UPageHeader
          title="Preguntas frecuentes"
          description="Todo lo que necesitás saber sobre el Observatorio de Obras y Servicios Públicos."
        />
        <UPageBody>
          <div class="max-w-3xl mx-auto py-12 space-y-12">
            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Cuándo y por qué se creó?
              </h2>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Fue creado en 2024 por el Ministerio de Infraestructura y Servicios Públicos mediante la
                Resolución Nº 1172/24, como una de las iniciativas estratégicas del Plan de Fortalecimiento
                Institucional 2024–2027.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Su puesta en marcha responde al desafío de fortalecer las capacidades del Ministerio
                incorporando el conocimiento, la experiencia y las distintas perspectivas de quienes
                participan en la planificación, el desarrollo, la gestión y la evaluación de la infraestructura
                y los servicios públicos. En este marco, el Observatorio es un espacio institucional
                permanente de diálogo y trabajo colaborativo, que permite sistematizar estos aportes y
                transformarlos en insumos para mejorar las políticas públicas.
              </p>
              <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                El funcionamiento del Observatorio se encuentra regulado por su Reglamento Interno, mediante
                la Resolución N.º 17/2025. Allí se establecen sus normas de funcionamiento, sus principios
                generales —transparencia, participación y legalidad— y la composición de sus órganos: la
                Presidencia, a cargo de la Subsecretaría Técnica, Administrativa y Legal del Ministerio; las
                Vocalías; y los Equipos de Trabajo.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Cómo funciona?
              </h2>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                El Observatorio cuenta con siete grupos temáticos, vinculados con las principales líneas del
                Ministerio a través del Plan Estratégico de Infraestructura (PEI) y el Plan de Fortalecimiento
                Institucional (PFI). Cada año, un Plan de Trabajo Anual, consensuado entre las instituciones,
                define los temas y prioridades que abordará cada grupo. Una reunión plenaria de apertura
                presenta la agenda y, al cierre del año, se comparten los avances, resultados y desafíos.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Los grupos están integrados por representantes de las instituciones participantes, equipos
                técnicos del MISP, especialistas invitados y referentes sectoriales, que intercambian
                experiencias y construyen propuestas conjuntas. Los encuentros, presenciales o virtuales,
                combinan exposiciones breves, intercambio y trabajo colaborativo.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Los resultados se sistematizan en documentos técnicos validados por las y los participantes y
                se incorporan a políticas, planes y herramientas del Ministerio.
              </p>
              <p class="mb-2 leading-7 text-neutral-700 dark:text-neutral-300">
                El proceso se desarrolla en seis pasos:
              </p>
              <ol class="list-decimal list-inside space-y-2 leading-7 text-neutral-700 dark:text-neutral-300">
                <li>Convocamos reuniones y espacios de intercambio.</li>
                <li>Escuchamos aportes de instituciones y especialistas.</li>
                <li>Sistematizamos propuestas, estudios y recomendaciones.</li>
                <li>Analizamos la pertinencia técnica e institucional.</li>
                <li>Incorporamos mejoras en el ciclo de las políticas públicas.</li>
                <li>Informamos avances, resultados y desafíos.</li>
              </ol>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Cómo participar?
              </h2>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                La participación en el Observatorio se canaliza a través de las instituciones que lo integran:
                universidades, cámaras empresariales, colegios profesionales, sindicatos y organizaciones de
                la sociedad civil, junto con las y los especialistas invitadas/os.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Cada institución integrante formaliza su incorporación mediante la firma de un convenio marco
                de colaboración con el Ministerio de Infraestructura y Servicios Públicos.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                El trabajo cotidiano se desarrolla a través de las y los especialistas que cada organización
                designa como representantes, que se suman a uno o más grupos de trabajo según su perfil e
                interés temático.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                La participación se concreta por tres vías complementarias: asistencia a las reuniones de los
                grupos de trabajo, exposiciones y presentaciones en los encuentros, y presentación de aportes
                técnicos (proyectos, investigaciones, experiencias, datos, propuestas o documentos) vinculados
                con los ejes de trabajo.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Este espacio web acompaña y facilita el proceso de participación. Las instituciones que
                integran el Observatorio pueden inscribirse en las reuniones de trabajo, acceder y descargar
                materiales, presentar propuestas y aportes, y consultar los resultados y avances del trabajo
                colectivo.
              </p>
              <p class="mb-4 leading-7 font-bold text-primary">
                ¿Tu institución quiere formar parte del Observatorio?
              </p>
              <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                Las universidades, cámaras empresariales, colegios profesionales, sindicatos y organizaciones
                de la sociedad civil interesadas en integrarse pueden enviar su propuesta a
                <a
                  href="mailto:observatorio@minfra.gba.gob.ar"
                  class="text-primary hover:underline"
                >observatorio@minfra.gba.gob.ar</a>, indicando el perfil de la institución, los ejes o grupos
                de trabajo de interés y el aporte que podrían realizar.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Quiénes integran el Observatorio?
              </h2>
              <p class="mb-6 leading-7 text-neutral-700 dark:text-neutral-300">
                La lista de instituciones integrantes es dinámica y puede modificarse mensualmente con la
                incorporación de nuevas instituciones.
              </p>
              <ObservatorioInstitutionsFullList />
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Qué resultados genera?
              </h2>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Políticas públicas trabajadas colectivamente. Las políticas e iniciativas del Ministerio se
                ponen en diálogo con el conocimiento, la experiencia y las perspectivas de las instituciones
                que integran el Observatorio. Esto permite someterlas a una revisión crítica, incorporar
                experiencias y casos de referencia locales, regionales e internacionales, adoptar estándares y
                buenas prácticas, y generar nuevas propuestas y líneas de trabajo.
              </p>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                El intercambio también permite mejorar las estrategias de formulación, implementación,
                articulación, capacitación y sensibilización de las iniciativas. Así, las políticas incorporan
                conocimiento especializado y situado, responden mejor a las necesidades y capacidades de los
                distintos sectores y se construyen sobre una base más amplia de consenso, lo que contribuye a
                que sean más pertinentes, legítimas y efectivas.
              </p>
              <p class="mb-2 leading-7 text-neutral-700 dark:text-neutral-300">
                Entre los principales resultados se encuentran:
              </p>
              <ul class="list-disc list-inside space-y-2 leading-7 text-neutral-700 dark:text-neutral-300">
                <li>Plan Estratégico de Infraestructura.</li>
                <li>Conectividad y logística.</li>
                <li>Energía accesible y sostenible.</li>
                <li>Gestión Integrada del Recurso Hídrico.</li>
                <li>Infraestructura para los Sistemas de Ciudades.</li>
                <li>Infraestructura del Cuidado.</li>
                <li>Plan de Integridad, Transparencia y Gobierno Abierto.</li>
                <li>Programa de Infraestructura Sostenible y Resiliente.</li>
                <li>Plan de Género y Diversidad 2024–2027.</li>
                <li>Manual de Infraestructura con Perspectiva de Género y Diversidad.</li>
                <li>Planificación con perspectiva de cuidados frente a los cambios sociodemográficos.</li>
                <li>Contenidos Mínimos de los Planes de Gestión Ambiental y Social de las Obras del MISP.</li>
                <li>Metodología de etiquetado de obras sostenibles y resilientes.</li>
                <li>Plan de Innovación y Transformación Digital 2024–2027 del MISP.</li>
                <li>MapaInversiones PBA.</li>
                <li>Metodología BIM.</li>
                <li>Laboratorio InfraInnova de IA.</li>
                <li>Oficina Virtual.</li>
                <li>PBA Contrataciones.</li>
                <li>Estudio sobre Brechas de Inversión en Infraestructura.</li>
                <li>Manual de Evaluaciones.</li>
                <li>Anteproyecto de Ley de Obra Pública de la Provincia de Buenos Aires.</li>
                <li>Pliego con Perspectiva de Integridad, Desarrollo Sostenible y Género y Diversidad.</li>
              </ul>
            </section>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>
