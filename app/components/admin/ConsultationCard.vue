<script setup lang="ts">
import type { AdminConsultationListItem, ConsultationTopicSummary, ResultsVisibility } from '~/types/consulta'

const props = defineProps<{
  consultation: AdminConsultationListItem
}>()

const estadoBadge = computed(() =>
  consultationStateBadge(props.consultation.visibility, props.consultation.participationState)
)

const formatLabel = computed(() =>
  props.consultation.consultationFormat === 'single' ? 'Única' : 'Múltiple'
)

const resultsVisibilityLabels: Record<ResultsVisibility, string> = {
  hidden: 'Resultados ocultos',
  participants_only: 'Resultados para participantes',
  public: 'Resultados públicos'
}

const resultsVisibilityLabel = computed(() =>
  resultsVisibilityLabels[props.consultation.resultsVisibility]
)

// La consulta puede no tener fecha de inicio (aún sin programar) ni fecha de
// cierre (participación abierta indefinidamente).
const startLabel = computed(() =>
  props.consultation.startsAt ? formatDateShort(props.consultation.startsAt) : 'Sin fecha de inicio'
)

const endLabel = computed(() =>
  props.consultation.endsAt ? formatDateShort(props.consultation.endsAt) : 'Abierta indefinidamente'
)

const topics = computed(() => props.consultation.topics ?? [])

const panelTo = computed(() => `/consultas/${props.consultation.slug}/panel`)
const editTo = computed(() => `${panelTo.value}/editar`)
const topicsTo = computed(() => `${panelTo.value}/temas`)

function topicPanelTo(topicSlug: string) {
  return `${topicsTo.value}/${topicSlug}`
}

function topicBadge(topic: ConsultationTopicSummary) {
  return topicStateBadge(topic.visibility, topic.participationState)
}
</script>

<template>
  <div class="rounded-lg border border-accented bg-elevated/30 transition-colors hover:border-primary/50">
    <!-- Cabecera: título, estado y acciones -->
    <div class="flex items-start justify-between gap-3 p-4">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <ULink
            :to="panelTo"
            class="truncate text-lg font-semibold text-highlighted hover:text-primary"
          >
            {{ consultation.title }}
          </ULink>
          <UIcon
            v-if="consultation.featured"
            name="i-lucide-star"
            class="size-4 shrink-0 text-warning"
            aria-label="Destacada"
          />
          <UBadge
            :label="estadoBadge.label"
            :color="estadoBadge.color"
            :icon="estadoBadge.icon"
            variant="subtle"
          />
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          label="Editar"
          icon="i-lucide-pencil"
          color="neutral"
          variant="outline"
          size="sm"
          :to="editTo"
        />
        <UButton
          label="Abrir panel"
          icon="i-lucide-layout-dashboard"
          color="primary"
          variant="soft"
          size="sm"
          :to="panelTo"
        />
      </div>
    </div>

    <USeparator />

    <!-- Cuerpo: resumen + metadatos -->
    <div class="space-y-2 p-4">
      <p class="line-clamp-2 text-xs text-muted">
        {{ consultation.summary || consultation.body || 'Sin descripción breve.' }}
      </p>
      <!-- Fechas -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-calendar-plus"
            class="size-3.5"
          />
          Inicio: <span class="text-toned">{{ startLabel }}</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-calendar-x"
            class="size-3.5"
          />
          Cierre: <span class="text-toned">{{ endLabel }}</span>
        </span>
      </div>

      <!-- Metadatos: formato, resultados, taxonomía -->
      <div class="flex flex-wrap items-center gap-1.5">
        <UBadge
          :label="formatLabel"
          icon="i-lucide-layers"
          color="neutral"
          variant="outline"
          size="sm"
        />
        <UBadge
          :label="resultsVisibilityLabel"
          icon="i-lucide-bar-chart-3"
          color="neutral"
          variant="outline"
          size="sm"
        />
        <UFieldGroup
          v-if="consultation.section"
          size="sm"
        >
          <UBadge
            label="Sección"
            color="neutral"
            variant="outline"
          />
          <UBadge
            :label="consultation.section.name"
            color="neutral"
            variant="subtle"
          />
        </UFieldGroup>
        <UBadge
          v-for="category in consultation.categories"
          :key="`cat-${category.id}`"
          :label="category.name"
          :color="category.isPrimary ? 'primary' : 'neutral'"
          variant="subtle"
          size="sm"
        />
        <UBadge
          v-for="tag in consultation.tags"
          :key="`tag-${tag.id}`"
          :label="`#${tag.name}`"
          color="neutral"
          variant="soft"
          size="sm"
        />
      </div>
    </div>

    <USeparator />

    <!-- Temas de participación -->
    <div class="p-1">
      <UCollapsible v-if="topics.length">
        <UButton
          class="group"
          color="neutral"
          variant="ghost"
          size="sm"
          block
          trailing-icon="i-lucide-chevron-down"
          :ui="{
            base: 'justify-between',
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        >
          <span class="inline-flex items-center gap-2">
            <UIcon
              name="i-lucide-list-checks"
              class="size-4"
            />
            Temas de participación
            <UBadge
              :label="String(topics.length)"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </span>
        </UButton>

        <template #content>
          <ul
            class="divide-y divide-default rounded-md border border-default mt-1"
          >
            <li
              v-for="topic in topics"
              :key="`topic-${topic.id}`"
              class="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div class="flex min-w-0 items-center gap-2">
                <span class="truncate text-xs font-medium text-toned">{{ topic.title }}</span>
                <UBadge
                  :label="topicBadge(topic).label"
                  :color="topicBadge(topic).color"
                  :icon="topicBadge(topic).icon"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <UButton
                label="Panel"
                icon="i-lucide-arrow-right"
                trailing
                color="neutral"
                variant="ghost"
                size="xs"
                :to="topicPanelTo(topic.slug)"
              />
            </li>
          </ul>
        </template>
      </UCollapsible>

      <!-- Estado vacío -->
      <div
        v-else
        class="flex items-center justify-between gap-3 rounded-md border border-dashed border-default px-3 py-2"
      >
        <p class="text-xs text-muted">
          Esta consulta todavía no tiene temas de participación.
        </p>
        <UButton
          label="Gestionar temas"
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="xs"
          :to="topicsTo"
        />
      </div>
    </div>
  </div>
</template>
