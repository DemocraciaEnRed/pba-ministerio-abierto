<script setup lang="ts">
definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Portada del tema')

const { consultationSlug, topicSlug, data: topic, refresh } = useTopicAdmin()

const basePath = computed(() =>
  `/api/consultations/${consultationSlug.value}/topics/${topicSlug.value}/cover`
)
</script>

<template>
  <UPage>
    <UPageHeader
      title="Portada"
      description="Imagen destacada que se usa como fondo del hero en la página pública del tema y en su tarjeta dentro de los listados."
    />

    <UPageBody>
      <AdminCoverImageForm
        v-if="topic"
        :base-path="basePath"
        :cover-url="topic.coverUrl"
        :cover-alt-text="topic.coverAltText"
        @saved="refresh"
      />
    </UPageBody>
  </UPage>
</template>
