<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slugConsulta))

usePageSeo({
  title: 'Inscripción enviada',
  description: 'Recibimos tu inscripción.',
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
            ¡Recibimos tu inscripción!
          </h1>
          <p class="text-toned max-w-md">
            Te enviamos un correo con el detalle de tu inscripción, la fecha y el lugar del encuentro.
            Revisá tu casilla —incluido el correo no deseado— para confirmar que llegó.
          </p>

          <div class="pt-2 w-full sm:w-auto">
            <UButton
              :to="`/consultas/${slug}`"
              label="Volver a la consulta"
              icon="lucide:arrow-left"
              block
            />
          </div>
        </div>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
