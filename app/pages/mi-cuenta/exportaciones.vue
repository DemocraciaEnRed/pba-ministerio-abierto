<script setup lang="ts">
definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Mis exportaciones')

const browser = useTemplateRef('browser')
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Mis exportaciones"
      description="Archivos CSV que pediste desde los paneles de gestión. Quedan guardados para que los descargues cuando quieras."
      :links="[{
        label: 'Actualizar',
        icon: 'i-lucide-refresh-cw',
        color: 'neutral',
        variant: 'subtle',
        loading: browser?.status === 'pending',
        onClick: () => browser?.refresh()
      }]"
    />

    <UAlert
      icon="i-lucide-shield-alert"
      color="neutral"
      variant="subtle"
      title="Contienen datos personales"
      description="Pueden incluir nombres, correos y otros datos de participantes; las personas que administran la plataforma también pueden verlas. Descargalas solo para la gestión y eliminá las que ya no necesites. Cada archivo tiene hasta 10.000 filas; si hay más, se divide en partes."
    />

    <ExportsDataExportsBrowser
      ref="browser"
      scope="mine"
    />
  </UPageBody>
</template>
