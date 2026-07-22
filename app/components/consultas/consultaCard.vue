<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { PublicConsultationListItem } from '~/types/consulta'

const props = defineProps<{
  consultation: PublicConsultationListItem
}>()

/** Estado combinado (visibilidad + estado temporal) como badge. */
const badge = computed<BadgeProps>(() => {
  const estado = consultationStateBadge(props.consultation.visibility, props.consultation.participationState)
  return { label: estado.label, color: estado.color, icon: estado.icon, variant: 'subtle' }
})

/** Destino público de la consulta. */
const to = computed(() => `/consultas/${props.consultation.slug}`)

/** Descripción breve con fallback. */
const description = computed(() =>
  props.consultation.summary || props.consultation.body || 'Sin descripción breve.'
)

/** Etiqueta "N tema(s)" cuando el endpoint provee el conteo. */
const topicsLabel = computed(() => {
  const count = props.consultation.topicsCount
  if (count === null || count === undefined) return null
  return `${count} ${count === 1 ? 'tema' : 'temas'}`
})
</script>

<template>
  <UBlogPost
    :title="consultation.title"
    :description="description"
    :badge="badge"
    :to="to"
    orientation="vertical"
    variant="subtle"
    class="group h-full"
  >
    <template #header>
      <div class="relative aspect-video overflow-hidden rounded-t-lg">
        <img
          v-if="consultation.coverUrl"
          :src="consultation.coverUrl"
          :alt="consultation.coverAltText ?? consultation.title"
          class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        >
        <div
          v-else
          class="flex size-full items-center justify-center bg-linear-to-br from-primary-400/40 to-primary-600/20 dark:from-primary-400/15 dark:to-primary-700/10"
        >
          <UIcon
            name="lucide:megaphone"
            class="size-10 text-primary-500/60"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <USeparator class="mb-1" />
      <div class="flex flex-col gap-2 px-6 py-2">
        <div
          v-if="consultation.categories.length > 0 || consultation.tags.length > 0"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="category in consultation.categories"
            :key="`category-${category.id}`"
            :label="category.name"
            color="primary"
            variant="soft"
            size="sm"
          />
          <UBadge
            v-for="tag in consultation.tags"
            :key="`tag-${tag.id}`"
            :label="tag.name"
            color="neutral"
            variant="soft"
            size="sm"
          />
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span
            v-if="consultation.section"
            class="inline-flex items-center gap-1"
          >
            <UIcon
              name="lucide:folder"
              class="size-3.5"
            />
            {{ consultation.section.name }}
          </span>
          <span
            v-if="topicsLabel"
            class="inline-flex items-center gap-1"
          >
            <UIcon
              name="lucide:list"
              class="size-3.5"
            />
            {{ topicsLabel }}
          </span>
          <span class="inline-flex items-center gap-1">
            <UIcon
              name="lucide:calendar"
              class="size-3.5"
            />
            {{ formatDateShort(consultation.startsAt) }}
            <template v-if="consultation.endsAt"> – {{ formatDateShort(consultation.endsAt) }}</template>
          </span>
        </div>
      </div>
    </template>
  </UBlogPost>
</template>
