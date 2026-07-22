<script setup lang="ts">
definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Comentarios del tema')

const { consultationSlug, topicSlug } = useTopicAdmin()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Comentarios"
      description="Moderá los comentarios de este tema de participación."
    />

    <UPageBody>
      <AdminCommentsModeration
        :consultation-slug="consultationSlug"
        :topic-slug="topicSlug"
      />
    </UPageBody>
  </UPage>
</template>
