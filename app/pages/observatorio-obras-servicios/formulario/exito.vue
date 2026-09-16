<script setup lang="ts">
usePageSeo({
  title: 'Aporte enviado - Observatorio de Obras y Servicios Públicos',
  description: 'Recibimos el aporte de tu institución al Observatorio de Obras y Servicios Públicos.',
  noindex: true
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-xl mx-auto mt-20 text-center"
        variant="subtle"
      >
        <div class="flex flex-col items-center gap-4 py-6">
          <UIcon
            name="lucide:circle-check"
            class="size-12 text-success"
          />
          <h1 class="text-2xl font-semibold text-highlighted">
            ¡Gracias por tu aporte!
          </h1>
          <p class="text-toned max-w-md">
            Recibimos el aporte de tu institución al <strong>Observatorio de Obras y Servicios Públicos</strong>.
            Lo vamos a compartir con el equipo del eje de trabajo que elegiste.
          </p>

          <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto pt-2">
            <UButton
              to="/observatorio-obras-servicios"
              label="Volver al Observatorio"
              icon="lucide:arrow-left"
              block
            />
            <UButton
              to="/observatorio-obras-servicios/formulario"
              label="Enviar otro aporte"
              icon="lucide:plus"
              color="neutral"
              variant="subtle"
              block
            />
          </div>
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
