<script setup lang="ts">
definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Comentarios')

const { slug } = useConsultationAdmin()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Comentarios"
      description="Moderá los comentarios de la consulta y de sus temas de participación."
    />

    <UPageBody>
      <AdminCommentsModeration :consultation-slug="slug" />
    </UPageBody>
  </UPage>
</template>
