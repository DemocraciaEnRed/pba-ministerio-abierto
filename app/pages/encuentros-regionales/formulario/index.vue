<script lang="ts" setup>
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

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
    <UContainer class="max-w-5xl">
      <UPage>
        <UPageBody>
          <div class=" space-y-6 mx-auto">
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Te invitamos a participar de la construcción de una <span class="font-bold text-highlighted">agenda de infraestructura</span> para el desarrollo que refleje las necesidades y oportunidades de cada región de la Provincia, con el objetivo de avanzar en la priorización de inversiones y obras estratégicas.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Completá el formulario para sumar tus aportes al <span class="font-bold text-highlighted">Plan Estratégico de Infraestructura</span> y compartir tus ideas y proyectos.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Por cualquier duda o consulta, escribí a:
              <a
                href="mailto:encuentrosregionales@minfra.gba.gob.ar"
                class="font-bold text-highlighted"
              >encuentrosregionales@minfra.gba.gob.ar</a>
            </p>
            <UAlert
              title="Las preguntas marcadas con * son obligatorias"
              color="warning"
              icon="lucide:info"
              variant="soft"
              class="mt-6"
            />
          </div>
          <EncuentrosRegionalesAportesForm />
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>
