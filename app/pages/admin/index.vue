<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Administración')

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
      title="Administración"
      description="Panel de administración de la plataforma de consultas ciudadanas."
      :links="headerButtons"
    />
    <UPageBody>
      Contenido del panel de administración
    </UPageBody>
  </div>
</template>
