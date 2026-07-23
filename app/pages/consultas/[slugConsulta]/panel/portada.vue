<script setup lang="ts">
definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Portada')

const { slug, data: consultation, refresh } = useConsultationAdmin()

const basePath = computed(() => `/api/consultations/${slug.value}/cover`)
</script>

<template>
  <UPage>
    <UPageHeader
      title="Portada"
      description="Imagen destacada que se usa como fondo del hero en la página pública de la consulta y en su tarjeta dentro de los listados."
    />

    <UPageBody>
      <AdminCoverImageForm
        v-if="consultation"
        :base-path="basePath"
        :cover-url="consultation.coverUrl"
        :cover-alt-text="consultation.coverAltText"
        @saved="refresh"
      />
    </UPageBody>
  </UPage>
</template>
