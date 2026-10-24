<script setup lang="ts">
definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Exportaciones')

const browser = useTemplateRef('browser')
</script>

<template>
  <UPage>
    <UPageHeader
      title="Exportaciones"
      description="Todas las exportaciones CSV pedidas en la plataforma, con quién las pidió. Las tuyas también están en Mi cuenta → Mis exportaciones."
      :links="[{
        label: 'Actualizar',
        icon: 'i-lucide-refresh-cw',
        color: 'neutral',
        variant: 'subtle',
        loading: browser?.status === 'pending',
        onClick: () => browser?.refresh()
      }]"
    />

    <UPageBody>
      <ExportsDataExportsBrowser
        ref="browser"
        scope="all"
      />
    </UPageBody>
  </UPage>
</template>
