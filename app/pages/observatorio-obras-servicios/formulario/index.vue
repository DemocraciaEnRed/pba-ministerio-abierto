<script setup lang="ts">
import { getConsultationType } from '#shared/data/consultation-types'

const consultationType = getConsultationType('observatorio-obras-servicios')

usePageSeo({
  title: 'Formulario de aportes - Observatorio de Obras y Servicios Públicos',
  description: 'Presentá el aporte de tu institución a los ejes de trabajo del Observatorio de Obras y Servicios Públicos.',
  url: '/observatorio-obras-servicios/formulario'
})
</script>

<template>
  <div>
    <UPageHero
      title="Formulario de aportes"
      :description="consultationType?.description"
      :ui="{ root: 'bg-primary', title: 'text-white', description: 'text-white' }"
    />

    <UContainer class="max-w-5xl">
      <UPage>
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
  </div>
</template>
