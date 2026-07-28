<script setup lang="ts">
usePageSeo({
  title: 'Aporte enviado - Encuentros Regionales',
  description: 'Recibimos tu aporte al Plan Estratégico de Infraestructura.',
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
            Recibimos tu aporte al <strong>Plan Estratégico de Infraestructura</strong>.
            Tu participación nos ayuda a construir una agenda de desarrollo para la Provincia.
          </p>

          <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto pt-2">
            <UButton
              to="/encuentros-regionales"
              label="Volver a Encuentros Regionales"
              icon="lucide:arrow-left"
              block
            />
            <UButton
              to="/encuentros-regionales/formulario"
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
