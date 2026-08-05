<script setup lang="ts">
definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Comentarios del tema')

const { consultationSlug, topicSlug, data: topic } = useTopicAdmin()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Comentarios"
      description="Moderá los comentarios de este tema de participación."
    />

    <UPageBody>
      <UAlert
        v-if="topic && !topic.commentsEnabled"
        icon="lucide:eye-off"
        color="warning"
        variant="subtle"
        title="La sección de comentarios está oculta"
        description="No se muestra en la página pública del tema y no se puede comentar ni reaccionar. Podés volver a mostrarla desde la configuración del tema."
        class="mb-4"
      />
      <AdminCommentsModeration
        :consultation-slug="consultationSlug"
        :topic-slug="topicSlug"
      />
    </UPageBody>
  </UPage>
</template>
