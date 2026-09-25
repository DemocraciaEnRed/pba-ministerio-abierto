<script setup lang="ts">
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

usePageSeo({
  title: 'Formulario de aportes - Observatorio de Obras y Servicios Públicos',
  description: 'Presentá el aporte de tu institución a los ejes de trabajo del Observatorio de Obras y Servicios Públicos.',
  url: '/observatorio-obras-servicios/formulario'
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
    root: 'text-center',
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
    <UContainer class="max-w-5xl">
      <UPage>
        <UPageHeader
          title="Formulario de aportes"
          description="Sumá el conocimiento y la experiencia de tu institución"
        />
        <UPageBody>
          <div class="space-y-6 mx-auto">
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Las instituciones que integran el <span class="font-bold text-highlighted">Observatorio de Obras y Servicios Públicos</span> pueden presentar aportes a los ejes de trabajo en los que se organiza su agenda.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Completá el formulario indicando la institución que representás, el eje de trabajo al que querés sumar tu aporte y la documentación que quieras compartir.
            </p>
            <UAlert
              title="Las preguntas marcadas con * son obligatorias"
              color="warning"
              icon="lucide:info"
              variant="soft"
              class="mt-6"
            />
          </div>
          <ObservatorioAportesForm />
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>
