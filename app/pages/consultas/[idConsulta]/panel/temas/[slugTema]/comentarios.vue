<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

definePageMeta({
  layout: 'tema-consulta-control-panel',
  middleware: ['consultation-manager', 'consultation-topics-disabled']
})

usePrivatePageSeo('Comentarios del tema')

const { consultationId, topicSlug, data: topic } = useTopicAdmin()
interface ModerationActions {
  refresh: () => Promise<void>
  exportCsv: () => void
  status: string
  requesting: boolean
}

const moderation = useTemplateRef<ModerationActions>('moderation')

const headerLinks = computed<ButtonProps[]>(() => [
  {
    label: 'Actualizar',
    icon: 'lucide:refresh-cw',
    color: 'neutral',
    variant: 'subtle',
    loading: moderation.value?.status === 'pending',
    onClick: () => moderation.value?.refresh()
  },
  {
    label: 'Exportar CSV',
    icon: 'lucide:file-down',
    color: 'neutral',
    variant: 'subtle',
    loading: moderation.value?.requesting,
    onClick: () => moderation.value?.exportCsv()
  }
])
</script>

<template>
  <UPage>
    <UPageHeader
      title="Comentarios"
      description="Moderá los comentarios de este tema de participación."
      :links="headerLinks"
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
        ref="moderation"
        :consultation-id="consultationId"
        :topic-slug="topicSlug"
      />
    </UPageBody>
  </UPage>
</template>
