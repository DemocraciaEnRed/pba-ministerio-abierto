<script setup lang="ts">
definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Resultados del tema')
</script>

<template>
  <UPage>
    <UPageHeader
      title="Resultados"
      description="Publicación y visualización de resultados del tema (placeholder)."
    />

    <UPageBody>
      <UPageCard>
        <p class="text-sm text-muted">
          Placeholder para agregados, publicación automática al cierre y mensajes de estado.
        </p>
      </UPageCard>
    </UPageBody>
  </UPage>
</template>
