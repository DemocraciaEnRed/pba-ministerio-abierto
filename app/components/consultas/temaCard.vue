<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { ConsultationTopic } from '~/types/consulta'

const props = defineProps<{
  tema: ConsultationTopic
}>()

const route = useRoute()

/** Badge según el estado de participación del tema. */
const badge = computed<BadgeProps>(() =>
  props.tema.participationOpen
    ? { label: 'Participación abierta', color: 'success', variant: 'subtle' }
    : { label: 'Participación cerrada', color: 'neutral', variant: 'subtle' }
)

/** Destino del tema dentro de la consulta actual. */
const to = computed(() => `/consultas/${route.params.slugConsulta}/temas/${props.tema.slug}`)
</script>

<template>
  <UBlogPost
    :title="tema.title"
    :description="tema.summary || tema.body || ''"
    :badge="badge"
    :to="to"
    orientation="vertical"
    variant="subtle"
    class="group h-full my-2"
  >
    <template #header>
      <div class="relative aspect-video overflow-hidden rounded-t-lg">
        <img
          v-if="tema.coverUrl"
          :src="tema.coverUrl"
          :alt="tema.coverAltText ?? tema.title"
          class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        >
        <div
          v-else
          class="flex size-full items-center justify-center bg-linear-to-br from-primary-400/40 to-primary-600/20 dark:from-primary-400/15 dark:to-primary-700/10"
        >
          <UIcon
            name="lucide:message-square-text"
            class="size-10 text-primary-500/60"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <USeparator class="" />

      <div class="px-6 py-2">
        <p
          v-if="tema.participationEndsAt"
          class="text-xs text-muted"
        >
          Cierra
          <NuxtTime
            :datetime="tema.participationEndsAt"
            relative
            locale="es-AR"
          />
        </p>
      </div>
    </template>
  </UBlogPost>
</template>
