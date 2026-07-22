<script setup lang="ts">
definePageMeta({
  layout: 'consultas-control-panel',
  middleware: 'consultation-manager'
})

usePrivatePageSeo('Clasificación')

const { data: consultation, refresh } = useConsultationAdmin()
</script>

<template>
  <UPage>
    <UPageHeader
      title="Clasificación"
      description="Ordená la consulta para el listado público y los filtros."
    />

    <UPageBody>
      <div class="max-w-2xl">
        <AdminConsultationTaxonomyForm
          v-if="consultation"
          :consultation-id="consultation.id"
          :initial-section-id="consultation.section?.id ?? null"
          :initial-categories="consultation.categories"
          :initial-tags="consultation.tags"
          @saved="refresh"
        />
      </div>
    </UPageBody>
  </UPage>
</template>
