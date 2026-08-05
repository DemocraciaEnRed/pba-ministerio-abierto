<script setup lang="ts">
definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Comentarios')

const { slug, data: consultation } = useConsultationAdmin()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Comentarios"
      description="Moderá los comentarios de la consulta y de sus temas de participación."
    />

    <UPageBody>
      <UAlert
        v-if="consultation && !consultation.commentsEnabled"
        icon="lucide:eye-off"
        color="warning"
        variant="subtle"
        title="La sección de comentarios está oculta"
        description="No se muestra en la página pública y no se puede comentar ni reaccionar. Podés volver a mostrarla desde la configuración de la consulta."
        class="mb-4"
      />
      <AdminCommentsModeration :consultation-slug="slug" />
    </UPageBody>
  </UPage>
</template>
