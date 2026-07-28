<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

definePageMeta({
  layout: 'encuentros-regionales-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Ver Formulario - Encuentros Regionales')

const headerButtons = ref<ButtonProps[]>([
  {
    label: 'Actualizar',
    icon: 'lucide:refresh-cw'
  }
])
</script>

<template>
  <div>
    <UPageHeader
      title="Ver Formulario"
      description="Detalle del formulario con aportes de los ciudadanos para los Encuentros Regionales."
      :links="headerButtons"
    />
    <UPageBody>
      <UAlert
        color="neutral"
        variant="soft"
        title="En construccion"
        description="Esta sección está en construcción."
      />
    </UPageBody>
  </div>
</template>
