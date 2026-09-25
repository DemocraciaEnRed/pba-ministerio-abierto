<script setup lang="ts">
import { consultationTypeAllowsRegistrationForm } from '#shared/data/consultation-types'
import type { AdminConsultationListItem, ResultsVisibility } from '~/types/consulta'

const props = defineProps<{
  consultation: AdminConsultationListItem
}>()

const estadoBadge = computed(() =>
  consultationStateBadge(props.consultation.visibility, props.consultation.participationState)
)

const formatLabel = computed(() =>
  props.consultation.consultationFormat === 'single' ? 'Única' : 'Múltiple'
)

const allowsRegistrationForm = computed(() =>
  consultationTypeAllowsRegistrationForm(props.consultation.section?.slug)
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

const panelTo = computed(() => `/consultas/${props.consultation.slug}/panel`)
const editTo = computed(() => `${panelTo.value}/editar`)
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
        <UBadge
          v-if="allowsRegistrationForm && consultation.hasRegistrationForm"
          label="Con formulario de inscripción"
          icon="i-lucide-clipboard-check"
          color="success"
          variant="subtle"
          size="sm"
        />
        <UBadge
          v-else-if="allowsRegistrationForm"
          label="Sin formulario de inscripción"
          icon="i-lucide-clipboard-x"
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
        <UFieldGroup
          v-if="consultation.region"
          size="sm"
        >
          <UBadge
            label="Región"
            color="neutral"
            variant="outline"
          />
          <UBadge
            :label="consultation.region.name"
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
        <div
          v-for="group in consultation.observatoryWorkGroups"
          :key="`work-group-${group.id}`"
          class="flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1"
          :style="{ backgroundColor: group.color }"
        >
          <UIcon
            :name="group.icon"
            class="size-3.5"
            :style="{ color: group.iconColor }"
          />
          <span
            class="text-xs font-medium"
            :style="{ color: group.iconColor }"
          >{{ group.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
